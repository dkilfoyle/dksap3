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
import { CompositeGeneratorNode, expandTracedToNode, JoinOptions, joinToNode } from "langium/generate";

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
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  if (isBinaryExpression(expression)) {
    switch (expression.operator) {
      case "=":
        return applyAssignment(expression);
      case "+":
        return applyAddition(expression);
      case "*":
      case "/":
        return applyMultiplication(expression);
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
    const lines = generator.gen_immediate(expression.value);
    return { reg: 0, lval, node: leafNode(expression, lines) };
  }
  throw new AstNodeError(expression, "Unknown expression type found ");
}

const leafNode = (node: AstNode, lines: string[]) => {
  return expandTracedToNode(node)`
    ${joinToNode(lines)}
  `;
};

function applyAssignment(binary: BinaryExpression): ExpressionResult {
  if (!(isSymbolExpression(binary.left) && isLocalVarName(binary.left.element.ref)))
    throw new AstNodeError(binary.left, "lhs of assignment must be variable");
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const leftResult = compileExpression(binary.left);
  if ((leftResult.reg & FETCH) == 0) throw Error("Need lval");

  let pushLines: string[] = [];
  if (leftResult.lval.indirect) pushLines = generator.gen_push(leftResult.reg);
  const rightResult = compileExpression(binary.right);
  if (rightResult.reg & 1) rvalue(rightResult);
  const storeLines = store(leftResult.lval);
  const node = expandTracedToNode(binary)`
    ${leftResult.node}
    ${joinToNode(pushLines, NL)}
    ${rightResult.node}
    ${joinToNode(storeLines, NL)}
  `;
  return { reg: 0, lval, node };
}

function applyAddition(binary: BinaryExpression): ExpressionResult {
  const leftResult = compileExpression(binary.left);
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

  const rightResult = compileExpression(binary.right);
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
    ; ${binary.left.$cstNode!.text} + ${binary.right.$cstNode!.text}
    ; Compile lhs: ${binary.left.$cstNode!.text}
    ${leftResult.node}
    ${joinToNode(rLeftLines, NL)}
    ${joinToNode(pushLines, NL)}
    ; Compile rhs: ${binary.right.$cstNode!.text}
    ${rightResult.node}
    ${joinToNode(rRightLines, NL)}
    ${joinToNode(mulLines, NL)}
    ; add HL(rhs) and DE(lhs)
    ${joinToNode(addLines, NL)}
  `;
  return { reg: CompilerRegs.NONE, lval: leftResult.lval, node };
}

function applyMultiplication(binary: BinaryExpression): ExpressionResult {
  const leftResult = compileExpression(binary.left);
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

  const rightResult = compileExpression(binary.right);
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
    ; ${binary.left.$cstNode!.text} ${binary.operator} ${binary.right.$cstNode!.text}
    ; Compile lhs: ${binary.left.$cstNode!.text}
    ${leftResult.node}
    ${joinToNode(rLeftLines, NL)}
    ${joinToNode(pushLines, NL)}
    ; Compile rhs: ${binary.right.$cstNode!.text}
    ${rightResult.node}
    ${joinToNode(rRightLines, NL)}
    ; ${binary.operator == "*" ? "Multiply" : "Divide"} HL(rhs) and DE(lhs)
    ${joinToNode(opLines, NL)}
  `;

  return { reg: 0, lval: leftResult.lval, node };
}

function compileSymbolExpression(symbolExpression: SymbolExpression): ExpressionResult {
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
