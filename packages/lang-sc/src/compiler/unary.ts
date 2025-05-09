import { CompilerRegs, ILValue, SymbolType } from "./interface";
import { expandToNode, expandTracedToNode, joinToNode } from "langium/generate";
import { AppendNL, ScCompiler } from "./sc-compiler";
import { compileExpression, compileSubExpression, ExpressionResult, FETCH, rvalue, store } from "./expression";
import { PostfixExpression, PrefixExpression, SymbolExpression } from "src/language/generated/ast";

function compilePrefixStar(scc: ScCompiler, expr: PrefixExpression): ExpressionResult {
  // eg *str where str is declared as char *str;
  const symbolRes = compileExpression(scc, expr.operand);
  // { reg = HL, lval: {indirect: CINT, ptr_type: CHAR, symbol: {name, identity:POINTER}}}
  // ie HL = str where str is an address
  symbolRes.lval.indirect = symbolRes.lval.symbol ? symbolRes.lval.ptr_type : SymbolType.CINT;
  symbolRes.lval.ptr_type = 0;
  // mark lval as being an address but no longer a pointer
  return { ...symbolRes, reg: FETCH | symbolRes.reg };
}

function compilePrefixAnd(scc: ScCompiler, expr: PrefixExpression): ExpressionResult {
  // eg &y
  // so returning a pointer of type y.type
  const symbolRes = compileSubExpression(scc, expr.operand);
  if (symbolRes.lval.symbol == 0) throw Error("Can only address a symbol");

  if ((symbolRes.reg & FETCH) == 0) {
    if (symbolRes.lval.symbol.type != SymbolType.STRUCT) throw Error("illegal address");
    return { ...symbolRes, reg: 0 };
  }

  symbolRes.lval.ptr_type = symbolRes.lval.symbol.type;
  if (symbolRes.lval.indirect) {
    if (symbolRes.reg & CompilerRegs.DE_REG) {
      symbolRes.node.append("xchg");
    }
    symbolRes.reg = CompilerRegs.HL_REG;
    return symbolRes;
  }

  const node = expandTracedToNode(expr)`
      ${symbolRes.node}
      ${joinToNode(scc.generator.gen_immediate(symbolRes.lval.symbol.name), AppendNL)}
    `;

  symbolRes.lval.indirect = symbolRes.lval.symbol.type;
  return { reg: CompilerRegs.HL_REG, node, lval: symbolRes.lval };
}

function compilePrefixPlusMinus(scc: ScCompiler, expr: PrefixExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const symbolRes = compileSubExpression(scc, expr.operand);
  if ((symbolRes.reg & FETCH) == 0) throw Error("Unary ++ Need lval");
  const node = expandTracedToNode(expr)`
      ; ${expr.$cstNode!.text}
      ${symbolRes.node}
      ${symbolRes.lval.indirect ? joinToNode(scc.generator.gen_push(symbolRes.reg, symbolRes.lval), AppendNL) : undefined}
      ${joinToNode(rvalue(scc, symbolRes), AppendNL)}
      ${joinToNode(
        expr.operator == "++"
          ? scc.generator.gen_increment_primary_reg(symbolRes.lval)
          : scc.generator.gen_decrement_primary_reg(symbolRes.lval),
        AppendNL
      )}
      ${joinToNode(store(scc, symbolRes.lval), AppendNL)}
    `;
  return { reg: CompilerRegs.HL_REG, lval, node };
}

function compilePrefixNegation(scc: ScCompiler, expr: PrefixExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const symbolRes = compileExpression(scc, expr.operand);
  const getOpLines = () => {
    switch (expr.operator) {
      case "-":
        return scc.generator.gen_twos_complement();
      case "!":
        return scc.generator.gen_logical_negation();
      case "~":
        return scc.generator.gen_complement();
      default:
        throw Error();
    }
  };
  const node = expandTracedToNode(expr)`
      ; ${expr.$cstNode!.text}
      ${symbolRes.node}
      ${joinToNode(getOpLines(), AppendNL)}
    `;
  return { reg: CompilerRegs.HL_REG, lval, node };
}

export function compilePrefixExpression(scc: ScCompiler, expr: PrefixExpression): ExpressionResult {
  switch (expr.operator) {
    case "*":
      return compilePrefixStar(scc, expr);
    case "&":
      return compilePrefixAnd(scc, expr);
    case "--":
    case "++":
      return compilePrefixPlusMinus(scc, expr);
    case "-":
    case "~":
    case "!":
      return compilePrefixNegation(scc, expr);
    default:
      throw Error(`unary operator ${expr.operator} not implemented yet`);
  }
}

export function compilePostfixExpression(scc: ScCompiler, expr: PostfixExpression): ExpressionResult {
  const symbolRes = compileSubExpression(scc, expr.operand);
  const node = expandToNode`
    ${symbolRes.node}
    ${symbolRes.lval.indirect ? joinToNode(scc.generator.gen_push(symbolRes.reg, symbolRes.lval), AppendNL) : undefined}
    ${joinToNode(rvalue(scc, symbolRes), AppendNL)}
    ; ${expr.operator}
    ${joinToNode(
      expr.operator == "++" ? scc.generator.gen_increment_primary_reg(symbolRes.lval) : scc.generator.gen_decrement_primary_reg(symbolRes.lval),
      AppendNL
    )}
    ${joinToNode(store(scc, symbolRes.lval), AppendNL)}
    ${joinToNode(
      expr.operator == "++" ? scc.generator.gen_decrement_primary_reg(symbolRes.lval) : scc.generator.gen_increment_primary_reg(symbolRes.lval),
      AppendNL
    )}
  `;
  return { lval: symbolRes.lval, reg: CompilerRegs.HL_REG, node };
}
