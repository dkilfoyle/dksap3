import { AstNode, LangiumDocument } from "langium";
import {
  isProgram,
  isAddrArgument,
  isImm8,
  isImm16,
  Line,
  Instr,
  Directive,
  isLocationDirective,
  isLinkageDirective,
  isDataDirective,
  isMemoryDirective,
  isSymbolDirective,
  isLabel,
  LabelExpression,
} from "../language/generated/ast.js";
import { getInstructionInfo } from "./utils.js";
import { getImportedLines, ILinkerInfo } from "./asm-linker.js";

export interface ILabelReference {
  filename: string;
  offset: number; // machinecode location
}

export interface ILabelInfo {
  name: string;
  localAddress: number;
  references: ILabelReference[];
}

interface IAssembledFile {
  filename: string;
  lines: Line[];
  labels: Record<string, ILabelInfo>;
  constants: Record<string, number>;
  machineCode: Uint8Array;
  startOffset: number;
  lineAddressMap: Record<number, { start: number; size: number }>;
  externs: string[];
  size: number;
}

class Assembler {
  private static _instance: Assembler;

  runtime: LangiumDocument<AstNode> | null = null;
  os: LangiumDocument<AstNode> | null = null;
  stdlib: LangiumDocument<AstNode> | null = null;

  mainfile: string = "";
  files: Record<string, IAssembledFile> = {};

  private constructor() {}

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  /** Assemble and link source documents and runtime
   * @param docs List of source documents excluding runtime. The first document must contain function main.
   * @returns Machine code
   */
  assembleAndLink(docs: LangiumDocument<AstNode>[]) {
    if (!this.runtime) throw Error("Assembler has no runtime");
    if (!this.os) throw Error("Assembler has no os");
    if (!this.stdlib) throw Error("Assembler has no stdlib");
    this.files = {};

    this.mainfile = docs[0].uri.toString();

    console.groupCollapsed(`assembleAndLink ${this.mainfile}`);

    try {
      // order in memory is os, runtime, stdlib, includes, main
      const allDocs = [this.os, this.runtime, this.stdlib, ...docs.slice(1, -1), docs[0]];
      const filenames = allDocs.map((doc) => doc.uri.toString());

      // build this.files
      // - build list of local labels
      // - build list of externs
      for (const doc of allDocs) {
        this.preassemble(doc);
      }

      // exclude unused lines from runtime and includes
      this.trimDocs(allDocs);

      // build machinecode
      // add reference to every referenced label
      Object.entries(this.files).forEach(([, file]) => {
        this.assemble(file);
      });

      // relocate each document to be sequential in order runtime, #includes, main
      this.relocateFiles(filenames, 0x0);
      // this.relocateFiles(filenames, 0x100);

      // replace every address reference with file_base_addr + reference_offset
      this.relocateAddresses();

      const result = {
        bytes: this.concatenateFiles(filenames),
        linkerInfo: Object.values(this.files).reduce<ILinkerInfo>((accum, cur) => {
          accum[cur.filename] = {
            filename: cur.filename,
            labels: cur.labels,
            lineAddressMap: cur.lineAddressMap,
            size: cur.size,
            startOffset: cur.startOffset,
          };
          return accum;
        }, {}),
      };
      console.groupEnd();
      return result;
    } catch (e) {
      console.groupEnd();
      throw e;
    }
  }

  concatenateFiles(filenames: string[]) {
    const mclength = Object.values(this.files).reduce<number>((accum, cur) => accum + cur.size, 0);
    const mc = new Uint8Array(mclength + 0x100);

    // TODO - add boot
    // lxi sp, 0F00h
    // jmp main

    filenames.forEach((filename) => {
      const file = this.files[filename];
      mc.set(file.machineCode.slice(0, file.size), file.startOffset);
    });

    return mc;
  }

