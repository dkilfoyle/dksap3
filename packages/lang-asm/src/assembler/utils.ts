import { Instr, isAddrArgument, isImm8, isReg16, isReg8, isImm16 } from "../language/generated/ast.js";
import { instructionInfo } from "../opcodes.js";
import { ILabelInfo, ILinkerInfoFileMap } from "./asm-assembler.js";

export const getInstructionInfo = (instr: Instr) => {
  let instrKey = `${instr.op.opname.toUpperCase()}`;
  switch (true) {
    case isAddrArgument(instr.arg1):
      instrKey += `_addr`;
      break;
    case isImm8(instr.arg1):
      instrKey += `_imm8`;
      break;
    case isReg16(instr.arg1):
    case isReg8(instr.arg1):
      instrKey += `_${instr.arg1.register.toUpperCase()}`;
      break;
  }
  switch (true) {
    case isImm8(instr.arg2):
      instrKey += `_imm8`;
      break;
    case isImm16(instr.arg2):
      instrKey += `_imm16`;
      break;
    case isReg8(instr.arg2):
      instrKey += `_${instr.arg2.register.toUpperCase()}`;
      break;
  }

  if (instructionInfo[instrKey] == undefined) throw Error(`No instruction info for ${instrKey}`);
  return instructionInfo[instrKey];
};

export function getLabel(linkerInfoFileMap: ILinkerInfoFileMap, labelName: string) {
  for (const f of Object.values(linkerInfoFileMap)) {
    const res = Object.values(f.labels).find((l) => l.name == labelName);
    if (res) return { file: f, label: res };
  }
}

export function getSourceLocationForAddress(linkerInfoFileMap: ILinkerInfoFileMap, addr: number) {
  for (const f of Object.values(linkerInfoFileMap)) {
    const res = Object.entries(f.lineAddressMap).find(([, { start, size }]) => {
      return addr >= start && addr < start + size;
    });
    if (res) return { filename: f.filename, line: parseInt(res[0]), start: res[1].start, size: res[1].size };
  }
}

export function getLabelForAddress(linkerInfoFileMap: ILinkerInfoFileMap, addr: number) {
  for (const f of Object.values(linkerInfoFileMap)) {
    const res = Object.values(f.labels).find((labelInfo) => {
      return labelInfo.localAddress + f.startOffset == addr;
    });
    if (res) return { file: f, label: res };
  }
}

export function getNearestPreceedingLabelForAddress(linkerInfoFileMap: ILinkerInfoFileMap, addr: number) {
  let nearestDistance = 1000000;
  let nearestLabel: ILabelInfo = { name: "unknown", localAddress: 0, references: [] };
  let nearestFile: string = "";

  for (const f of Object.values(linkerInfoFileMap)) {
    Object.values(f.labels).forEach((l) => {
      const distance = addr - (l.localAddress + f.startOffset);
      if (distance >= 0 && distance < nearestDistance) {
        nearestDistance = distance;
        nearestLabel = l;
        nearestFile = f.filename;
      }
    });
  }

  return { file: nearestFile, distance: nearestDistance, label: nearestLabel };
}

export function getFileNumForAddress(linkerInfoFileMap: ILinkerInfoFileMap, addr: number) {
  let i = 0;
  for (const f of Object.values(linkerInfoFileMap)) {
    if (addr >= f.startOffset && addr < f.startOffset + f.size) return i;
    i++;
  }
  return -1;
}
