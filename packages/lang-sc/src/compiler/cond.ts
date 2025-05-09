import { expandToString, expandTracedToNode, joinToNode } from "langium/generate";
import { IfStatement, Block, SwitchStatement, CaseStatement, DefaultStatement } from "src/language/generated/ast";
import { compileExpression } from "./expression";
import { compileBlock } from "./statements";
import { AppendNL, ScCompiler } from "./sc-compiler";
import { ISwitch } from "./while";
import { CompilerRegs } from "./interface";

export const compileIf = (scc: ScCompiler, ifstat: IfStatement) => {
  const fstkp = scc.generator.stkp;
  const flex = scc.symbol_table.local_table_index;
  const flab = scc.generator.get_label();

  const block = (b: Block) => {
    return expandTracedToNode(b)`
      ${compileBlock(scc, b)}
      ${joinToNode(scc.generator.gen_modify_stack(fstkp), AppendNL)}
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
  ${joinToNode(scc.generator.gen_test_jump(`$i${flab}_end`, 0), AppendNL)}
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
        ${joinToNode(scc.generator.gen_test_jump(`$i${flab}_else`, 0), AppendNL)}
        ; if true block
      ${block(ifstat.block)}
        jmp $i${flab}_end
      $i${flab}_else:
      ${block(ifstat.elseBlock)}
      $i${flab}_end:
  `.appendNewLine();
  }
};

export const compileSwitch = (scc: ScCompiler, switchStat: SwitchStatement) => {
  const sw = scc.break_table.createSwitch();

  let node = expandTracedToNode(switchStat)`  ; switch (${switchStat.switchValue.$cstNode?.text})
  lxi h, ${sw.ct_label}
  ${joinToNode(scc.generator.gen_push(CompilerRegs.HL_REG, "&swtable"), AppendNL)}
  ${compileExpression(scc, switchStat.switchValue).node}`;
  scc.generator.stkp += 2;
  node.appendTemplate`
  call cccase
${compileBlock(scc, switchStat.block)}
  jmp ${sw.exit_label}
${dumpsw(scc, sw)}
${sw.exit_label}:
  ${joinToNode(scc.generator.gen_modify_stack(sw.stack_pointer), AppendNL)}
  `;
  scc.symbol_table.local_table_index = sw.symbol_idx; // pop any locals made in switchstat.block
  scc.break_table.delBreak();
  return node;
};

export const compileCase = (scc: ScCompiler, caseStat: CaseStatement) => {
  const lbl = scc.break_table.addCase(caseStat.caseValue.value);
  return expandTracedToNode(caseStat)`
${lbl}:
${compileBlock(scc, caseStat.block)}
  `;
};

export const compileDefault = (scc: ScCompiler, defStat: DefaultStatement) => {
  const sw = scc.break_table.readSwitch();
  if (!sw) throw Error("No Switch");
  sw.def_label = `$sw${sw.label_num}_def`;
  return expandTracedToNode(defStat)`  ; default
${sw.def_label}:
${compileBlock(scc, defStat.block)}
  `;
};

const dumpsw = (scc: ScCompiler, sw: ISwitch) => {
  return `  ; case table
${sw.ct_label}:
  dw ${sw.cases.map((c) => `${c.val}, ${c.label}`).join(", ")}
  dw ${sw.def_label}, 0
  `;
};
