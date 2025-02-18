import { AstNode } from "langium";
import { isFunctionDeclaration, isProgram } from "../language/generated/ast";
import { generator } from "./Generator";
import { compileFunctionDeclaration } from "./function";

export const compiler = (root: AstNode) => {
  generator.init();
  if (!isProgram(root)) throw Error("Compiler expects Program root node");
  root.definitions.forEach((def) => {
    if (isFunctionDeclaration(def)) {
      compileFunctionDeclaration(def);
    }
  });
  return generator.asm;
};
