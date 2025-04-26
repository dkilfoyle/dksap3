import {
  Block,
  IfStatement,
  InlineAssembly,
  isBinaryExpression,
  isBreakStatement,
  isContinueStatement,
  isDoStatement,
  isExpression,
  isForStatement,
  isIfStatement,
  isInlineAssembly,
  isReturnStatement,
  isWhileStatement,
  ReturnStatement,
  Statement,
} from "../language/generated/ast";
import { compileExpression } from "./expression";
import { CompositeGeneratorNode, expandTracedToNode, JoinOptions, joinToNode, joinTracedToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";
import { compileBreak, compileContinue, compileDo, compileFor, compileWhile } from "./while";
import { compileLocalDeclaration } from "./symbol";

const NL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

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

const compileIf = (scc: ScCompiler, ifstat: IfStatement) => {
  const fstkp = scc.generator.stkp;
  const flex = scc.symbol_table.local_table_index;
  const flab = scc.generator.get_label();

  const block = (b: Block) => {
    return expandTracedToNode(b)`
      ${compileBlock(scc, b)}
      ${joinToNode(scc.generator.gen_modify_stack(fstkp), NL)}
      ${(function () {
        scc.symbol_table.local_table_index = flex;
        return undefined;
      })()}
    `;
  };

  if (!ifstat.elseBlock) {
    // if only
    return expandTracedToNode(ifstat)`  ; i${flab} ${ifstat.condition.$cstNode?.text}
  ${compileExpression(scc, ifstat.condition).node}
  ; if false jump to end
  ${joinToNode(scc.generator.gen_test_jump(`$i${flab}_end`, 0), NL)}
  ; if true block
${block(ifstat.block)}
$i${flab}_end:
`.appendNewLine();
  } else {
    // if else
    return expandTracedToNode(ifstat)`
        ; i${flab} ${ifstat.condition.$cstNode?.text}
        ${compileExpression(scc, ifstat.condition).node}
        ; if false jump to else
        ${joinToNode(scc.generator.gen_test_jump(`$i${flab}_else`, 0), NL)}
        ; if true block
      ${block(ifstat.block)}
        jmp $i${flab}_end
      $i${flab}_else:
      ${block(ifstat.elseBlock)}
      $i${flab}_end:
  `.appendNewLine();
  }
};
