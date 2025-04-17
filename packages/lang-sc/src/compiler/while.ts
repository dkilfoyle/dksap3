import { DoStatement, Expression, ForStatement, WhileStatement } from "src/language/generated/ast";
import { ScCompiler } from "./sc-compiler";
import { expandToNode, expandTracedToNode, JoinOptions, joinToNode } from "langium/generate";
import { compileBlock } from "./statements";
import { compileExpression } from "./expression";
const NL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

enum WSType {
  WSWHILE = 0,
  WSFOR,
  WSDO,
  WSSWITCH,
}

interface IWhile {
  symbol_idx: number;
  stack_pointer: number;
  type: WSType;
  case_test: number;
  label_num: number;
  test_label: string;
  exit_label: string;
  body_label: string;
}

export class WhileTable {
  public static WSTABSZ = 20;
  public static SWSTSZ = 100;
  public whiles: IWhile[] = [];
  public cases: { label: number; val: number }[] = [];

  constructor(public scc: ScCompiler) {}

  init() {
    this.whiles = [];
    this.cases = [];
  }
  createWhile(scc: ScCompiler) {
    const lbl = scc.generator.get_label();
    const ws: IWhile = {
      symbol_idx: scc.symbol_table.local_table_index,
      stack_pointer: scc.generator.stkp,
      type: WSType.WSWHILE,
      case_test: 0, //scc.generator.get_label(),
      label_num: lbl,
      exit_label: `$w${lbl}_ex`,
      test_label: `$w${lbl}_tst`,
      body_label: "",
    };
    this.addWhile(ws);
    return ws;
  }
  createDo(scc: ScCompiler) {
    const lbl = scc.generator.get_label();
    const ws: IWhile = {
      symbol_idx: scc.symbol_table.local_table_index,
      stack_pointer: scc.generator.stkp,
      type: WSType.WSDO,
      case_test: 0, //scc.generator.get_label(),
      label_num: lbl,
      exit_label: `$d${lbl}_ex  `,
      test_label: `$d${lbl}_tst`,
      body_label: `$d${lbl}_blk`,
    };
    this.addWhile(ws);
    return ws;
  }
  createFor(scc: ScCompiler) {
    const lbl = scc.generator.get_label();
    const ws: IWhile = {
      symbol_idx: scc.symbol_table.local_table_index,
      stack_pointer: scc.generator.stkp,
      type: WSType.WSFOR,
      case_test: 0, //scc.generator.get_label(),
      label_num: lbl,
      exit_label: `$f${lbl}_ex`,
      test_label: `$f${lbl}_tst`,
      body_label: `$f${lbl}_blk`,
    };
    this.addWhile(ws);
    return ws;
  }
  addWhile(w: IWhile) {
    if (this.whiles.length == WhileTable.WSTABSZ) throw Error("Exceeded maximum number of whiles");
    this.whiles.push(w);
  }
  delWhile() {
    if (this.whiles.length == 0) throw Error("No active while");
    this.whiles.pop();
  }
  readWhile() {
    if (this.whiles.length == 0) throw Error("No active while");
    return this.whiles[this.whiles.length - 1];
  }
  findWhile() {
    for (let i = this.whiles.length - 1; i >= 0; i++) {
      if (this.whiles[i].type != WSType.WSSWITCH) return this.whiles[i];
    }
  }
  readSwitch() {
    const w = this.readWhile();
    if (w.type == WSType.WSSWITCH) return w;
    else return undefined;
  }
  addCase(val: number) {
    if (this.cases.length == WhileTable.SWSTSZ) throw Error("Exceeded maximum number of cases");
    const label = this.scc.generator.get_label();
    this.cases.push({ val, label });
    return label;
  }
}

export const compileWhile = (scc: ScCompiler, whilestat: WhileStatement) => {
  const wt = scc.while_table.createWhile(scc);
  const node = expandTracedToNode(whilestat)`
    ; while (${whilestat.condition.$cstNode?.text})
    ${wt.test_label}:
      ${compileExpression(scc, whilestat.condition).node}
      ; jmp to loop exit if a==0
      ${joinToNode(scc.generator.gen_test_jump(`${wt.exit_label}`, 0), NL)}
      ; while block
      ${compileBlock(scc, whilestat.block)}
      jmp ${wt.test_label}
    ${wt.exit_label}:
      ${joinToNode(scc.generator.gen_modify_stack(wt.stack_pointer), NL)}
  `;

  scc.symbol_table.local_table_index = wt.symbol_idx; // pop off any locals created in while body
  scc.while_table.delWhile();
  return node;
};

export const compileDo = (scc: ScCompiler, dostat: DoStatement) => {
  const wt = scc.while_table.createDo(scc);
  const node = expandTracedToNode(dostat)`
    ; do (${dostat.condition.$cstNode?.text})
    ${wt.body_label}:
      ${compileBlock(scc, dostat.block)}
    ${wt.test_label}:
      ${compileExpression(scc, dostat.condition).node}
      ; jmp to loop exit if a==0
      ${joinToNode(scc.generator.gen_test_jump(`${wt.exit_label}`, 0), NL)}
      jmp ${wt.body_label}
    ${wt.exit_label}:
      ${joinToNode(scc.generator.gen_modify_stack(wt.stack_pointer), NL)}
  `;

  scc.symbol_table.local_table_index = wt.symbol_idx; // pop off any locals created in while body
  scc.while_table.delWhile();
  return node;
};

export const compileFor = (scc: ScCompiler, forstat: ForStatement) => {
  const wt = scc.while_table.createFor(scc);

  const node = expandTracedToNode(forstat)`  ; for${wt.label_num} (${forstat.condition?.$cstNode?.text})
${forstat.init ? compileExpression(scc, forstat.init).node : undefined}
${wt.test_label}:
  ${
    forstat.condition
      ? expandToNode`
        ${compileExpression(scc, forstat.condition).node}
        ; jmp to body if test !=0 
        ${joinToNode(scc.generator.gen_test_jump(`${wt.body_label}`, 1), NL)}
        ; jmp to exit if test == 0
        jmp ${wt.exit_label}`
      : undefined
  }
$f${wt.label_num}_inc:
  ${
    forstat.execution
      ? expandToNode`
      ${compileExpression(scc, forstat.execution).node}
      jmp ${forstat.condition ? wt.test_label : wt.body_label}
    `
      : undefined
  }
${wt.body_label}:
${compileBlock(scc, forstat.block)}
  jmp $f${wt.label_num}_inc
${wt.exit_label}:
  ${joinToNode(scc.generator.gen_modify_stack(wt.stack_pointer), NL)}
`.appendNewLineIfNotEmpty();

  scc.symbol_table.local_table_index = wt.symbol_idx; // pop off any locals created in for init or for body
  scc.while_table.delWhile();
  return node;
};
