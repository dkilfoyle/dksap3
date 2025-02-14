import { AstNode, AstUtils } from "langium";
import { isProgram, isLabel, isDirective, Instr, isAddrArgument, isImm8, isReg16, isReg8, isImm16, isInstr } from "./generated/ast.js";
import { instructionInfo, opcodes } from "./opcodes.js";

const getInstructionInfo = (instr: Instr) => {
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

export const assember = (root: AstNode) => {
  if (!isProgram(root)) throw Error("Assembler expects Program node as root");

  const identifierMap: Record<string, number> = {};
  const lineOpcodeMap: Record<number, string> = {};
  const lineAddressMap: Record<number, number> = {};
  let addr = 0;

  // first parse, build address map
  const treeIterator1 = AstUtils.streamAllContents(root).iterator();
  let result1: IteratorResult<AstNode>;
  do {
    result1 = treeIterator1.next();
    if (!result1.done) {
      const node = result1.value;
      const lineNum = node.$cstNode?.range.start.line;
      if (lineNum == undefined) throw Error("Assembler linenum undefined");
      if (isInstr(node)) {
        const instrInfo = getInstructionInfo(node);
        addr += instrInfo.bytes;
        lineOpcodeMap[lineNum] = `0x${instrInfo.code.toString(16).padStart(2, "0")}`;
      }
      if (isLabel(node)) {
        identifierMap[node.name.toUpperCase()] = addr;
      }
      if (isDirective(node)) {
        switch (node.dir.opname.toUpperCase()) {
          case "ORG":
            {
              const a = node.args[0].number;
              if (a == undefined) throw Error("ORG expects number");
              addr = a;
            }
            break;
          case "EQU":
            if (!node.lhs?.identifier) throw Error("EQU missing lhs.identifier");
            identifierMap[node.lhs!.identifier.$refText.toUpperCase()] = node.args[0].number!;
            break;
          case "DB":
            addr += node.args.length;
            break;
          case "DW":
            addr += node.args.length * 2;
            break;
          default:
            throw Error(`Directive ${node.dir.opname} not implemented in assembler yet`);
        }
      }
    }
  } while (!result1.done);

  // second parse, build bytes
  const bytes = new Uint8Array(addr);
  addr = 0;
  const treeIterator2 = AstUtils.streamAllContents(root).iterator();
  let result2: IteratorResult<AstNode>;
  do {
    result2 = treeIterator2.next();
    if (!result2.done) {
      const node = result2.value;
      const lineNum = node.$cstNode?.range.start.line;
      if (lineNum == undefined) throw Error("Assembler linenum undefined");
      if (isDirective(node)) {
        switch (node.dir.opname.toUpperCase()) {
          case "ORG":
            {
              const a = node.args[0].number;
              if (a == undefined) throw Error("ORG expects number");
              addr = a;
            }
            break;
          case "DB":
            node.args.forEach((arg) => {
              if (arg.number == undefined) throw Error();
              bytes[addr++] = arg.number & 0xff;
            });
            break;
          case "DW":
            node.args.forEach((arg) => {
              if (arg.number != undefined) {
                bytes[addr++] = arg.number & 0xff; // least significant byte
                bytes[addr++] = (arg.number >> 8) & 0xff; // most significant byte
              } else if (arg.identifier != undefined) {
                const x = identifierMap[arg.identifier.$refText.toUpperCase()];
                if (x == undefined) throw Error("Identifer in DW arg not found");
                bytes[addr++] = x & 0xff;
                bytes[addr++] = (x >> 8) & 0xff;
              } else throw Error();
            });
            break;
          default:
            throw Error(`Directive ${node.dir.opname} not implemented in assembler yet`);
        }
      } else if (isInstr(node)) {
        const lookup = opcodes[lineOpcodeMap[lineNum]];
        if (!lookup) throw Error();
        lineAddressMap[node.$cstNode!.range.start.line] = addr;
        bytes[addr++] = lookup.code & 0xff;

        switch (true) {
          case isAddrArgument(node.arg1):
            if (node.arg1.identifier) {
              const x = identifierMap[node.arg1.identifier.$refText.toUpperCase()];
              bytes[addr++] = x & 0xff;
              bytes[addr++] = (x >> 8) & 0xff;
            } else if (node.arg1.number != undefined) {
              bytes[addr++] = node.arg1.number & 0xff;
              bytes[addr++] = (node.arg1.number >> 8) & 0xff;
            }
            break;
          case isImm8(node.arg1):
            if (node.arg1.char) {
              bytes[addr++] = node.arg1.char.charCodeAt(0) & 0xff;
            } else if (node.arg1.number !== undefined) bytes[addr++] = node.arg1.number & 0xff;
            else throw Error();
            break;
        }
        switch (true) {
          case isImm8(node.arg2):
            if (node.arg2.char) {
              bytes[addr++] = node.arg2.char.charCodeAt(0) & 0xff;
            } else if (node.arg2.number !== undefined) bytes[addr++] = node.arg2.number & 0xff;
            else throw Error();
            break;
          case isImm16(node.arg2):
            if (node.arg2.identifier) {
              const x = identifierMap[node.arg2.identifier.$refText.toUpperCase()];
              bytes[addr++] = x & 0xff;
              bytes[addr++] = (x >> 8) & 0xff;
            } else if (node.arg2.number != undefined) {
              bytes[addr++] = node.arg2.number & 0xff;
              bytes[addr++] = (node.arg2.number >> 8) & 0xff;
            }
            break;
        }
      }
    }
  } while (!result2.done);

  return { bytes, identifierMap, lineAddressMap };
};
// export const assember = (root: AstNode) => {
//   if (!isProgram(root)) throw Error("Assembler expects Program node as root");

//   const identifierMap: Record<string, number> = {};
//   const lineOpcodeMap: Record<number, string> = {};
//   const lineAddressMap: Record<number, number> = {};
//   let addr = 0;

//   // first parse, build address map
//   root.lines.forEach((line, lineNum) => {
//     if (isInstr(line)) {
//       const instrInfo = getInstructionInfo(line);
//       addr += instrInfo.bytes;
//       lineOpcodeMap[lineNum] = `0x${instrInfo.code.toString(16).padStart(2, "0")}`;
//     }
//     if (isLabel(line)) {
//       identifierMap[line.name] = addr;
//     }
//     if (isDirective(line)) {
//       switch (line.dir.opname.toUpperCase()) {
//         case "ORG":
//           const a = line.args[0].number;
//           if (a == undefined) throw Error("ORG expects number");
//           addr = a;
//           break;
//         case "EQU":
//           if (!line.lhs?.identifier) throw Error("EQU missing lhs.identifier");
//           identifierMap[line.lhs!.identifier!] = line.args[0].number!;
//           break;
//         case "DB":
//           addr += line.args.length;
//           break;
//         default:
//           throw Error(`Directive ${line.dir.opname} not implemented in assembler yet`);
//       }
//     }
//   });

//   const bytes = new Uint8Array(addr);
//   addr = 0;

//   // second parse, build bytes
//   root.lines.forEach((line, lineNum) => {
//     if (isDirective(line)) {
//       switch (line.dir.opname.toUpperCase()) {
//         case "ORG":
//           const a = line.args[0].number;
//           if (a == undefined) throw Error("ORG expects number");
//           addr = a;
//           break;
//         case "DB":
//           line.args.forEach((arg) => {
//             if (arg.number == undefined) throw Error();
//             bytes[addr++] = arg.number & 0xff;
//           });
//           break;
//         default:
//           throw Error(`Directive ${line.dir.opname} not implemented in assembler yet`);
//       }
//     } else if (isInstr(line)) {
//       const lookup = opcodes[lineOpcodeMap[lineNum]];
//       if (!lookup) debugger;
//       lineAddressMap[line.$cstNode!.range.start.line] = addr;
//       bytes[addr++] = lookup.code & 0xff;

//       switch (true) {
//         case isAddrArgument(line.arg1):
//           if (line.arg1.identifier) {
//             const x = identifierMap[line.arg1.identifier.$refText];
//             bytes[addr++] = x & 0xff;
//             bytes[addr++] = (x >> 8) & 0xff;
//           } else if (line.arg1.number != undefined) {
//             bytes[addr++] = line.arg1.number & 0xff;
//             bytes[addr++] = (line.arg1.number >> 8) & 0xff;
//           }
//           break;
//         case isImm8(line.arg1):
//           if (line.arg1.char) {
//             bytes[addr++] = line.arg1.char.charCodeAt(0) & 0xff;
//           } else if (line.arg1.number) bytes[addr++] = line.arg1.number & 0xff;
//           else debugger;
//           break;
//       }
//       switch (true) {
//         case isImm8(line.arg2):
//           if (line.arg2.char) {
//             bytes[addr++] = line.arg2.char.charCodeAt(0) & 0xff;
//           } else if (line.arg2.number !== undefined) bytes[addr++] = line.arg2.number & 0xff;
//           else debugger;
//           break;
//         case isImm16(line.arg2):
//           if (line.arg2.identifier) {
//             const x = identifierMap[line.arg2.identifier.$refText];
//             bytes[addr++] = x & 0xff;
//             bytes[addr++] = (x >> 8) & 0xff;
//           } else if (line.arg2.number != undefined) {
//             bytes[addr++] = line.arg2.number & 0xff;
//             bytes[addr++] = (line.arg2.number >> 8) & 0xff;
//           }
//           break;
//       }
//     }
//   });

//   return { bytes, identifierMap, lineAddressMap };
// };
