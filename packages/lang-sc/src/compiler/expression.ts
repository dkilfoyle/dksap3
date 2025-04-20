import { AstNode } from "langium";
import {
  BinaryExpression,
  CharExpression,
  Expression,
  FunctionDeclaration,
  GlobalVarName,
  isBinaryExpression,
  isCharExpression,
  isFunctionDeclaration,
  isGlobalVarName,
  isLocalVarName,
  isNumberExpression,
  isParameterDeclaration,
  isPrimitiveTypeReference,
  isSizeofExpression,
  isSizeofSymbol,
  isStringExpression,
  isStructTypeReference,
  isSymbolExpression,
  isUnaryExpression,
  LocalVarName,
  NumberExpression,
  ParameterDeclaration,
  SizeofExpression,
  StringExpression,
  SymbolExpression,
  UnaryExpression,
} from "../language/generated/ast";
import { AsmGenerator } from "./Generator";
import { CompilerRegs, ILValue, ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";
import { CompositeGeneratorNode, expandToNode, expandTracedToNode, JoinOptions, joinToNode, joinTracedToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";

const FETCH = 1;
const NL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

class AstNodeError extends Error {
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

function store(scc: ScCompiler, lval: ILValue) {
  if (lval.indirect == 0) return scc.generator.gen_put_memory(lval.symbol as ISymbol);
  else return scc.generator.gen_put_indirect(lval.indirect);
}

const leafNode = (node: AstNode, lines: string[]) => {
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

function compileSubExpression(scc: ScCompiler, expression: Expression): ExpressionResult {
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
          throw new AstNodeError(expression, `Unimplemented binary expression operator ${expression.operator}`);
      }
    case isSymbolExpression(expression):
      return compileSymbolExpression(scc, expression);
    case isUnaryExpression(expression):
      return compileUnaryExpression(scc, expression);
    case isNumberExpression(expression):
      return compileNumberExpression(scc, expression);
    case isStringExpression(expression):
      return compileStringExpression(scc, expression);
    case isCharExpression(expression):
      return compileCharExpression(scc, expression);
    case isSizeofExpression(expression):
      return compileSizeofExpression(scc, expression);
    default:
      throw new AstNodeError(expression, "Unknown expression type found ");
  }
}

function applyBitwise(scc: ScCompiler, op: "&" | "|" | "^" | ">>" | "<<", binary: BinaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const leftResult = compileExpression(scc, binary.left);

  const getLines = (op: "&" | "|" | "^" | ">>" | "<<") => {
    switch (op) {
      case "&":
        return scc.generator.gen_and();
      case "|":
        return scc.generator.gen_or();
      case "^":
        return scc.generator.gen_xor();
      case ">>":
        return nosign(leftResult.lval) ? scc.generator.gen_logical_shift_right() : scc.generator.gen_arithm_shift_right();
      case "<<":
        return scc.generator.gen_arithm_shift_left();
    }
  };

  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${leftResult.node}
    ${joinToNode(scc.generator.gen_push(leftResult.reg, `${(leftResult.lval.symbol as ISymbol).name}`))}
    ${compileExpression(scc, binary.right).node}
    ${joinToNode(getLines(op), NL)}
  `;
  return { reg: 0, lval, node };
}

function applyLogical(scc: ScCompiler, op: "&&" | "||", binary: BinaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;
  let lab = "UNDEFINEDLAB";

  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileExpression(scc, binary.left)).node}
    ${joinToNode(scc.generator.gen_test_jump((lab = `${scc.generator.get_label()}`), op == "||" ? 1 : 0), NL)}
    ${(rightResult = compileExpression(scc, binary.right)).node}
    ${lab}:
    ${joinToNode(scc.generator.gen_convert_primary_reg_value_to_bool(), NL)}
  `;
  return { reg: 0, lval, node };
}

function compileSizeofExpression(scc: ScCompiler, sizeexp: SizeofExpression): ExpressionResult {
  let size: number = 0;
  if (isSizeofSymbol(sizeexp.arg)) {
    const symbol_table_idx = isGlobalVarName(sizeexp.arg)
      ? scc.symbol_table.find_global(sizeexp.arg.name)
      : scc.symbol_table.find_local(sizeexp.arg.name);
    if (symbol_table_idx == -1) throw Error("sizeof unable to find symbol");
    const sym = scc.symbol_table.symbols[symbol_table_idx];
    if (sym.storage == SymbolStorage.LSTATIC) throw Error("sizeof local static");
    size = sym.offset; // FIXME: This is bug? offset for nonstatics is stk offset not size, should ISymbol have a precomputed size?
    if (sym.type & SymbolType.CINT || sym.identity == SymbolIdentity.POINTER) size *= AsmGenerator.INTSIZE;
    else if (sym.type == SymbolType.STRUCT) size *= scc.tag_table.tags[sym.tagidx!].size;
  } else {
    if (sizeexp.arg.pointer) {
      size = AsmGenerator.INTSIZE;
    } else {
      if (isPrimitiveTypeReference(sizeexp.arg)) {
        size = sizeexp.arg.type == "int" ? AsmGenerator.INTSIZE : 1;
      } else if (isStructTypeReference(sizeexp.arg)) {
        const otag = scc.tag_table.find(sizeexp.arg.structName.$refText);
        if (!otag) throw Error("sizeof unable to find struct in table");
        size = scc.tag_table.tags[otag].size;
      }
    }
  }
  const node = expandTracedToNode(sizeexp)`
    ; ${sizeexp.$cstNode?.text}
    ${joinToNode(scc.generator.gen_immediate(size), NL)}

  `;
  return { lval: { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 }, reg: 0, node };
}

function compileNumberExpression(scc: ScCompiler, numexp: NumberExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const lines = scc.generator.gen_immediate(numexp.value);
  return { reg: 0, lval, node: leafNode(numexp, lines) };
}

function compileStringExpression(scc: ScCompiler, strexp: StringExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const pos = scc.litq.length;
  scc.litq.push(...strexp.value.split("").map((x) => x.charCodeAt(0)));
  scc.litq.push(0); // 0 terminated
  // load h with the address of str[0]
  const lines = [`lxi h, $${scc.litlab}+${pos}`];
  return { reg: 0, lval, node: leafNode(strexp, lines) };
}

function compileCharExpression(scc: ScCompiler, charexp: CharExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const lines = [`lxi h, ${charexp.value.charCodeAt(1)}`];
  return { reg: 0, lval, node: leafNode(charexp, lines) };
}

function compileUnaryExpression(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  if (unary.prefix == "*") {
    // eg *str where str is declared as char *str;
    const symbolRes = compileExpression(scc, unary.value);
    // { reg = HL, lval: {indirect: CINT, ptr_type: CHAR, symbol: {name, identity:POINTER}}}
    // ie HL = str where str is an address
    symbolRes.lval.indirect = symbolRes.lval.symbol ? symbolRes.lval.ptr_type : SymbolType.CINT;
    symbolRes.lval.ptr_type = 0;
    // mark lval as being an address but no longer a pointer
    return { ...symbolRes, reg: FETCH | symbolRes.reg };
  } else if (unary.prefix == "&") {
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
  } else if (unary.prefix == "++" || unary.prefix == "--") {
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
  } else throw Error(`unary operator ${unary.prefix} not implemented yet`);
}

function applyAssignment(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  if (!(isSymbolExpression(binary.left) && isLocalVarName(binary.left.element.ref)))
    throw new AstNodeError(binary.left, "lhs of assignment must be variable");

  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;

  const node = expandTracedToNode(binary)`  ; ${binary.$cstNode!.text}
  ${(leftResult = compileSubExpression(scc, binary.left)).node}
  ${joinToNode(leftResult.lval.indirect ? scc.generator.gen_push(leftResult.reg, leftResult.lval) : [], NL)}
  ${(rightResult = compileExpression(scc, binary.right)).node}
  ; ${binary.operator}
  ${joinToNode(store(scc, leftResult.lval), NL)}`;
  return { reg: 0, lval, node };
}

function applyAssignOperation(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  if (!(isSymbolExpression(binary.left) && isLocalVarName(binary.left.element.ref)))
    throw new AstNodeError(binary.left, "lhs of assignment must be variable");

  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const leftResult = compileSubExpression(scc, binary.left);
  let rightResult: ExpressionResult;

  const doOp = (res: ExpressionResult, res2: ExpressionResult) => {
    const lines = [];
    switch (binary.operator) {
      case "+=":
        if (dbltest(res.lval, res2.lval)) {
          lines.push(...scc.generator.gen_multiply(res.lval.ptr_type, res.lval.tagsym ? res.lval.tagsym.size : AsmGenerator.INTSIZE));
        }
        lines.push(...scc.generator.gen_add(res.lval, res2.lval));
        result(res.lval, res2.lval);
        return lines;
      case "-=":
        if (dbltest(res.lval, res2.lval)) {
          lines.push(...scc.generator.gen_multiply(res.lval.ptr_type, res.lval.tagsym ? res.lval.tagsym.size : AsmGenerator.INTSIZE));
        }
        lines.push(...scc.generator.gen_sub());
        result(res.lval, res2.lval);
        return lines;
      case "*=":
        lines.push(...scc.generator.gen_mult());
        return lines;
      case "/=":
        lines.push(...(nosign(res.lval) && nosign(res2.lval) ? scc.generator.gen_udiv() : scc.generator.gen_div()));
        return lines;
      case "%=":
        lines.push(...(nosign(res.lval) && nosign(res2.lval) ? scc.generator.gen_umod() : scc.generator.gen_mod()));
        return lines;
      case ">>=":
        lines.push(...(nosign(res.lval) ? scc.generator.gen_logical_shift_right() : scc.generator.gen_arithm_shift_right()));
        return lines;
      case "<<=":
        lines.push(...scc.generator.gen_arithm_shift_left());
        return lines;
      case "&=":
        lines.push(...scc.generator.gen_and());
        return lines;
      case "^=":
        lines.push(...scc.generator.gen_xor());
        return lines;
      case "|=":
        lines.push(...scc.generator.gen_or());
        return lines;
    }
    throw Error();
  };

  const node = expandTracedToNode(binary)`  ; ${binary.$cstNode!.text}
  ${leftResult.node}
  ${joinToNode(leftResult.lval.indirect ? scc.generator.gen_push(leftResult.reg, leftResult.lval) : [], NL)}
  ${joinToNode(rvalue(scc, leftResult), NL)}
  ${joinToNode(scc.generator.gen_push(leftResult.reg, (leftResult.lval.symbol as ISymbol).name))}
  ${(rightResult = compileExpression(scc, binary.right)).node}
  ; ${binary.operator}
  ${joinToNode(doOp(leftResult, rightResult), NL)}
  ${joinToNode(store(scc, leftResult.lval), NL)}
`;
  return { reg: 0, lval, node };
}

function applyComparison(scc: ScCompiler, op: ">" | "<" | ">=" | "<=" | "==" | "!=", binary: BinaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;

  const gentest = (l: ILValue, r: ILValue) => {
    const unsigned = nosign(l) && nosign(r);
    switch (op) {
      case "<":
        return unsigned ? scc.generator.gen_unsigned_less_than() : scc.generator.gen_less_than();
      case "<=":
        return unsigned ? scc.generator.gen_unsigned_less_or_equal() : scc.generator.gen_less_or_equal();
      case ">":
        return unsigned ? scc.generator.gen_unsigned_greater_than() : scc.generator.gen_greater_than();
      case ">=":
        return unsigned ? scc.generator.gen_unsigned_greater_or_equal() : scc.generator.gen_greater_or_equal();
      case "==":
        return scc.generator.gen_equal();
      case "!=":
        return scc.generator.gen_not_equal();
    }
  };

  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileExpression(scc, binary.left)).node}
    ${joinToNode(scc.generator.gen_push(leftResult.reg, `${(leftResult.lval.symbol as ISymbol).name}`))}
    ${(rightResult = compileExpression(scc, binary.right)).node}
    ; doing test
    ${joinToNode(gentest(leftResult.lval, rightResult.lval), NL)}
  `;
  return { reg: 0, lval, node };
}

function applySubtraction(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;

  // if dbl can be pointer-int or pointer-pointer
  // if pointer-int then multiple int by int size
  // if pointer-pointer then divide result by two

  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileExpression(scc, binary.left)).node}
    ${joinToNode(scc.generator.gen_push(leftResult.reg, "push k"))}
    ${(rightResult = compileExpression(scc, binary.right)).node}
    ${
      dbltest(leftResult.lval, rightResult.lval)
        ? joinToNode(scc.generator.gen_multiply(leftResult.lval.ptr_type, leftResult.lval.tagsym ? leftResult.lval.tagsym.size : 2), NL)
        : undefined
    }
    ${joinToNode(scc.generator.gen_sub(), NL)}
    ${
      leftResult.lval.ptr_type & SymbolType.CINT && rightResult.lval.ptr_type & SymbolType.CINT
        ? joinToNode(scc.generator.gen_divide_by_two(), NL)
        : undefined
    }
  `;
  result(leftResult.lval, rightResult.lval);
  return { reg: 0, lval: leftResult.lval, node };
}

