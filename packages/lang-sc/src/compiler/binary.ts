import { BinaryExpression, isGlobalVarName, isLocalVarName, isSymbolExpression } from "../language/generated/ast";
import { AsmGenerator } from "./Generator";
import { ILValue, ISymbol, SymbolType } from "./interface";
import { expandTracedToNode, joinToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";
import {
  ExpressionResult,
  compileExpression,
  NL,
  nosign,
  compileSubExpression,
  dbltest,
  result,
  rvalue,
  AstNodeError,
  store,
} from "./expression";

export function applyBitwise(scc: ScCompiler, op: "&" | "|" | "^" | ">>" | "<<", binary: BinaryExpression): ExpressionResult {
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

export function applyLogical(scc: ScCompiler, op: "&&" | "||", binary: BinaryExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let leftResult, rightResult: ExpressionResult;
  let lab = "UNDEFINEDLAB";

  const node = expandTracedToNode(binary)`
  ; ${binary.$cstNode!.text}
  ${(leftResult = compileExpression(scc, binary.left)).node}
  ${joinToNode(scc.generator.gen_test_jump((lab = `$or${scc.generator.get_label()}`), op == "||" ? 1 : 0), NL)}
  ${(rightResult = compileExpression(scc, binary.right)).node}
  ${lab}:
  ${joinToNode(scc.generator.gen_convert_primary_reg_value_to_bool(), NL)}`;
  return { reg: 0, lval, node };
}

export function applyAssignment(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
  if (!(isSymbolExpression(binary.left) && (isLocalVarName(binary.left.element.ref) || isGlobalVarName(binary.left.element.ref))))
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

export function applyAssignOperation(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
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

export function applyComparison(scc: ScCompiler, op: ">" | "<" | ">=" | "<=" | "==" | "!=", binary: BinaryExpression): ExpressionResult {
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

export function applySubtraction(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
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

export function applyAddition(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
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

export function applyModulus(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
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

export function applyMultiplication(scc: ScCompiler, binary: BinaryExpression): ExpressionResult {
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
