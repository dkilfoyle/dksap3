import { Instr, isAddrArgument, isImm8, isReg16, isReg8, isImm16 } from "../language/generated/ast.js";
import { instructionInfo } from "../opcodes.js";

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
