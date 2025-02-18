import { AstNode } from "langium";
import { isFunctionDeclaration, isProgram } from "../language/generated/ast";
import { generator } from "./Generator";
import { compileFunctionDeclaration } from "./function";
import { symbol_table } from "./SymbolTable";
import { tag_table } from "./TagTable";

export const compiler = (root: AstNode) => {
  generator.init();
  symbol_table.init();
  tag_table.init();

  if (!isProgram(root)) throw Error("Compiler expects Program root node");
  root.definitions.forEach((def) => {
    if (isFunctionDeclaration(def)) {
      compileFunctionDeclaration(def);
    }
  });
  return generator.asm;
};
