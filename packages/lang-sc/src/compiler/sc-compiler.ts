import { AstNode, LangiumDocument } from "langium";
import { Definition, isFunctionDeclaration, isGlobalVariableDeclaration, isProgram } from "../language/generated/ast";
import { AsmGenerator } from "./Generator";
import { compileFunctionDeclaration } from "./function";
import { compileGlobalVariableDeclaration, InitialTable, SymbolTable } from "./symbol";
import { TagTable } from "./TagTable";
import { expandToNode, expandTracedToNode, joinToNode, joinTracedToNode, NL, toStringAndTrace } from "langium/generate";
import { IRange } from "monaco-editor";
import { WhileTable } from "./while";
import { AstNodeError } from "./expression";
import { compileGlobalVariableReference } from "./primary";

export function createError(description: string, range?: IRange) {
  return {
    message: `${range?.startLineNumber ? `Line ${range.startLineNumber}: ` : ""}${description}`,
    range,
  };
}

// TODO: compile structs
// TODO: compile static vars

export class ScCompiler {
  private static _instance: ScCompiler;
  generator = new AsmGenerator();
  symbol_table = new SymbolTable(this.generator);
  tag_table = new TagTable();
  litq: number[] = [];
  litlab = this.generator.get_label();
  while_table = new WhileTable(this);
  initials_table = new InitialTable();

  private constructor() {}

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  compile(uri: string, root: AstNode) {
    this.generator.init();
    this.symbol_table.init();
    this.tag_table.init();
    this.while_table.init();
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
    `;

      const res = toStringAndTrace(node);
      console.log("Trace", res.trace);
      console.groupEnd();
      return res;
    } catch (e) {
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

  dumpglobals() {}
}

export const scCompiler = ScCompiler.Instance;