  relocateAddresses() {
    Object.values(this.files).forEach((f) => {
      Object.values(f.labels).forEach((l) => {
        l.references.forEach((r) => {
          this.files[r.filename].machineCode[r.offset] += (l.localAddress + f.startOffset) & 0xff;
          this.files[r.filename].machineCode[r.offset + 1] += ((l.localAddress + f.startOffset) >> 8) & 0xff;
        });
      });
    });
  }

  relocateFiles(filenames: string[], start = 0) {
    filenames.forEach((filename, i) => {
      if (i == 0) {
        this.files[filename].startOffset = start;
      } else {
        const prevFile = this.files[filenames[i - 1]];
        this.files[filename].startOffset = prevFile.startOffset + prevFile.size;
      }
    });
    filenames.forEach((filename) => {
      console.log(`File ${filename} starts at ${this.files[filename].startOffset}, size ${this.files[filename].size}`);
    });
  }

  trimDocs(docs: LangiumDocument<AstNode>[]) {
    // TODO build a dependency tracer
    // for now only include:
    // - everything in main
    // - for runtime and #includes only include what is referenced from main
    //   (this will ignore cross dependencies within and between runtime and #includes)

    const externs = [...this.files[this.mainfile].externs, ...this.files["builtin:/stdlib8080.asm"].externs];
    // const externs = this.files[this.mainfile].externs;

    docs.forEach((doc, i) => {
      const root = doc.parseResult.value;
      const filename = doc.uri.toString();
      if (!isProgram(root)) throw Error("Assembler expects program");
      if (i == docs.length - 1 || i == 0) {
        this.files[filename].lines = root.lines; // don't trim main file or os
      } else {
        this.files[filename].lines = getImportedLines(root, externs);
        // console.log(`Trimmed ${filename} lines:`, this.files[filename].lines);
      }
    });
  }

  preassemble(doc: LangiumDocument<AstNode>) {
    const root = doc.parseResult.value;
    const filename = doc.uri.toString();
    if (!isProgram(root)) throw Error("Assembler expects program");

    this.files[filename] = {
      filename,
      externs: [],
      labels: {},
      lines: [],
      machineCode: new Uint8Array(4096),
      lineAddressMap: {},
      startOffset: 0,
      constants: {},
      size: 0,
    };

    const references: Set<string> = new Set();
    root.lines.forEach((line) => {
      if (line.label) {
        this.files[filename].labels[line.label.name.toUpperCase()] = { name: line.label.name, localAddress: 0, references: [] };
      }
      if (line.instr && isAddrArgument(line.instr.arg1) && line.instr.arg1.labelexpr) {
        references.add(line.instr.arg1.labelexpr.identifier.$refText.toUpperCase());
      }
      if (line.instr && isImm16(line.instr.arg2) && line.instr.arg2.labelexpr) {
        references.add(line.instr.arg2.labelexpr.identifier.$refText.toUpperCase());
      }
    });

    this.files[filename].externs = Array.from(references.keys()).filter((r) => !this.files[filename].labels[r]);
    console.log(`externs for ${filename}:`, this.files[filename].externs);
  }

  findFileForGlobal(name: string) {
    return Object.values(this.files).find((f) => {
      return Object.keys(f.labels).find((l) => l == name);
    });
  }

  assembleLabelExpression = (file: IAssembledFile, arg: LabelExpression, addr: number) => {
    const id = arg.identifier.$refText.toUpperCase();
    if (isLabel(arg.identifier.ref) || isLinkageDirective(arg.identifier.ref)) {
      const sourceFile = file.labels[id] ? file : this.findFileForGlobal(id);
      if (!sourceFile) throw Error(`Unable to find source file for global ${arg.identifier.$refText}`);
      sourceFile.labels[id].references.push({ filename: file.filename, offset: addr });
      const offset = arg.offsetval ?? 0;
      if (arg.offsetop == "-") throw Error("label minus expressions not implemented yet");
      file.machineCode[addr++] = offset & 0xff;
      file.machineCode[addr++] = (offset >> 8) & 0xff;
      return addr;
    } else if (isSymbolDirective(arg.identifier.ref)) {
      const x = file.constants[id];
      const offset = arg.offsetval ? arg.offsetval * (arg.offsetop == "+" ? 1 : -1) : 0;
      file.machineCode[addr++] = (x + offset) & 0xff;
      file.machineCode[addr++] = ((x + offset) >> 8) & 0xff;
      return addr;
    } else throw Error();
  };

