import { AstNode } from "langium";
import { isProgram, isLabel, isDirective, Instr, isAddrArgument, isImm8, isReg16, isReg8, isImm16, isInstr } from "./generated/ast.js";
import { instructionInfo, opcodes } from "./opcodes.js";

const getInstructionInfo = (instr: Instr) => {
  let instrKey = `${instr.op.name.toUpperCase()}`;
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
      instrKey += `_imm8`;
      break;
    case isReg8(instr.arg2):
      instrKey += `_${instr.arg2.register.toUpperCase()}`;
      break;
  }

  if (instructionInfo[instrKey] == undefined) throw Error(`No instruction info for ${instrKey}`);
  return instructionInfo[instrKey];
};

export const assember = (root: AstNode) => {
  if (!isProgram(root)) throw Error("Assembler expects Program node as root");

  const identifierMap: Record<string, number> = {};
  const lineOpcodeMap: Record<number, string> = {};
  const lineAddressMap: Record<number, number> = {};
  let addr = 0;

  // first parse, build address map
  root.lines.forEach((line, lineNum) => {
    if (isInstr(line)) {
      const instrInfo = getInstructionInfo(line);
      addr += instrInfo.bytes;
      lineOpcodeMap[lineNum] = `0x${instrInfo.code.toString(16)}`;
    }
    if (isLabel(line)) {
      identifierMap[line.name] = addr;
    }
    if (isDirective(line)) {
      switch (line.dir.name.toUpperCase()) {
        case "ORG":
          const a = line.args[0].number;
          if (a == undefined) throw Error("ORG expects number");
          addr = a;
          break;
        case "EQU":
          if (!line.lhs?.identifier) throw Error("EQU missing lhs.identifier");
          identifierMap[line.lhs!.identifier!] = line.args[0].number!;
          break;
        case "DB":
          addr += line.args.length;
          break;
        default:
          throw Error(`Directive ${line.dir.name} not implemented in assembler yet`);
      }
    }
  });

  const bytes = new Uint8Array(addr);
  addr = 0;

  // second parse, build bytes
  root.lines.forEach((line, lineNum) => {
    if (isDirective(line)) {
      switch (line.dir.name.toUpperCase()) {
        case "ORG":
          const a = line.args[0].number;
          if (a == undefined) throw Error("ORG expects number");
          addr = a;
          break;
        case "DB":
          line.args.forEach((arg) => {
            if (arg.number == undefined) throw Error();
            bytes[addr++] = arg.number & 0xff;
          });
          break;
        default:
          throw Error(`Directive ${line.dir.name} not implemented in assembler yet`);
      }
    } else if (isInstr(line)) {
      const lookup = opcodes[lineOpcodeMap[lineNum]];
      lineAddressMap[line.$cstNode!.range.start.line] = addr;
      bytes[addr++] = lookup.code & 0xff;

      switch (true) {
        case isAddrArgument(line.arg1):
          if (line.arg1.identifier) {
            const x = identifierMap[line.arg1.identifier.$refText];
            bytes[addr++] = x & 0xff;
            bytes[addr++] = (x >> 8) & 0xff;
          } else if (line.arg1.number != undefined) {
            bytes[addr++] = line.arg1.number & 0xff;
            bytes[addr++] = (line.arg1.number >> 8) & 0xff;
          }
          break;
        case isImm8(line.arg1):
          bytes[addr++] = line.arg1.number & 0xff;
          break;
      }
      switch (true) {
        case isImm8(line.arg2):
          bytes[addr++] = line.arg2.number & 0xff;
          break;
        case isImm16(line.arg2):
          bytes[addr++] = line.arg2.number & 0xff;
          bytes[addr++] = (line.arg2.number >> 8) & 0xff;
          break;
      }
    }
  });

  return { bytes, identifierMap, lineAddressMap };
};