function applyAddition(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  let leftResult, rightResult: ExpressionResult;

  // if left is pointer and right is int, scale right
  // if left is int and right is pointer, scale left

  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileExpression(scc, binary.left)).node}
    ${joinToNode(scc.generator.gen_push(leftResult.reg, "push k"))}
    ${(rightResult = compileExpression(scc, binary.right)).node}
    ${
      dbltest(leftResult.lval, rightResult.lval)
        ? joinToNode(
            scc.generator.gen_multiply(leftResult.lval.ptr_type, leftResult.lval.tagsym ? leftResult.lval.tagsym.size : AsmGenerator.INTSIZE),
            NL
          )
        : undefined
    }
    ${joinToNode(scc.generator.gen_add(leftResult.lval, rightResult.lval), NL)}
  `;
  result(leftResult.lval, rightResult.lval);
  return { reg: 0, lval: leftResult.lval, node };
}

function applyModulus(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  let leftResult, rightResult: ExpressionResult;
  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileExpression(scc, binary.left)).node}
    ${joinToNode(scc.generator.gen_push(leftResult.reg, "push k"))}
    ${(rightResult = compileExpression(scc, binary.right)).node}
    ${joinToNode(nosign(leftResult.lval) && nosign(rightResult.lval) ? scc.generator.gen_umod() : scc.generator.gen_mod(), NL)}
  `;
  return { reg: 0, lval: leftResult.lval, node };
}

