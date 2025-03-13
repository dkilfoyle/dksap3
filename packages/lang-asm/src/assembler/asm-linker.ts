import { Line, Program } from "../language/generated/ast";

const usedLines: Set<number> = new Set();
const alreadyImported: Set<string> = new Set();

const BRANCH_OPS = ["CALL", "JP", "JM", "JNZ", "JZ", "JPO", "JPE", "JNC", "JC", "CP", "CM", "CNZ", "CZ", "CPO", "CPE", "CNC", "CC"];
const END_OPS = ["RET", "JMP"];

const getExternal = (program: Program, externalName: string, start = 0, adding = false) => {
  const addLine = (line: Line) => {
    if (!line.$cstNode) throw Error("Unable to get line cstnode");
    usedLines.add(line.$cstNode.range.start.line);
  };

  for (let i = start; i < program.lines.length; i++) {
    const line = program.lines[i];

    if (line.label) {
      const label = line.label.name.toUpperCase();
      if (label == externalName && !alreadyImported.has(label)) {
        alreadyImported.add(label);
        addLine(line);
        adding = true;
      }
    }

    if (line.dir) addLine(line);

    if (line.instr && adding) {
      addLine(line);
      const opName = line.instr.op.opname.toUpperCase();
      if (BRANCH_OPS.includes(opName)) {
        const arg1 = line.instr.arg1!.$cstNode!.text.toUpperCase();
        if (!alreadyImported.has(arg1)) getExternal(program, arg1);
      }
      if (END_OPS.includes(opName)) {
        return;
      }
    }
  }
};

export const getImportedLines = (program: Program, externals: string[]) => {
  usedLines.clear();
  alreadyImported.clear();
  for (const importName of externals) {
    getExternal(program, importName, 0, false);
  }

  return program.lines.filter((line) => usedLines.has(line.$cstNode!.range.start.line));
};