  assembleAddrNumberArgument = (file: IAssembledFile, arg: number, addr: number) => {
    file.machineCode[addr++] = arg & 0xff;
    file.machineCode[addr++] = (arg >> 8) & 0xff;
    return addr;
  };

  assembleInstr(file: IAssembledFile, node: Instr, addr: number) {
    const instrInfo = getInstructionInfo(node);
    const startAddr = addr;
    file.machineCode[addr++] = instrInfo.code & 0xff;

    switch (true) {
      case isAddrArgument(node.arg1):
        if (node.arg1.labelexpr) addr = this.assembleLabelExpression(file, node.arg1.labelexpr, addr);
        else if (node.arg1.number != undefined) addr = this.assembleAddrNumberArgument(file, node.arg1.number, addr);
        break;
      case isImm8(node.arg1):
        if (node.arg1.char) {
          file.machineCode[addr++] = node.arg1.char.charCodeAt(0) & 0xff;
        } else if (node.arg1.number !== undefined) file.machineCode[addr++] = node.arg1.number & 0xff;
        else throw Error();
        break;
    }
    switch (true) {
      case isImm8(node.arg2):
        if (node.arg2.char) {
          file.machineCode[addr++] = node.arg2.char.charCodeAt(0) & 0xff;
        } else if (node.arg2.number !== undefined) file.machineCode[addr++] = node.arg2.number & 0xff;
        else throw Error();
        break;
      case isImm16(node.arg2):
        if (node.arg2.labelexpr) {
          addr = this.assembleLabelExpression(file, node.arg2.labelexpr, addr);
        } else if (node.arg2.number != undefined) {
          file.machineCode[addr++] = node.arg2.number & 0xff;
          file.machineCode[addr++] = (node.arg2.number >> 8) & 0xff;
        }
        break;
    }

    file.lineAddressMap[node.$cstNode!.range.start.line] = { start: startAddr, size: addr - startAddr };
    return addr;
  }

  assembleDirective(file: IAssembledFile, node: Directive, addr: number) {
    switch (true) {
      case isLocationDirective(node):
        addr = node.number;
        break;
      case isLinkageDirective(node):
        // do nothing
        break;
      case isDataDirective(node):
        if (node.dirname.toUpperCase() == "DB") {
          node.args.forEach((arg) => {
            if (arg.number == undefined) throw Error();
            file.machineCode[addr++] = arg.number & 0xff;
          });
        } else {
          // DW
          node.args.forEach((arg) => {
            if (arg.number != undefined) {
              file.machineCode[addr++] = arg.number & 0xff; // least significant byte
              file.machineCode[addr++] = (arg.number >> 8) & 0xff; // most significant byte
            } else if (arg.labelexpr != undefined) {
              addr = this.assembleLabelExpression(file, arg.labelexpr, addr);
            } else throw Error();
          });
        }
        break;
      case isMemoryDirective(node):
        for (let i = 0; i < node.number; i++) file.machineCode[addr++] = 0;
        break;
      case isSymbolDirective(node):
        file.constants[node.name.toUpperCase()] = node.number;
        break;
      default:
        throw Error("Unknown directive");
    }
    return addr;
  }

  assemble(file: IAssembledFile) {
    let addr = 0;

    file.lines.forEach((line) => {
      if (line.label) {
        file.labels[line.label.name.toUpperCase()].localAddress = addr;
      }

      if (line.instr) {
        addr = this.assembleInstr(file, line.instr, addr);
      }

      if (line.dir) {
        addr = this.assembleDirective(file, line.dir, addr);
      }
    });

    file.size = addr;
  }
}

export const assembler = Assembler.Instance;
