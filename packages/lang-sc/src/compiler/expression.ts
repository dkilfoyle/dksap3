import { AstNode, interruptAndCheck } from "langium";
import {
  BinaryExpression,
  Expression,
  FunctionDeclaration,
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
  NumberExpression,
  ParameterDeclaration,
  SymbolExpression,
  UnaryExpression,
} from "../language/generated/ast";
import { ISymbol, symbol_table, SymbolIdentity, SymbolStorage, SymbolType } from "./SymbolTable";
import { Generator, generator } from "./Generator";
import { CompilerRegs, ILValue } from "./interface";
import { tag_table } from "./TagTable";
import { CompositeGeneratorNode, expandTracedToNode, JoinOptions, joinToNode, NewLineNode } from "langium/generate";

const FETCH = 1;

const NL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

class AstNodeError extends Error {
  constructor(node: AstNode, message: string) {
    const position = node.$cstNode!.range.start;
    super(`${message} @${position.line + 1}:${position.character + 1}`);
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export interface ExpressionResult {
  reg: CompilerRegs;
  lval: ILValue;
  node: CompositeGeneratorNode;
}

/**
 * Retrieve a static or indirect symbol value and store in HL
 */
function rvalue({ reg, lval }: ExpressionResult) {
  let lines: string[];
  if (lval.symbol != 0 && lval.indirect == 0) {
    // lval is a static memory cell
    lines = generator.gen_get_memory(lval.symbol);
  } else {
    // HL contains &int
    // call ccgint
    lines = generator.gen_get_indirect(lval.indirect, reg);
    // HL now contains value of int
  }
  return { reg: CompilerRegs.HL_REG, lines };
}

function store(lval: ILValue) {
  if ((lval.indirect = 0)) return generator.gen_put_memory(lval.symbol as ISymbol);
  else return generator.gen_put_indirect(lval.indirect);
}

export function compileExpression(expression: Expression): ExpressionResult {
  const res = compileSubExpression(expression);
  if (res.reg & 1) {
    const { reg, lines } = rvalue(res);
    res.node = res.node.append(joinToNode(lines, NL));
    res.reg = reg;
  }
  return res;
}

function compileSubExpression(expression: Expression): ExpressionResult {
  switch (true) {
    case isBinaryExpression(expression):
      switch (expression.operator) {
        case "=":
          return applyAssignment(expression);
        case "+":
          return applyAddition(expression);
        case "*":
        case "/":
          return applyMultiplication(expression);
        default:
          throw new AstNodeError(expression, `Unimplemented binary expression operator ${expression.operator}`);
      }
    case isSymbolExpression(expression):
      return compileSymbolExpression(expression);
    case isUnaryExpression(expression):
      return compileUnaryExpression(expression);
    case isNumberExpression(expression):
      return compileNumberExpression(expression);
    default:
      throw new AstNodeError(expression, "Unknown expression type found ");
  }
}

const leafNode = (node: AstNode, lines: string[]) => {
  return expandTracedToNode(node)`
    ${joinToNode(lines)}
  `;
};

function compileNumberExpression(numexp: NumberExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const lines = generator.gen_immediate(numexp.value);
  return { reg: 0, lval, node: leafNode(numexp, lines) };
}

function compileUnaryExpression(unary: UnaryExpression): ExpressionResult {
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
}

function applyAssignment(binary: BinaryExpression): ExpressionResult {
  if (!(isSymbolExpression(binary.left) && isLocalVarName(binary.left.element.ref)))
    throw new AstNodeError(binary.left, "lhs of assignment must be variable");
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;
  const node = expandTracedToNode(binary)`
    ; ${binary.$cstNode!.text}
    ${(leftResult = compileSubExpression(binary.left)).node}
    ${(leftResult.reg & FETCH) == 0 ? "ERROR: Need lval" : undefined}
    ${joinToNode(leftResult.lval.indirect ? generator.gen_push(leftResult.reg) : [])}
    ${(rightResult = compileSubExpression(binary.right)).node}
    ${joinToNode(rightResult.reg & 1 ? rvalue(rightResult).lines : [])}
    ${joinToNode(store(leftResult.lval), NL)}
  `;
  return { reg: 0, lval, node };
}

const execute = (f: () => void) => {
  f();
  return "";
};

function applyAddition(binary: BinaryExpression): ExpressionResult {
  const leftResult = compileSubExpression(binary.left);
  let k = leftResult.reg;
  // HL = &left
  let rLeftLines: string[] = [];
  if (leftResult.reg & FETCH) {
    const { reg, lines } = rvalue(leftResult);
    k = reg;
    rLeftLines = lines;
  }
  // HL = *left
  let pushLines: string[] = [];
  if (leftResult.lval.indirect) pushLines = generator.gen_push(k);
  // top of stack now contains *left

  const rightResult = compileSubExpression(binary.right);
  // HL = &right
  let rRightLines: string[] = [];
  if (rightResult.reg & 1) {
    const { lines } = rvalue(rightResult);
    rRightLines = lines;
  }

  // HL = *right

  let mulLines: string[] = [];
  if (dbltest(leftResult.lval, rightResult.lval)) {
    // eg mypointer + myint
    // eg myarray + myint
    // if so then myint index *= pointertype size
    mulLines = [
      "; HL *= sizeof(left) if left is pointerffset by 2 or struct array index by size",
      ...generator.gen_multiply(leftResult.lval.ptr_type, leftResult.lval.tagsym ? leftResult.lval.tagsym.size : Generator.INTSIZE),
    ];
  }

  const addLines = generator.gen_add(leftResult.lval, rightResult.lval);
  // pop d ; d = *left
  // dad d; hl = hl + d ie right = right + left

  result(leftResult.lval, rightResult.lval);
  const node = expandTracedToNode(binary)`
    ${leftResult.node}
    ${joinToNode(rLeftLines, NL)}
    ${joinToNode(pushLines, NL)}
    ${rightResult.node}
    ${joinToNode(rRightLines, NL)}
    ${joinToNode(mulLines, NL)}
    ${joinToNode(addLines, NL)}
  `;
  return { reg: CompilerRegs.NONE, lval: leftResult.lval, node };
}

function applyMultiplication(binary: BinaryExpression): ExpressionResult {
  const leftResult = compileSubExpression(binary.left);
  var k = leftResult.reg;
  // HL = &left
  let rLeftLines: string[] = [];
  if (leftResult.reg & FETCH) {
    const { reg, lines } = rvalue(leftResult);
    k = reg;
    rLeftLines = lines;
  }
  // HL = *left
  const pushLines = generator.gen_push(k);
  // top of stack now contains *left

  const rightResult = compileSubExpression(binary.right);
  // HL = &right
  let rRightLines: string[] = [];
  if (rightResult.reg & 1) {
    const { lines } = rvalue(rightResult);
    rRightLines = lines;
  }
  // HL = *right

  let opLines: string[] = [];
  if (binary.operator == "*") {
    opLines = generator.gen_mult();
  } else if (binary.operator == "/") {
    opLines = nosign(leftResult.lval) || nosign(rightResult.lval) ? generator.gen_udiv() : generator.gen_div();
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

function compileSymbolExpression(symbolExpression: SymbolExpression): ExpressionResult {
  const ref = symbolExpression.element.ref;
  let res: ExpressionResult;
  switch (true) {
    case isFunctionDeclaration(ref):
      res = compileFunctionReference(symbolExpression);
      break;
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
  if (symbolExpression.functionCall) return compileFunctionCall(res, symbolExpression);
  return res;
}

function compileFunctionCall(symbolRes: ExpressionResult, symbolExpression: SymbolExpression): ExpressionResult {
  let ptr = symbolRes.lval.symbol;
  let k = symbolRes.reg;
  const node = symbolRes.node;
  const functionCall = symbolExpression.functionCall!;

  node.append(`; ${symbolExpression.$cstNode?.text}`).appendNewLine();

  if (ptr != 0 && ptr.identity != SymbolIdentity.FUNCTION) {
    const { reg, lines } = rvalue(symbolRes);
    k = reg;
    ptr = 0;
    lines.unshift("; function symbol is a pointer to a function ");
    node.append(joinToNode(lines, { appendNewLineIfNotEmpty: true }));
  }

  if (ptr == 0) {
    node.append(...generator.gen_push(CompilerRegs.HL_REG));
  }

  node.appendTraced(
    functionCall,
    "arguments"
  )(
    ...functionCall.arguments.map((arg) =>
      compileExpression(arg)
        .node.appendIf(ptr == 0, "xthl")
        .appendNewLineIfNotEmpty()
        .append(joinToNode(generator.gen_push(CompilerRegs.HL_REG), NL))
    )
  );

  if (ptr != 0) {
    node.append(joinToNode(generator.gen_call((symbolRes.lval.symbol as ISymbol).name), NL));
  } else {
    node.append(joinToNode(["; callstk", ...generator.callstk()], { appendNewLineIfNotEmpty: true }));
  }

  const { newstkp, lines } = generator.gen_modify_stack(generator.stkp + functionCall.arguments.length * Generator.INTSIZE);
  generator.stkp = newstkp;
  node.append(joinToNode(lines, NL));

  return { reg: 0, lval: { ...symbolRes.lval, symbol: 0 }, node };
}

function compileFunctionReference(funcCall: SymbolExpression): ExpressionResult {
  // add to global symbol table if not already there
  // Use offset 0 so that if function call occurs before function declaration this can be detected in function declaration
  const sym_idx = symbol_table.add_global(funcCall.element.ref!.name, SymbolIdentity.FUNCTION, SymbolType.CINT, 0, SymbolStorage.PUBLIC);
  if (sym_idx < 0) throw Error();
  const symbol = symbol_table.symbols[sym_idx];
  const lval: ILValue = { symbol: symbol, indirect: 0, ptr_type: 0, tagsym: 0 };
  return { reg: 0, lval, node: expandTracedToNode(funcCall)`` };

  // const args = funcCall.arguments.map((e) => compileExpression(e));
}

function compileLocalVariableReference(localVar: LocalVarName | ParameterDeclaration): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let sym_idx;
  if ((sym_idx = symbol_table.find_local(localVar.name)) > -1) {
    const symbol = symbol_table.symbols[sym_idx];

    const { reg, lines } = generator.gen_get_locale(symbol); // hl = &local
    // lxi h, stack offset of symbol
    // dap sp ; hl = &symbol

    const node = expandTracedToNode(localVar)`
      ${joinToNode(lines, { appendNewLineIfNotEmpty: true })}
    `;

    lval.symbol = symbol;
    lval.indirect = symbol.type;
    // memberCall returns &symbol

    if (symbol.type == SymbolType.STRUCT) {
      lval.tagsym = tag_table.tags[symbol.tagidx!];
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

function compileGlobalVariableReference(globalVar: GlobalVarName): ExpressionResult {
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
        const node = expandTracedToNode(globalVar)``;
        return { reg: 1 | CompilerRegs.HL_REG, lval, node };
      }
      const node = expandTracedToNode(globalVar)`
          ${joinToNode(generator.gen_immediate(symbol.name))}
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

function nosign(x: ILValue) {
  let ptr: ISymbol | 0;
  if (x.ptr_type || ((ptr = x.symbol) && ptr.type & 1)) return 1;
  return 0;
}
