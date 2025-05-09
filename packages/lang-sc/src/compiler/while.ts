import { BreakStatement, ContinueStatement, DoStatement, Expression, ForStatement, WhileStatement } from "src/language/generated/ast";
import { createError, ScCompiler } from "./sc-compiler";
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

interface IBreak {
  symbol_idx: number;
  stack_pointer: number;
  type: WSType;
  label_num: number;
  exit_label: string;
}

export interface ILoop extends IBreak {
  type: WSType.WSDO | WSType.WSFOR | WSType.WSWHILE;
  test_label: string;
  incr_label: string;
  body_label: string;
}

export interface ISwitch extends IBreak {
  type: WSType.WSSWITCH;
  def_label: string;
  ct_label: string;
  cases: ICase[];
}

interface ICase {
  label: string;
  val: number;
}

export class BreakTable {
  public static WSTABSZ = 20;
  public breaks: IBreak[] = [];

  constructor(public scc: ScCompiler) {}

  init() {
    this.breaks = [];
  }
  createWhile(scc: ScCompiler) {
    const lbl = scc.generator.get_label();
    const ws: ILoop = {
      symbol_idx: scc.symbol_table.local_table_index,
      stack_pointer: scc.generator.stkp,
      type: WSType.WSWHILE,
      label_num: lbl,
      exit_label: `$w${lbl}_end`,
      test_label: `$w${lbl}_tst`,
      body_label: "",
      incr_label: "",
    };
    this.addBreak(ws);
    return ws;
  }
  createDo(scc: ScCompiler) {
    const lbl = scc.generator.get_label();
    const ws: ILoop = {
      symbol_idx: scc.symbol_table.local_table_index,
      stack_pointer: scc.generator.stkp,
      type: WSType.WSDO,
      label_num: lbl,
      exit_label: `$d${lbl}_end`,
      test_label: `$d${lbl}_tst`,
      body_label: `$d${lbl}_blk`,
      incr_label: "",
    };
    this.addBreak(ws);
    return ws;
  }
  createFor(scc: ScCompiler) {
    const lbl = scc.generator.get_label();
    const ws: ILoop = {
      symbol_idx: scc.symbol_table.local_table_index,
      stack_pointer: scc.generator.stkp,
      type: WSType.WSFOR,
      label_num: lbl,
      exit_label: `$f${lbl}_end`,
      test_label: `$f${lbl}_tst`,
      body_label: `$f${lbl}_blk`,
      incr_label: `$f${lbl}_inc`,
    };
    this.addBreak(ws);
    return ws;
  }
  createSwitch() {
    const lbl = this.scc.generator.get_label();
    const sw: ISwitch = {
      symbol_idx: this.scc.symbol_table.local_table_index,
      stack_pointer: this.scc.generator.stkp,
      type: WSType.WSSWITCH,
      label_num: lbl,
      exit_label: `$sw${lbl}_end`,
      ct_label: `$sw${lbl}_ct`,
      def_label: `$sw${lbl}_end`,
      cases: [],
    };
    this.breaks.push(sw);
    return sw;
  }
  addBreak(w: IBreak) {
    if (this.breaks.length == BreakTable.WSTABSZ) throw Error("Exceeded maximum number of whiles");
    this.breaks.push(w);
  }
  delBreak() {
    if (this.breaks.length == 0) throw Error("No active breaks");
    this.breaks.pop();
  }
  readBreak() {
    if (this.breaks.length == 0) throw Error("No active breaks");
    return this.breaks.at(-1);
  }
  findLoop() {
    for (let i = this.breaks.length - 1; i >= 0; i--) {
      if (this.breaks.at(i)?.type != WSType.WSSWITCH) return this.breaks.at(i) as ILoop;
    }
    throw Error("No active loops");
  }
  readSwitch() {
    if (this.breaks.length == 0) throw Error("No active breaks");
    return this.breaks.at(-1)!.type == WSType.WSSWITCH ? (this.breaks.at(-1) as ISwitch) : undefined;
  }
  addCase(val: number | string) {
    const x = typeof val == "string" ? val.charCodeAt(0) : val;
    const label = `$c_${this.scc.generator.get_label()}`;
    if (this.breaks.length == 0) throw Error("No active switch");
    if (!this.breaks.at(-1) || this.breaks.at(-1)!.type != WSType.WSSWITCH) throw Error("no active switch");
    const sw = this.breaks.at(-1) as ISwitch;
    sw.cases.push({ val: x, label });
    return label;
  }
}

export const compileWhile = (scc: ScCompiler, whilestat: WhileStatement) => {
  const wt = scc.break_table.createWhile(scc);
  const node = expandTracedToNode(whilestat)`  ; while (${whilestat.condition.$cstNode?.text})
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
  scc.break_table.delBreak();
  return node;
};

export const compileDo = (scc: ScCompiler, dostat: DoStatement) => {
  const wt = scc.break_table.createDo(scc);
  const node = expandTracedToNode(dostat)`  ; do (${dostat.condition.$cstNode?.text})
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
  scc.break_table.delBreak();
  return node;
};

export const compileFor = (scc: ScCompiler, forstat: ForStatement) => {
  const wt = scc.break_table.createFor(scc);

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
${wt.incr_label}:
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
  jmp ${wt.incr_label}
${wt.exit_label}:
  ${joinToNode(scc.generator.gen_modify_stack(wt.stack_pointer), NL)}
`.appendNewLineIfNotEmpty();

  scc.symbol_table.local_table_index = wt.symbol_idx; // pop off any locals created in for init or for body
  scc.break_table.delBreak();
  return node;
};

export const compileBreak = (scc: ScCompiler, stmt: BreakStatement) => {
  const ptr = scc.break_table.readBreak();
  if (!ptr) throw Error();
  return expandTracedToNode(stmt)`  ; break
  ${joinToNode(scc.generator.gen_modify_stack(ptr.stack_pointer), NL)}
  jmp ${ptr.exit_label}
`;
};

export const compileContinue = (scc: ScCompiler, stmt: ContinueStatement) => {
  const ptr = scc.break_table.findLoop();
  if (!ptr) throw createError("No matching loop");
  return expandTracedToNode(stmt)`  ; continue
  ${joinToNode(scc.generator.gen_modify_stack(ptr.stack_pointer), NL)}
  jmp ${ptr.type == WSType.WSFOR ? ptr.incr_label : ptr.test_label}
`;
};
