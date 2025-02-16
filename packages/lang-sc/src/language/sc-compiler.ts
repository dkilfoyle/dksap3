import { AstNode, AstUtils } from "langium";
import { isFunctionDeclaration, isProgram } from "./generated/ast";

export const compiler = (root: AstNode) => {
  let asm = "";
  if (!isProgram(root)) throw Error("Compiler expects Program root node");
  root.definitions.forEach((def) => {
    if (isFunctionDeclaration(def)) {
      asm += `${def.name}:\n`;
    }
  });
  return asm;
};
