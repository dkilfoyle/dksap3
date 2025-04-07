import { AstNode, interruptAndCheck } from "langium";
import {
  BinaryExpression,
  Expression,
  FunctionDeclaration,
  GlobalVarName,
  isBinaryExpression,
  isFunctionDeclaration,
  isGlobalVarName,
  isLocalVarName,
  isNumberExpression,
  isParameterDeclaration,
  isStringExpression,
  isSymbolExpression,
  isUnaryExpression,
  LocalVarName,
  NumberExpression,
  ParameterDeclaration,
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
export function rvalue(scc: ScCompiler, { reg, lval }: ExpressionResult) {
  let lines: string[];
  if (lval.symbol != 0 && lval.indirect == 0) {
    // lval is a static memory cell
    lines = scc.generator.gen_get_memory(lval.symbol);
    // lines will be
    //
  } else {
    // HL contains &int
    // call ccgint
    lines = scc.generator.gen_get_indirect(lval.indirect, reg);
    // HL now contains value of int
  }
  return { reg: CompilerRegs.HL_REG, lines };
}

function store(scc: ScCompiler, lval: ILValue) {
  if ((lval.indirect = 0)) return scc.generator.gen_put_memory(lval.symbol as ISymbol);
  else return scc.generator.gen_put_indirect(lval.indirect);
}

function check_rvalue(scc: ScCompiler, res: ExpressionResult) {
  if (res.reg & 1) {
    const { reg, lines } = rvalue(scc, res);
    res.node = res.node.append(joinToNode(lines, NL));
    res.reg = reg;
  }
  return res;
}

const leafNode = (node: AstNode, lines: string[]) => {
  return expandTracedToNode(node)`
    ${joinToNode(lines)}
  `;
};

export function compileExpression(scc: ScCompiler, expression: Expression): ExpressionResult {
  const res = compileSubExpression(scc, expression);
  return check_rvalue(scc, res);
}

function compileSubExpression(scc: ScCompiler, expression: Expression): ExpressionResult {
  switch (true) {
    case isBinaryExpression(expression):
      switch (expression.operator) {
        case "=":
          return applyAssignment(scc, expression);
        case "+":
          return applyAddition(scc, expression);
        case "+":
          return applySubtraction(scc, expression);
        case "*":
        case "/":
          return applyMultiplication(scc, expression);
        case "==":
        case "!=":
        case "<":
        case "<=":
        case ">":
        case ">=":
        case "<":
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
    default:
      throw new AstNodeError(expression, "Unknown expression type found ");
  }
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

function compileUnaryExpression(scc: ScCompiler, unary: UnaryExpression): ExpressionResult {
  const symbolRes = compileExpression(scc, unary.value);
  if (unary.prefix == "*") {
    symbolRes.lval.indirect = symbolRes.lval.symbol ? symbolRes.lval.ptr_type : SymbolType.CINT;
    symbolRes.lval.ptr_type = 0;
    return { ...symbolRes, reg: FETCH | symbolRes.reg };
  } else throw Error(`unary operator ${unary.prefix} not implemented yet`);
}

function applyAssignment(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  if (!(isSymbolExpression(binary.left) && isLocalVarName(binary.left.element.ref)))
    throw new AstNodeError(binary.left, "lhs of assignment must be variable");
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;
  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileSubExpression(scc, binary.left)).node}
    ${(leftResult.reg & FETCH) == 0 ? "ERROR: Need lval" : undefined}
    ${joinToNode(leftResult.lval.indirect ? scc.generator.gen_push(leftResult.reg, leftResult.lval) : [], NL)}
    ${(rightResult = compileSubExpression(scc, binary.right)).node}
    ${joinToNode(rightResult.reg & 1 ? rvalue(scc, rightResult).lines : [], NL)}
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
    ${joinToNode(scc.generator.gen_push(leftResult.reg, "push k"))}
    ${(rightResult = compileExpression(scc, binary.right)).node}
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
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
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

function applyMultiplication(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  const leftResult = compileSubExpression(scc, binary.left);
  var k = leftResult.reg;
  // HL = &left
  let rLeftLines: string[] = [];
  if (leftResult.reg & FETCH) {
    const { reg, lines } = rvalue(scc, leftResult);
    k = reg;
    rLeftLines = lines;
  }
  // HL = *left
  const pushLines = scc.generator.gen_push(k, leftResult.lval);
  // top of stack now contains *left

  const rightResult = compileSubExpression(scc, binary.right);
  // HL = &right
  let rRightLines: string[] = [];
  if (rightResult.reg & 1) {
    const { lines } = rvalue(scc, rightResult);
    rRightLines = lines;
  }
  // HL = *right

  let opLines: string[] = [];
  if (binary.operator == "*") {
    opLines = scc.generator.gen_mult();
  } else if (binary.operator == "/") {
    opLines = nosign(leftResult.lval) || nosign(rightResult.lval) ? scc.generator.gen_udiv() : scc.generator.gen_div();
  }
  // pop d ; d = *left
  // dad d; hl = hl + d ie right = right + left

  const node = expandTracedToNode(binary)`
    ${leftResult.node}
    ${joinToNode(rLeftLines, NL)}
    ${joinToNode(pushLines, NL)}
    ${rightResult.node}
    ${joinToNode(rRightLines, NL)}
    ${joinToNode(opLines, NL)}
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
      if (symbolExpression.postfix) res = compilePostfix(scc, res, symbolExpression);
      break;
    case isGlobalVarName(ref):
      res = compileGlobalVariableReference(scc, ref);
      if (symbolExpression.postfix) res = compilePostfix(scc, res, symbolExpression);
      break;
    // case isStructReference(symbolExpression):
    //   return compileStructReference(symbolExpression);
    // case isStructMemberReference(symbolExpression):
    //   return compileStructMemberReference(symbolExpression);
    default:
      throw new AstNodeError(symbolExpression, "Trying to compile unknown symbol expression");
  }
  if (symbolExpression.indexExpression) throw new AstNodeError(symbolExpression, "Array indexing not implemented");
  if (symbolExpression.functionCall) return compileFunctionCall(scc, res, symbolExpression);
  return res;
}

function compilePostfix(scc: ScCompiler, symbolRes: ExpressionResult, symbolExpression: SymbolExpression): ExpressionResult {
  const node = expandToNode`
    ${symbolRes.node}
    ; ${symbolExpression.postfix}
    ${symbolRes.lval.indirect ? joinToNode(scc.generator.gen_push(symbolRes.reg, symbolRes.lval), NL) : undefined}
    ${joinToNode(rvalue(scc, symbolRes).lines, NL)}
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
  let k = symbolRes.reg;
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
              const { reg, lines } = rvalue(scc, symbolRes);
              k = reg;
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
