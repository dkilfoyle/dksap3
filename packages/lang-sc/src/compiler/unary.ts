import { CompilerRegs, ILValue, SymbolType } from "./interface";
import { expandToNode, expandTracedToNode, joinToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";
import { compileExpression, compileSubExpression, ExpressionResult, FETCH, NL, rvalue, store } from "./expression";
import { SymbolExpression, UnaryExpression } from "src/language/generated/ast";

function compileUnaryPrefixStar(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  // eg *str where str is declared as char *str;
  const symbolRes = compileExpression(scc, unary.value);
  // { reg = HL, lval: {indirect: CINT, ptr_type: CHAR, symbol: {name, identity:POINTER}}}
  // ie HL = str where str is an address
  symbolRes.lval.indirect = symbolRes.lval.symbol ? symbolRes.lval.ptr_type : SymbolType.CINT;
  symbolRes.lval.ptr_type = 0;
  // mark lval as being an address but no longer a pointer
  return { ...symbolRes, reg: FETCH | symbolRes.reg };
}

function compileUnaryPrefixAnd(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  // eg &y
  // so returning a pointer of type y.type
  const symbolRes = compileSubExpression(scc, unary.value);
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

  const node = expandTracedToNode(unary)`
      ${symbolRes.node}
      ${joinToNode(scc.generator.gen_immediate(symbolRes.lval.symbol.name), NL)}
    `;

  symbolRes.lval.indirect = symbolRes.lval.symbol.type;
  return { reg: CompilerRegs.HL_REG, node, lval: symbolRes.lval };
}

function compileUnaryPrefixPlusMinus(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const symbolRes = compileSubExpression(scc, unary.value);
  if ((symbolRes.reg & FETCH) == 0) throw Error("Unary ++ Need lval");
  const node = expandTracedToNode(unary)`
      ; ${unary.$cstNode!.text}
      ${symbolRes.node}
      ${symbolRes.lval.indirect ? joinToNode(scc.generator.gen_push(symbolRes.reg, symbolRes.lval), NL) : undefined}
      ${joinToNode(rvalue(scc, symbolRes), NL)}
      ${joinToNode(
        unary.prefix == "++"
          ? scc.generator.gen_increment_primary_reg(symbolRes.lval)
          : scc.generator.gen_decrement_primary_reg(symbolRes.lval),
        NL
      )}
      ${joinToNode(store(scc, symbolRes.lval), NL)}
    `;
  return { reg: CompilerRegs.HL_REG, lval, node };
}

function compileUnaryPrefixNegation(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const symbolRes = compileExpression(scc, unary.value);
  const getOpLines = () => {
    switch (unary.prefix) {
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
  const node = expandTracedToNode(unary)`
      ; ${unary.$cstNode!.text}
      ${symbolRes.node}
      ${joinToNode(getOpLines(), NL)}
    `;
  return { reg: CompilerRegs.HL_REG, lval, node };
}

export function compileUnaryExpression(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  switch (unary.prefix) {
    case "*":
      return compileUnaryPrefixStar(scc, unary);
    case "&":
      return compileUnaryPrefixAnd(scc, unary);
    case "--":
    case "++":
      return compileUnaryPrefixPlusMinus(scc, unary);
    case "-":
    case "~":
    case "!":
      return compileUnaryPrefixNegation(scc, unary);
    default:
      throw Error(`unary operator ${unary.prefix} not implemented yet`);
  }
}

export function compilePostfix(scc: ScCompiler, symbolRes: ExpressionResult, symbolExpression: SymbolExpression): ExpressionResult {
  const node = expandToNode`
    ${symbolRes.node}
    ; ${symbolExpression.postfix}
    ${symbolRes.lval.indirect ? joinToNode(scc.generator.gen_push(symbolRes.reg, symbolRes.lval), NL) : undefined}
    ${joinToNode(rvalue(scc, symbolRes), NL)}
    ${joinToNode(
      symbolExpression.postfix == "++"
        ? scc.generator.gen_increment_primary_reg(symbolRes.lval)
        : scc.generator.gen_decrement_primary_reg(symbolRes.lval),
      NL
    )}
    ${joinToNode(store(scc, symbolRes.lval), NL)}
    ${joinToNode(
      symbolExpression.postfix == "++"
        ? scc.generator.gen_decrement_primary_reg(symbolRes.lval)
        : scc.generator.gen_increment_primary_reg(symbolRes.lval),
      NL
    )}
  `;
  return { lval: symbolRes.lval, reg: CompilerRegs.HL_REG, node };
}
