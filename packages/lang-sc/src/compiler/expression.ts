import { AstNode, interruptAndCheck } from "langium";
import {
  BinaryExpression,
  Expression,
  GlobalVariableDeclaration,
  GlobalVarName,
  isBinaryExpression,
  isFunctionDeclaration,
  isGlobalVarName,
  isLocalVariableDeclaration,
  isLocalVarName,
  isNumberExpression,
  isParameterDeclaration,
  isSymbolExpression,
  isUnaryExpression,
  LocalVarName,
  ParameterDeclaration,
  SymbolExpression,
} from "../language/generated/ast";
import { ISymbol, symbol_table, SymbolIdentity, SymbolType } from "./SymbolTable";
import { Generator, generator } from "./Generator";
import { CompilerRegs, ILValue } from "./interface";
import { tag_table } from "./TagTable";

const FETCH = 1;

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

/**
 * Retrieve a static or indirect symbol value and store in HL
 */
function rvalue({ reg, lval }: ExpressionResult) {
  if (lval.symbol != 0 && lval.indirect == 0) {
    // lval is a static memory cell
    generator.gen_get_memory(lval.symbol);
  } else {
    // HL contains &int
    // call ccgint
    generator.gen_get_indirect(lval.indirect, reg);
    // HL now contains value of int
  }
  return CompilerRegs.HL_REG;
}

function store(lval: ILValue) {
  if ((lval.indirect = 0)) generator.gen_put_memory(lval.symbol as ISymbol);
  else generator.gen_put_indirect(lval.indirect);
}

