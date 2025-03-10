import { AstNode, AstUtils, LangiumDocument } from "langium";
import { isProgram, isLabel, isDirective, isAddrArgument, isImm8, isImm16, isInstr, Program, Line } from "../language/generated/ast.js";
import { getInstructionInfo } from "./utils.js";
import { getImportedLines } from "src/language/asm-linker.js";

interface IReference {
  filename: string;
  offset: number;
}

interface ILabelInfo {
  name: string;
  localAddress: number;
  references: IReference[];
}

interface IAssembledFile {
  filename: string;
  lines: Line[];
  labels: ILabelInfo[];
  machineCode: Uint8Array;
  startOffset: number;
  sourceLineToLocalAddressMap: Record<number, number>;
  externs: string[];
}

class Assembler {
  runtime: LangiumDocument<AstNode> | null = null;
  labels: Record<string, ILabelInfo> = {};
  constants: Record<string, number> = {};
  mainfile: string = "";
  files: Record<string, IAssembledFile> = {};
  constructor() {}
  /** Assemble and link source documents and runtime
   * @param docs List of source documents excluding runtime. The first document must contain function main.
   * @returns Machine code
   */
  assembleAndLink(docs: LangiumDocument<AstNode>[]) {
    if (!this.runtime) throw Error("Assembler has no runtime");
    this.mainfile = docs[0].uri.toString();
    this.labels = {};
    this.constants = {};

    for (const doc of docs) {
      this.preassemble(doc); // find externs and build label list
    }

    const externs = Object.values(this.files).reduce<string[]>((accum, cur) => {
      accum.push(...cur.externs);
      return accum;
    }, []);
    console.log("All externals", externs);

    docs.forEach((doc, i) => {
      const root = doc.parseResult.value;
      const filename = doc.uri.toString();
      if (!isProgram(root)) throw Error("Assembler expects program");
      if (i == 0) {
        this.files[filename].lines = root.lines;
      } else {
        this.files[filename].lines = getImportedLines(root, externs);
        console.log(`Trimmed ${filename} lines:`, this.files[filename].lines);
      }
    });
  }

  preassemble(doc: LangiumDocument<AstNode>) {
    const root = doc.parseResult.value;
    const filename = doc.uri.toString();
    if (!isProgram(root)) throw Error("Assembler expects program");

    const references: Set<string> = new Set();
    root.lines.forEach((line, i) => {
      if (line.label) {
        this.files[filename].labels.push({ name: line.label.name, localAddress: 0, references: [] });
      }
      if (line.instr && isAddrArgument(line.instr.arg1)) {
        const target = line.instr.arg1.identifier?.$refText.toUpperCase() || line.instr.arg1.number?.toString();
        if (!target) throw Error("assemble - invalid addr argument");
        references.add(target);
      }
    });

    this.files[filename].externs = Array.from(references.keys()).filter((r) => !this.files[filename].labels.find((l) => l.name == r));
  }

  preassemble2(doc: LangiumDocument<AstNode>) {
    const root = doc.parseResult.value;
    const filename = doc.uri.toString();
    if (!isProgram(root)) throw Error("Assembler expects program");

    let addr = 0;
    const references: Record<string, number[]> = {};
    const localLabels: string[] = [];

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
          // lineOpcodeMap[lineNum] = `0x${instrInfo.code.toString(16).padStart(2, "0")}`;
          if (isAddrArgument(node.arg1)) {
            const target = node.arg1.identifier?.$refText.toUpperCase() || node.arg1.number?.toString();
            if (!target) throw Error("assemble - invalid addr argument");
            if (!references[target]) references[target] = [addr - 2];
            else references[target].push(addr - 2);
          }
        }
        if (isLabel(node)) {
          const labelName = node.name.toUpperCase();
          if (this.labels[labelName]) throw Error("assembler label already exists");
          this.labels[labelName] = { filename, localAddress: addr, name: labelName, references: [] };
          localLabels.push(labelName);
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
              this.constants[node.lhs!.identifier.$refText.toUpperCase()] = node.args[0].number!;
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
    const externals = Object.keys(references).filter((ref) => !identifierMap[ref]);
    console.log("EXTERNALS", externals);
  }
}

export const assembler = new Assembler();

export const assember = (root: AstNode, runtime: AstNode) => {
  if (!isProgram(root)) throw Error("Assembler expects Program node as root");

  const identifierMap: Record<string, number> = {};
  const lineOpcodeMap: Record<number, string> = {};
  const lineAddressMap: Record<number, number> = {};
  const references: Record<string, number[]> = {};
  let addr = 0;

  if (isProgram(runtime)) {
    const imports = getExternals(runtime, externals);
    imports.forEach((i) => console.log(i.$cstNode?.text));
  }

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
