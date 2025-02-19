import { AstNode, interruptAndCheck } from "langium";
import {
  BinaryExpression,
  Expression,
  isBinaryExpression,
  isFunctionDeclaration,
  isMemberCall,
  isNumberExpression,
  isParameter,
  isUnaryExpression,
  isVariableDeclaration,
  MemberCall,
} from "../language/generated/ast";
import { ISymbol, symbol_table, SymbolIdentity, SymbolType } from "./SymbolTable";
import { generator } from "./Generator";
import { CompilerRegs, ILValue } from "./interface";
import { tag_table } from "./TagTable";

class AstNodeError extends Error {
  constructor(node: AstNode, message: string) {
    const position = node.$cstNode!.range.start;
    super(`${message} @${position.line + 1}:${position.character + 1}`);
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

interface ExpressionResult {
  reg: number;
  lval: ILValue;
}

function rvalue({ reg, lval }: ExpressionResult) {
  if (lval.symbol != 0 && lval.indirect == 0) generator.gen_get_memory(lval.symbol);
  else generator.gen_get_indirect(lval.indirect, reg);
  return CompilerRegs.HL_REG;
}

function store(lval: ILValue) {
  if ((lval.indirect = 0)) generator.gen_put_memory(lval.symbol as ISymbol);
  else generator.gen_put_indirect(lval.indirect);
}

export function compileExpression(expression: Expression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  if (isBinaryExpression(expression)) {
    const { left, right, operator } = expression;

    const leftValue = compileExpression(left);
    if (operator === "=") {
      if ((leftValue.reg & 1) == 0) throw Error("Need lval");
      if (leftValue.lval.indirect) generator.gen_push(leftValue.reg);
      const rightValue = compileExpression(right);
      if (rightValue.reg & 1) rvalue(rightValue);
      store(leftValue.lval);
      return applyAssignment(left, rightValue);
    }
    const rightValue = compileExpression(right);
    if (operator === "+") {
      return applyOperator(expression, operator, leftValue, rightValue, (e) => isNumber(e));
    } else if (["-", "*", "/", "<", "<=", ">", ">="].includes(operator)) {
      return applyOperator(expression, operator, leftValue, rightValue, (e) => isNumber(e));
    } else if (["and", "or"].includes(operator)) {
      return applyOperator(expression, operator, leftValue, rightValue, (e) => isNumber(e));
    } else if (["==", "!="].includes(operator)) {
      return applyOperator(expression, operator, leftValue, rightValue);
    }
  } else if (isMemberCall(expression)) {
    return runMemberCall(expression);
  } else if (isUnaryExpression(expression)) {
    throw Error("unary expressions not yet implemented");
    // const { operator, value } = expression;
    // const actualValue = compileExpression(value);
    // if (operator === "-") {
    //   if (typeof actualValue === "number") {
    //     return -actualValue;
    //   } else {
    //     throw new AstNodeError(expression, `Cannot apply operator '${operator}' to value of type '${typeof actualValue}'`);
    //   }
    // } else if (operator === "!") {
    //   if (typeof actualValue === "boolean") {
    //     return !actualValue;
    //   } else {
    //     throw new AstNodeError(expression, `Cannot apply operator '${operator}' to value of type '${typeof actualValue}'`);
    //   }
    // }
  } else if (isNumberExpression(expression)) {
    generator.gen_immediate(expression.value);
    return { reg: 0, lval };
  }
  throw new AstNodeError(expression, "Unknown expression type found " + expression.$type);
}

function applyAssignment(left: Expression, right: ExpressionResult): ExpressionResult {
  if (isMemberCall(left)) {
    if (left.explicitOperationCall) {
      // Just quietly return from operation call
      runMemberCall(left);
      return right;
    }
    const ref = left.element?.ref;
    if (isVariableDeclaration(ref)) {
    }
  } else {
    throw new AstNodeError(left, "Cannot assign anything to constant");
  }
  return right;
}

function runMemberCall(memberCall: MemberCall): { reg: number; lval: ILValue } {
  const ref = memberCall.element?.ref;
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };

  if (isFunctionDeclaration(ref)) {
    if (memberCall.explicitOperationCall) {
      const args = memberCall.arguments.map((e) => compileExpression(e));
      // await runLoxElement(func.body, context, returnFn);
      // return functionValue;
      throw new AstNodeError(memberCall, "Function call in expression not implemented yet");
    } else {
      throw new AstNodeError(memberCall, "Cannot call a non-function");
    }
  } else if (isVariableDeclaration(ref) || isParameter(ref)) {
    let sym_idx;
    if ((sym_idx = symbol_table.find_local(ref.name)) > -1) {
      const symbol = symbol_table.symbols[sym_idx];
      const reg = generator.gen_get_locale(symbol);
      lval.symbol = symbol;
      lval.indirect = symbol.type;
      if (symbol.type == SymbolType.STRUCT) {
        lval.tagsym = tag_table.tags[symbol.tagidx!];
      }
      if (symbol.identity == SymbolIdentity.ARRAY || (symbol.identity == SymbolIdentity.VARIABLE && symbol.type == SymbolType.STRUCT)) {
        lval.ptr_type = symbol.type;
        return { reg, lval };
      }
      if (symbol.identity == SymbolIdentity.POINTER) {
        lval.indirect = SymbolType.CINT;
        lval.ptr_type = symbol.type;
      }
      return { reg: 1 | reg, lval };
    }
    if ((sym_idx = symbol_table.find_global(ref.name)) > -1) {
      const symbol = symbol_table.symbols[sym_idx];
      if (symbol.identity != SymbolIdentity.FUNCTION) {
        lval.symbol = symbol;
        lval.indirect = 0;
        if (symbol.type == SymbolType.STRUCT) {
          lval.tagsym = tag_table.tags[symbol.tagidx!];
        }
        if (symbol.identity != SymbolIdentity.ARRAY && (symbol.identity != SymbolIdentity.VARIABLE || symbol.type != SymbolType.STRUCT)) {
          if (symbol.identity == SymbolIdentity.POINTER) {
            lval.ptr_type = symbol.type;
          }
          return { reg: 1 | CompilerRegs.HL_REG, lval };
        }
        generator.gen_immediate(symbol.name); // lxi h, varname
        lval.indirect = symbol.type;
        lval.ptr_type = symbol.type;
        return { reg: 0, lval };
      }
    }
  } else throw Error();
  return { reg: 0, lval };
}

function applyOperator(
  node: BinaryExpression,
  operator: string,
  left: unknown,
  right: unknown,
  check?: (value: unknown) => boolean
): { reg: number; lval: ILValue } {
  if (check && (!check(left) || !check(right))) {
    throw new AstNodeError(node, `Cannot apply operator '${operator}' to values of type '${typeof left}' and '${typeof right}'`);
  }

  throw Error();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const anyLeft = left as any;
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const anyRight = right as any;
  // if (operator === "+") {
  //   return anyLeft + anyRight;
  // } else if (operator === "-") {
  //   return anyLeft - anyRight;
  // } else if (operator === "*") {
  //   return anyLeft * anyRight;
  // } else if (operator === "/") {
  //   return anyLeft / anyRight;
  // } else if (operator === "and") {
  //   return anyLeft && anyRight;
  // } else if (operator === "or") {
  //   return anyLeft || anyRight;
  // } else if (operator === "<") {
  //   return anyLeft < anyRight;
  // } else if (operator === "<=") {
  //   return anyLeft <= anyRight;
  // } else if (operator === ">") {
  //   return anyLeft > anyRight;
  // } else if (operator === ">=") {
  //   return anyLeft >= anyRight;
  // } else if (operator === "==") {
  //   return anyLeft === anyRight;
  // } else if (operator === "!=") {
  //   return anyLeft !== anyRight;
  // } else {
  //   throw new AstNodeError(node, `Operator ${operator} is unknown`);
  // }
}
