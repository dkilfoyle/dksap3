import { Line, Program } from "../language/generated/ast";
import { ILabelInfo } from "./asm-assembler";

const usedLines: Set<number> = new Set();
const alreadyImported: Set<string> = new Set();

const BRANCH_OPS = ["CALL", "JP", "JM", "JNZ", "JZ", "JPO", "JPE", "JNC", "JC", "CP", "CM", "CNZ", "CZ", "CPO", "CPE", "CNC", "CC", "JMP"];
const END_OPS = ["RET"];

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

export type ILinkerInfo = Record<string, ILinkerFileInfo>;

export interface ILinkerFileInfo {
  labels: Record<string, ILabelInfo>;
  size: number;
  startOffset: number;
  lineAddressMap: Record<
    number,
    {
      start: number;
      size: number;
    }
  >;
  filename: string;
}

export function getLabelInfo(linkerInfo: ILinkerInfo, name: string, filename?: string) {
  if (filename) {
    if (linkerInfo[filename].labels[name]) {
      const f = linkerInfo[filename];
      const l = linkerInfo[filename].labels[name];
      return { file: f, labelInfo: l, globalAddress: f.startOffset + l.localAddress };
    } else return undefined;
  } else {
    for (let f of Object.values(linkerInfo)) {
      for (let l of Object.values(f.labels)) {
        if (l.name == name) return { file: f, labelInfo: l, globalAddress: f.startOffset + l.localAddress };
      }
    }
  }
}

export function getSourceLocationForAddress(linkerInfo: ILinkerInfo, addr: number) {
  for (const f of Object.values(linkerInfo)) {
    const res = Object.entries(f.lineAddressMap).find(([, { start, size }]) => {
      return addr >= f.startOffset + start && addr < f.startOffset + start + size;
    });
    if (res) return { filename: f.filename, line: parseInt(res[0]), start: res[1].start, size: res[1].size };
  }
}

export function getLabelForAddress(linkerInfo: ILinkerInfo, addr: number) {
  for (const f of Object.values(linkerInfo)) {
    const res = Object.values(f.labels).find((labelInfo) => {
      return labelInfo.localAddress + f.startOffset == addr;
    });
    if (res) return { file: f, labelInfo: res };
  }
}

export function getNearestPreceedingLabelForAddress(linkerInfo: ILinkerInfo, addr: number) {
  let nearestDistance = 1000000;
  let nearestLabel: ILabelInfo = { name: "unknown", localAddress: 0, references: [] };
  let nearestFile: string = "";

  for (const f of Object.values(linkerInfo)) {
    if (f.size > 0) {
      Object.values(f.labels).forEach((l) => {
        const distance = addr - (l.localAddress + f.startOffset);
        if (distance >= 0 && distance < nearestDistance) {
          nearestDistance = distance;
          nearestLabel = l;
          nearestFile = f.filename;
        }
      });
    }
  }

  return { file: nearestFile, distance: nearestDistance, labelInfo: nearestLabel };
}

export function getFileForAddress(linkerInfo: ILinkerInfo, addr: number) {
  let i = 0;
  for (const f of Object.values(linkerInfo)) {
    if (f.size > 0) {
      if (addr >= f.startOffset && addr < f.startOffset + f.size) return { file: f, num: i };
      i++;
    }
  }
  return { file: undefined, num: -1 };
}