function applyMultiplication(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  let leftResult, rightResult: ExpressionResult;
  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileExpression(scc, binary.left)).node}
    ${joinToNode(scc.generator.gen_push(leftResult.reg, binary.left.$cstNode!.text))}
    ${(rightResult = compileExpression(scc, binary.right)).node}
    ${joinToNode(
      binary.operator == "*"
        ? scc.generator.gen_mult()
        : nosign(leftResult.lval) || nosign(rightResult.lval)
        ? scc.generator.gen_udiv()
        : scc.generator.gen_div(),
      NL
    )}
  `;
  return { reg: 0, lval: leftResult.lval, node };
}

function compileSymbolExpression(scc: ScCompiler, symbolExpression: SymbolExpression): ExpressionResult {
  const ref = symbolExpression.element.ref;
  let res: ExpressionResult;
  switch (true) {
    case isFunctionDeclaration(ref):
      res = compileFunctionReference(scc, symbolExpression);
      break;
    case isLocalVarName(ref):
    case isParameterDeclaration(ref):
      res = compileLocalVariableReference(scc, ref);
      if (symbolExpression.indexExpression) res = compileArrayIndex(scc, res, symbolExpression.indexExpression);
      if (symbolExpression.postfix) res = compilePostfix(scc, res, symbolExpression);
      break;
    case isGlobalVarName(ref):
      res = compileGlobalVariableReference(scc, ref);
      if (symbolExpression.indexExpression) res = compileArrayIndex(scc, res, symbolExpression.indexExpression);
      if (symbolExpression.postfix) res = compilePostfix(scc, res, symbolExpression);
      break;
    // case isStructReference(symbolExpression):
    //   return compileStructReference(symbolExpression);
    // case isStructMemberReference(symbolExpression):
    //   return compileStructMemberReference(symbolExpression);
    default:
      throw new AstNodeError(symbolExpression, "Trying to compile unknown symbol expression");
  }
  if (symbolExpression.functionCall) return compileFunctionCall(scc, res, symbolExpression);
  return res;
}

function compileArrayIndex(scc: ScCompiler, symbolRes: ExpressionResult, indexExpression: Expression): ExpressionResult {
  let ptr = symbolRes.lval.symbol;
  if (ptr == 0) throw Error("Can't index non-symbol");
  if (!(ptr.identity == SymbolIdentity.POINTER || ptr.identity == SymbolIdentity.ARRAY)) throw Error("Can only index a pointer or array");
  const node = expandTracedToNode(indexExpression)`
    ${symbolRes.node}
    ; [${indexExpression.$cstNode!.text}]
    ${ptr.identity == SymbolIdentity.POINTER ? joinToNode(rvalue(scc, symbolRes), NL) : undefined}
    ${joinToNode(scc.generator.gen_push(symbolRes.reg, (symbolRes.lval.symbol as ISymbol).name))}
    ${compileExpression(scc, indexExpression).node}
    ${joinToNode(scc.generator.gen_multiply(ptr.type, ptr.type == SymbolType.STRUCT ? scc.tag_table.tags[ptr.tagidx!].size : 1), NL)}
    ${joinToNode(scc.generator.gen_add(), NL)}
  `;
  symbolRes.lval.indirect = ptr.type;
  symbolRes.lval.ptr_type = 0;
  return { lval: symbolRes.lval, reg: CompilerRegs.HL_REG | FETCH, node };
}

function compilePostfix(scc: ScCompiler, symbolRes: ExpressionResult, symbolExpression: SymbolExpression): ExpressionResult {
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

function compileFunctionCall(scc: ScCompiler, symbolRes: ExpressionResult, symbolExpression: SymbolExpression): ExpressionResult {
  let ptr = symbolRes.lval.symbol;
  // const node = symbolRes.node;
  const functionCall = symbolExpression.functionCall!;

  if (!isFunctionDeclaration(symbolExpression.element.ref)) throw Error("function call expression element.ref is not function declaration");

  const node = expandToNode`
    ; ${symbolExpression.$cstNode?.text}
    ${symbolRes.node}
    ${
      ptr != 0 && ptr.identity != SymbolIdentity.FUNCTION
        ? joinToNode(
            (() => {
              const lines = rvalue(scc, symbolRes);
              ptr = 0;
              lines.unshift("; function symbol is a pointer to a function ");
              return lines;
            })(),
            NL
          )
        : undefined
    }
    ${ptr == 0 ? joinToNode(scc.generator.gen_push(CompilerRegs.HL_REG, "retaddr"), NL) : undefined}
    ${joinTracedToNode(
      functionCall,
      "arguments"
    )(
      functionCall.arguments.map((arg, i) => {
        const funcdecl = symbolExpression.element.ref as FunctionDeclaration;
        const param = funcdecl.parameters[i].name;
        const argexpr = compileExpression(scc, arg);
        return argexpr.node
          .appendIf(ptr == 0, "xthl")
          .appendNewLineIfNotEmpty()
          .append(joinToNode(scc.generator.gen_push(CompilerRegs.HL_REG, `par ${param}`), NL));
      })
    )}
    ${
      ptr != 0
        ? joinToNode(scc.generator.gen_call((symbolRes.lval.symbol as ISymbol).name), NL)
        : joinToNode(["; callstk", ...scc.generator.callstk()], NL)
    }
    ${joinToNode(scc.generator.gen_modify_stack(scc.generator.stkp + functionCall.arguments.length * AsmGenerator.INTSIZE), NL)}
  `;

  return { reg: 0, lval: { ...symbolRes.lval, symbol: 0 }, node };
}

function compileFunctionReference(scc: ScCompiler, funcCall: SymbolExpression): ExpressionResult {
  // add to global symbol table if not already there
  // Use offset 0 so that if function call occurs before function declaration this can be detected in function declaration
  const sym_idx = scc.symbol_table.add_global(funcCall.element.ref!.name, SymbolIdentity.FUNCTION, SymbolType.CINT, 0, SymbolStorage.PUBLIC);
  if (sym_idx < 0) throw Error();
  const symbol = scc.symbol_table.symbols[sym_idx];
  const lval: ILValue = { symbol: symbol, indirect: 0, ptr_type: 0, tagsym: 0 };
  return { reg: 0, lval, node: expandTracedToNode(funcCall)`` };

  // const args = funcCall.arguments.map((e) => compileExpression(e));
}

function compileLocalVariableReference(scc: ScCompiler, localVar: LocalVarName | ParameterDeclaration): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let sym_idx;
  if ((sym_idx = scc.symbol_table.find_local(localVar.name)) > -1) {
    const symbol = scc.symbol_table.symbols[sym_idx];

    const { reg, lines } = scc.generator.gen_get_locale(symbol); // hl = &local
    // lxi h, stack offset of symbol
    // dap sp ; hl = &symbol

    const node = expandTracedToNode(localVar)`
      ; ${localVar.name}
      ${joinToNode(lines, { appendNewLineIfNotEmpty: true })}
    `;

    lval.symbol = symbol;
    lval.indirect = symbol.type;
    // memberCall returns &symbol

    if (symbol.type == SymbolType.STRUCT) {
      lval.tagsym = scc.tag_table.tags[symbol.tagidx!];
    }
    if (symbol.identity == SymbolIdentity.ARRAY || (symbol.identity == SymbolIdentity.VARIABLE && symbol.type == SymbolType.STRUCT)) {
      lval.ptr_type = symbol.type;
      return { reg, lval, node };
    }
    if (symbol.identity == SymbolIdentity.POINTER) {
      lval.indirect = SymbolType.CINT;
      lval.ptr_type = symbol.type;
    }

    return { reg: 1 | reg, lval, node };
  } else throw new AstNodeError(localVar, `${localVar.name} not in local symbol table`);
}

function compileGlobalVariableReference(scc: ScCompiler, globalVar: GlobalVarName): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };

  let sym_idx;
  if ((sym_idx = scc.symbol_table.find_global(globalVar.name)) > -1) {
    const symbol = scc.symbol_table.symbols[sym_idx];
    if (symbol.identity != SymbolIdentity.FUNCTION) {
      lval.symbol = symbol;
      lval.indirect = 0;
      if (symbol.type == SymbolType.STRUCT) {
        lval.tagsym = scc.tag_table.tags[symbol.tagidx!];
      }
      if (symbol.identity != SymbolIdentity.ARRAY && (symbol.identity != SymbolIdentity.VARIABLE || symbol.type != SymbolType.STRUCT)) {
        if (symbol.identity == SymbolIdentity.POINTER) {
          lval.ptr_type = symbol.type;
        }
        const node = expandTracedToNode(globalVar)``;
        return { reg: 1 | CompilerRegs.HL_REG, lval, node };
      }
      const node = expandTracedToNode(globalVar)`
          ${joinToNode(scc.generator.gen_immediate(symbol.name))}
        `;

      lval.indirect = symbol.type;
      lval.ptr_type = symbol.type;
      return { reg: 0, lval, node };
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

function nosign(lval: ILValue) {
  if (lval.ptr_type || (lval.symbol && lval.symbol.type & SymbolType.UNSIGNED)) return 1;
  return 0;
}
