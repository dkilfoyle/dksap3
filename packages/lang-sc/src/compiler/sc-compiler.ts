import { AstNode } from "langium";
import { Definition, isFunctionDeclaration, isProgram } from "../language/generated/ast";
import { generator } from "./Generator";
import { compileFunctionDeclaration } from "./function";
import { symbol_table } from "./SymbolTable";
import { tag_table } from "./TagTable";
import { expandTracedToNode, joinToNode, joinTracedToNode, toStringAndTrace } from "langium/generate";
import { IRange } from "monaco-editor";

export function createError(description: string, range?: IRange) {
  return {
    message: `${range?.startLineNumber ? `Line ${range.startLineNumber}: ` : ""}${description}`,
    range,
  };
}

export const compiler = (root: AstNode) => {
  generator.init();
  symbol_table.init();
  tag_table.init();

  if (!isProgram(root)) throw Error("Compiler expects Program root node");

  return toStringAndTrace(expandTracedToNode(root)`
    ; SmallC v2.4 8080 output
    ${joinToNode(root.definitions.map((def) => compileDefinition(def)))}
  `);
};

const compileDefinition = (def: Definition) => {
  if (isFunctionDeclaration(def)) {
    return compileFunctionDeclaration(def);
  } else throw createError("Non function definitions not implemented");
};
