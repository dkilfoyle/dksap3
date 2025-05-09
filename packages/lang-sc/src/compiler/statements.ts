import {
  Block,
  IfStatement,
  InlineAssembly,
  isBinaryExpression,
  isBreakStatement,
  isCaseStatement,
  isContinueStatement,
  isDefaultStatement,
  isDoStatement,
  isExpression,
  isForStatement,
  isIfStatement,
  isInlineAssembly,
  isReturnStatement,
  isSwitchStatement,
  isWhileStatement,
  ReturnStatement,
  Statement,
} from "../language/generated/ast";
import { compileExpression } from "./expression";
import { CompositeGeneratorNode, expandTracedToNode, JoinOptions, joinToNode, joinTracedToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";
import { compileBreak, compileContinue, compileDo, compileFor, compileWhile } from "./while";
import { compileLocalDeclaration } from "./symbol";
import { compileCase, compileDefault, compileIf, compileSwitch } from "./cond";

export const compileBlock = (scc: ScCompiler, block: Block) => {
  // return expandTracedToNode(block)`
  //   ${joinTracedToNode(block, "statements")(
  //     block.statements.map((s) => compileStatement(s)),
  //     { appendNewLineIfNotEmpty: true }
  //   )}
  // `;
  return expandTracedToNode(block)`
${joinTracedToNode(block, "declarations")(
  block.declarations.map((d) => compileLocalDeclaration(scc, d)),
  { appendNewLineIfNotEmpty: true }
)}
${joinTracedToNode(block, "statements")(
  block.statements.map((s) => compileStatement(scc, s)),
  { appendNewLineIfNotEmpty: true }
)}
`;
};

export const compileStatement = (scc: ScCompiler, statement: Statement): CompositeGeneratorNode => {
  switch (true) {
    case isExpression(statement):
      return compileExpression(scc, statement, !isBinaryExpression(statement)).node!;
    case isReturnStatement(statement):
      return compileReturn(scc, statement);
    case isInlineAssembly(statement):
      return compileAssembly(scc, statement);
    case isWhileStatement(statement):
      return compileWhile(scc, statement);
    case isDoStatement(statement):
      return compileDo(scc, statement);
    case isForStatement(statement):
      return compileFor(scc, statement);
    case isBreakStatement(statement):
      return compileBreak(scc, statement);
    case isContinueStatement(statement):
      return compileContinue(scc, statement);
    case isIfStatement(statement):
      return compileIf(scc, statement);
    case isSwitchStatement(statement):
      return compileSwitch(scc, statement);
    case isCaseStatement(statement):
      return compileCase(scc, statement);
    case isDefaultStatement(statement):
      return compileDefault(scc, statement);
    default:
      console.error("Unimplemented statement ", statement);
  }
  throw Error();
};

const compileAssembly = (scc: ScCompiler, asm: InlineAssembly) => {
  return expandTracedToNode(asm)` ; inline asm start
  ${asm.asm.slice(6, -7).trimStart().trimEnd()}
  ; inline asm end`;
};

const compileReturn = (scc: ScCompiler, ret: ReturnStatement) => {
  const exprNode = ret.value ? compileExpression(scc, ret.value).node : null;
  return expandTracedToNode(ret)`  ; return ${ret.value?.$cstNode?.text}
  ${exprNode}
  jmp $${scc.generator.fexitlab}`;
};