export function compileExpression(expression: Expression) {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  if (isBinaryExpression(expression)) {
    const { left, right, operator } = expression;

    switch (operator) {
      case "=":
        return applyAssignment(left, right);
      case "+":
        return applyAddition(left, right);
      case "*":
      case "/":
        return applyMultiplication(left, right, operator);
      default:
        throw new AstNodeError(expression, "Unimplemented binary expression operator");
    }
  } else if (isSymbolExpression(expression)) {
    return compileSymbolExpression(expression);
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
  throw new AstNodeError(expression, "Unknown expression type found ");
}

function applyAssignment(left: Expression, right: Expression): ExpressionResult {
  if (!(isSymbolExpression(left) && isLocalVarName(left.element.ref))) throw new AstNodeError(left, "lhs of assignment must be variable");
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const leftResult = compileExpression(left);
  if ((leftResult.reg & FETCH) == 0) throw Error("Need lval");
  if (leftResult.lval.indirect) generator.gen_push(leftResult.reg);
  const rightResult = compileExpression(right);
  if (rightResult.reg & 1) rvalue(rightResult);
  store(leftResult.lval);
  return { reg: 0, lval };
}

function applyAddition(left: Expression, right: Expression): ExpressionResult {
  generator.gen_comment(`${left.$cstNode!.text} + ${right.$cstNode!.text}`);
  generator.gen_comment(`Compile lhs: ${left.$cstNode!.text}`);
  const leftResult = compileExpression(left);
  let k = leftResult.reg;
  // HL = &left
  if (leftResult.reg & FETCH) k = rvalue(leftResult);
  // HL = *left
  if (leftResult.lval.indirect) generator.gen_push(k);
  // top of stack now contains *left

  generator.gen_comment(`Compile rhs: ${right.$cstNode!.text}`);
  const rightResult = compileExpression(right);
  // HL = &right
  if (rightResult.reg & 1) rvalue(rightResult);
  // HL = *right

  if (dbltest(leftResult.lval, rightResult.lval)) {
    // eg mypointer + myint
    // eg myarray + myint
    // if so then myint index *= pointertype size
    generator.gen_comment("HL *= sizeof(left) if left is pointerffset by 2 or struct array index by size");
    generator.gen_multiply(leftResult.lval.ptr_type, leftResult.lval.tagsym ? leftResult.lval.tagsym.size : Generator.INTSIZE);
  }

  generator.gen_comment("add HL(rhs) and DE(lhs)");
  generator.gen_add(leftResult.lval, rightResult.lval);
  // pop d ; d = *left
  // dad d; hl = hl + d ie right = right + left

  result(leftResult.lval, rightResult.lval);
  return { reg: 0, lval: leftResult.lval };
}

function applyMultiplication(left: Expression, right: Expression, op: "*" | "/"): ExpressionResult {
  generator.gen_comment(`${left.$cstNode!.text} ${op} ${right.$cstNode!.text}`);
  generator.gen_comment(`Compile lhs: ${left.$cstNode!.text}`);
  const leftResult = compileExpression(left);
  let k = leftResult.reg;
  // HL = &left
  if (leftResult.reg & FETCH) k = rvalue(leftResult);
  // HL = *left
  generator.gen_push(k);
  // top of stack now contains *left

  generator.gen_comment(`Compile rhs: ${right.$cstNode!.text}`);
  const rightResult = compileExpression(right);
  // HL = &right
  if (rightResult.reg & 1) rvalue(rightResult);
  // HL = *right

  if (op == "*") {
    generator.gen_comment("multiply HL(rhs) and DE(lhs)");
    generator.gen_mult();
  } else if (op == "/") {
    nosign(leftResult.lval) || nosign(rightResult.lval) ? generator.gen_udiv() : generator.gen_div();
  }
  // pop d ; d = *left
  // dad d; hl = hl + d ie right = right + left

  return { reg: 0, lval: leftResult.lval };
}

function compileSymbolExpression(symbolExpression: SymbolExpression): { reg: number; lval: ILValue } {
  const ref = symbolExpression.element.ref;
  let res;
  switch (true) {
    case isFunctionDeclaration(ref):
      throw new AstNodeError(symbolExpression, "Function call expression not implemented yet");
    // res = compileFunctionCall(symbolExpression);
    // break;
    case isLocalVarName(ref):
    case isParameterDeclaration(ref):
      res = compileLocalVariableReference(ref);
      break;
    case isGlobalVarName(ref):
      res = compileGlobalVariableReference(ref);
      break;
    // case isStructReference(symbolExpression):
    //   return compileStructReference(symbolExpression);
    // case isStructMemberReference(symbolExpression):
    //   return compileStructMemberReference(symbolExpression);
    default:
      throw new AstNodeError(symbolExpression, "Trying to compile unknown symbol expression");
  }
  if (symbolExpression.indexExpression) throw new AstNodeError(symbolExpression, "Array indexing not implemented");
  return res;
}

function compileFunctionCall(funcCall: SymbolExpression) {
  // const args = funcCall.arguments.map((e) => compileExpression(e));
}

function compileLocalVariableReference(localVar: LocalVarName | ParameterDeclaration) {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let sym_idx;
  if ((sym_idx = symbol_table.find_local(localVar.name)) > -1) {
    const symbol = symbol_table.symbols[sym_idx];

    const reg = generator.gen_get_locale(symbol); // hl = &local
    // lxi h, stack offset of symbol
    // dap sp ; hl = &symbol

    lval.symbol = symbol;
    lval.indirect = symbol.type;
    // memberCall returns &symbol

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
  } else throw new AstNodeError(localVar, `${localVar.name} not in local symbol table`);
}

function compileGlobalVariableReference(globalVar: GlobalVarName) {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let sym_idx;
  if ((sym_idx = symbol_table.find_global(globalVar.name)) > -1) {
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
  throw new AstNodeError(globalVar, `${globalVar.name} not in global symbol table`);
}

/**
 * true if val1 is int pointer or int array and val2 not pointer or array
 */
function dbltest(val1: ILValue, val2: ILValue) {
  if (val1 == null) return false;
  if (val1.ptr_type) {
    if (val1.ptr_type & SymbolType.CCHAR) return false;
    if (val2.ptr_type) return false;
    return true;
  }
  return false;
}

/**
 * determine type of binary operation
 * @return update lval
 */
function result(lval: ILValue, lval2: ILValue) {
  if (lval.ptr_type && lval2.ptr_type) {
    // pointer op pointer
    lval.ptr_type = 0;
  } else if (lval2.ptr_type) {
    // int op pointer
    lval.symbol = lval2.symbol;
    lval.indirect = lval2.indirect;
    lval.ptr_type = lval2.ptr_type;
  }
  // lval unchanged
}

function nosign(x: ILValue) {
  let ptr: ISymbol | 0;
  if (x.ptr_type || ((ptr = x.symbol) && ptr.type & 1)) return 1;
  return 0;
}
