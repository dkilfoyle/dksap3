import { TernaryExpression } from "src/language/generated/ast";
import { AppendNL, ScCompiler } from "./sc-compiler";
import { compileExpression, ExpressionResult } from "./expression";
import { expandToNode, joinToNode } from "langium/generate";

export function compileTernaryExpression(scc: ScCompiler, tern: TernaryExpression): ExpressionResult {
  const symbolRes = compileExpression(scc, tern.test);
  const ternlab1 = `$t${scc.generator.get_label()}`;
  const ternlab2 = `$t${scc.generator.get_label()}`;
  const node = expandToNode`
  ; ${tern.$cstNode?.text}
  ${symbolRes.node}
  ${joinToNode(scc.generator.gen_test_jump(ternlab1, 0), AppendNL)}
  ${compileExpression(scc, tern.left).node}
  jmp ${ternlab2}
${ternlab1}:
  ${compileExpression(scc, tern.right).node}
${ternlab2}:
  `;
  return { lval: symbolRes.lval, reg: symbolRes.reg, node };
}
