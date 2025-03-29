import { Expression, WhileStatement } from "src/language/generated/ast";
import { ScCompiler } from "./sc-compiler";
import { expandTracedToNode, JoinOptions, joinToNode } from "langium/generate";
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
  while_exit: number;
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
  const ws: IWhile = {
    symbol_idx: scc.symbol_table.local_table_index,
    stack_pointer: scc.generator.stkp,
    type: WSType.WSWHILE,
    case_test: scc.generator.get_label(),
    while_exit: scc.generator.get_label(),
  };
  scc.while_table.addWhile(ws);

  const node = expandTracedToNode(whilestat)`
    ; while (${whilestat.condition.$cstNode?.text})
    $${ws.case_test}:
      ${compileTest(scc, whilestat.condition, ws)}
      ; while block
      ${compileBlock(scc, whilestat.block)}
      jmp $${ws.case_test}
    $${ws.while_exit}:
      ${joinToNode(scc.generator.gen_modify_stack(ws.stack_pointer), NL)}
  `;

  scc.while_table.delWhile();
  return node;
};

const compileTest = (scc: ScCompiler, test: Expression, ws: IWhile) => {
  return expandTracedToNode(test)`
    ${compileExpression(scc, test).node}
    ; jmp to while exit if a==0
    ${joinToNode(scc.generator.gen_test_jump(ws.while_exit, 0), NL)}
  `;
};
