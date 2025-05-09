import { AstNode } from "langium";
import { Definition, isFunctionDeclaration, isGlobalVariableDeclaration, isProgram } from "../language/generated/ast";
import { AsmGenerator } from "./Generator";
import { compileFunctionDeclaration } from "./function";
import { compileGlobalVariableDeclaration, SymbolTable } from "./symbol";
import { InitialTable } from "./initials";
import { TagTable } from "./struct";
import { expandToNode, expandTracedToNode, JoinOptions, joinToNode, toStringAndTrace } from "langium/generate";
import { IRange } from "monaco-editor";
import { BreakTable } from "./while";
import { ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";

export function createError(description: string, range?: IRange) {
  return {
    message: `${range?.startLineNumber ? `Line ${range.startLineNumber}: ` : ""}${description}`,
    range,
  };
}

export const AppendNL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

export class ScCompiler {
  private static _instance: ScCompiler;
  generator = new AsmGenerator();
  symbol_table = new SymbolTable(this.generator);
  tag_table = new TagTable();
  litq: number[] = [];
  litlab = this.generator.get_label();
  break_table = new BreakTable(this);
  initials_table = new InitialTable();

  private constructor() {}

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  compile(uri: string, root: AstNode) {
    this.generator.init();
    this.symbol_table.init();
    this.tag_table.init();
    this.break_table.init();
    this.initials_table.init();
    this.litq = [];
    this.litlab = this.generator.get_label();

    console.groupCollapsed(`Compiling ${uri}`);

    if (!isProgram(root)) throw Error("Compiler expects Program root node");
    console.log("Received AST", root);

    try {
      const node = expandTracedToNode(root)`
      ; SmallC v2.4 8080 output
      ${joinToNode(
        root.definitions.map((def) => this.compileDefinition(def)),
        { appendNewLineIfNotEmpty: true }
      )}
      ${this.dumplits()}
      ${this.dumpglobals()}
    `;

      const res = toStringAndTrace(node);
      console.log("Trace", res.trace);
      console.log("Symbols", this.symbol_table);
      console.log("Structs", this.tag_table);
      console.log("Initials", scCompiler.initials_table);
      console.groupEnd();

      return res;
    } catch (e) {
      console.log("Symbols", this.symbol_table);
      console.log("Structs", this.tag_table);
      console.log("Initials", scCompiler.initials_table);
      console.groupEnd();
      throw e;
    }
  }

  compileDefinition(def: Definition) {
    if (isFunctionDeclaration(def)) {
      return compileFunctionDeclaration(this, def);
    } else if (isGlobalVariableDeclaration(def)) {
      return compileGlobalVariableDeclaration(this, def);
    }
  }

  dumplits() {
    if (this.litq.length == 0) return undefined;
    const chunkSize = 8;
    const chunks: number[][] = [];
    for (let i = 0; i < this.litq.length; i += chunkSize) {
      chunks.push(this.litq.slice(i, i + chunkSize));
    }
    return expandToNode`
      $${this.litlab}:
        ${joinToNode(
          chunks.map((b8) => `db  ${b8.join(", ")}`),
          { appendNewLineIfNotEmpty: true }
        )}
    `;
  }

  dumpglobals() {
    const lines: string[] = [];
    for (let i = 0; i < this.symbol_table.global_table_index; i++) {
      const globalSymbol = this.symbol_table.symbols[i];
      if (globalSymbol.identity == SymbolIdentity.FUNCTION) {
        lines.push(...this.generator.fpubext(globalSymbol));
      } else {
        lines.push(...this.generator.ppubext(globalSymbol));
        if (globalSymbol.storage == SymbolStorage.EXTERN) continue;
        lines.push(`${globalSymbol.name}:`);
        let dim = globalSymbol.offset;
        let list_size = 0;
        let line_count = 0;
        const initials = this.initials_table.initials[globalSymbol.name];
        if (initials) {
          list_size = initials.dim;
          if (dim == -1) {
            dim = list_size;
          }
        }
        const def = globalSymbol.type & SymbolType.CINT || globalSymbol.identity == SymbolIdentity.POINTER ? "dw" : "db";
        for (let j = 0; j < dim; j++) {
          if (globalSymbol.type == SymbolType.STRUCT) {
            lines.push(...this.dumpstruct(globalSymbol, i));
          } else {
            if (line_count % 10 == 0) {
              lines.push(`${def} `);
            }
            if (j < list_size) {
              const value = this.initials_table.get_item_at(globalSymbol.name, j, 0);
              lines[lines.length - 1] += value?.toString();
            } else {
              lines[lines.length - 1] += "0";
            }
            line_count++;
            if (line_count % 10 == 0) line_count = 0;
            else {
              if (j < dim - 1) lines[lines.length - 1] += ", ";
            }
          }
        }
      }
    }
    return joinToNode(lines, AppendNL);
  }

  dumpstruct(sym: ISymbol, position: number) {
    const lines: string[] = [];
    const tag = this.tag_table.tags[sym.tagidx];
    tag.members.forEach((member, i) => {
      if (member.identity == SymbolIdentity.ARRAY) {
        // arrays in struct can't be initialised
        // struct S { int x[3]; }  - cant do int x[3] = {1,2,3}
        lines.push(`ds ${member.struct_size} ; ${tag.name}.${member.name}[]`);
      } else {
        const def = member.type & SymbolType.CINT || member.identity == SymbolIdentity.POINTER ? "dw" : "db";
        const size = this.initials_table.initials[sym.name]?.dim || 0;
        if (position < size) {
          const value = this.initials_table.get_item_at(sym.name, i, tag);
          lines.push(`${def} ${value} ; ${tag.name}.${member.name}`);
        } else {
          lines.push(`${def} 0 ; ${tag.name}.${member.name}`);
        }
      }
    });
    return lines;
  }
}

export const scCompiler = ScCompiler.Instance;
