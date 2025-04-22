import { AstNode } from "langium";
import {
  Expression,
  isBinaryExpression,
  isCharExpression,
  isNumberExpression,
  isPostfixExpression,
  isPrefixExpression,
  isSizeofExpression,
  isStringExpression,
  isSymbolExpression,
} from "../language/generated/ast";
import { CompilerRegs, ILValue, ISymbol, SymbolType } from "./interface";
import { CompositeGeneratorNode, expandTracedToNode, JoinOptions, joinToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";
import {
  applyAssignment,
  applyAssignOperation,
  applyAddition,
  applySubtraction,
  applyMultiplication,
  applyModulus,
  applyBitwise,
  applyLogical,
  applyComparison,
} from "./binary";
import { compilePostfixExpression, compilePrefixExpression } from "./unary";
import {
  compileSymbolExpression,
  compileNumberExpression,
  compileStringExpression,
  compileCharExpression,
  compileSizeofExpression,
} from "./primary";

export const FETCH = 1;
export const NL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

export class AstNodeError extends Error {
  constructor(node: AstNode, message: string) {
    const position = node.$cstNode!.range.start;
    super(`${message} @${position.line + 1}:${position.character + 1}`);
  }
}

export interface ExpressionResult {
  reg: CompilerRegs;
  lval: ILValue;
  node: CompositeGeneratorNode;
}

/**
 * Retrieve a static or indirect symbol value and store in HL
 * HL=ram[symbol] if lval.indirect==0
 * HL=ram[reg] if lval.indirect > 0, ie reg=&symbol
 */
export function rvalue(scc: ScCompiler, res: ExpressionResult) {
  let lines: string[];
  if (res.lval.symbol != 0 && res.lval.indirect == 0) {
    // lval is a static memory cell
    lines = scc.generator.gen_get_memory(res.lval.symbol);
    // lines will be
    //
  } else {
    // HL contains &int
    // call ccgint
    lines = scc.generator.gen_get_indirect(res.lval.indirect, res.reg);
    // HL now contains value of int
  }
  res.reg = CompilerRegs.HL_REG;
  return lines;
}

export function store(scc: ScCompiler, lval: ILValue) {
  if (lval.indirect == 0) return scc.generator.gen_put_memory(lval.symbol as ISymbol);
  else return scc.generator.gen_put_indirect(lval.indirect);
}

export const leafNode = (node: AstNode, lines: string[]) => {
  return expandTracedToNode(node)`
    ${joinToNode(lines)}
  `;
};

export function compileExpression(scc: ScCompiler, expression: Expression, asStatement = false): ExpressionResult {
  const res = compileSubExpression(scc, expression);
  if (res.reg & FETCH) {
    // hl|de = &symbol so need to retrieve symbol value from ram
    // hl = symbol value
    res.node = res.node.append(joinToNode(rvalue(scc, res), NL));
  }
  if (asStatement) {
    res.node = expandTracedToNode(expression)`  ${res.node}`;
  }
  return res;
}

export function compileSubExpression(scc: ScCompiler, expression: Expression): ExpressionResult {
  switch (true) {
    case isBinaryExpression(expression):
      switch (expression.operator) {
        case "=":
          return applyAssignment(scc, expression);
        case "+=":
        case "-=":
        case "*=":
        case "/=":
        case "%=":
        case ">>=":
        case "<<=":
        case "&=":
        case "^=":
        case "|=":
          return applyAssignOperation(scc, expression);
        case "+":
          return applyAddition(scc, expression);
        case "-":
          return applySubtraction(scc, expression);
        case "*":
        case "/":
          return applyMultiplication(scc, expression);
        case "%":
          return applyModulus(scc, expression);
        case "&":
        case "|":
        case "^":
        case "<<":
        case ">>":
          return applyBitwise(scc, expression.operator, expression);
        case "&&":
        case "||":
          return applyLogical(scc, expression.operator, expression);
        case "==":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
          return applyComparison(scc, expression.operator, expression);
        default:
          throw new AstNodeError(expression, `Unimplemented binary expression operator ${expression}`);
      }
    case isPrefixExpression(expression):
      return compilePrefixExpression(scc, expression);
    case isPostfixExpression(expression):
      return compilePostfixExpression(scc, expression);
    case isNumberExpression(expression):
      return compileNumberExpression(scc, expression);
    case isStringExpression(expression):
      return compileStringExpression(scc, expression);
    case isCharExpression(expression):
      return compileCharExpression(scc, expression);
    case isSymbolExpression(expression):
      return compileSymbolExpression(scc, expression);
    case isSizeofExpression(expression):
      return compileSizeofExpression(scc, expression);
    default:
      throw new AstNodeError(expression, "Unknown expression type found ");
  }
}

/**
 * true if val1 is int pointer or int array and val2 not pointer or array
 */
export function dbltest(val1: ILValue, val2: ILValue) {
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
export function result(lval: ILValue, lval2: ILValue) {
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

export function nosign(lval: ILValue) {
  if (lval.ptr_type || (lval.symbol && lval.symbol.type & SymbolType.UNSIGNED)) return 1;
  return 0;
}
