import { AstNode, AstUtils } from "langium";
import { FunctionDeclaration, isFunctionDeclaration, isProgram } from "./generated/ast";

let labelCount = 0;
const getLabel = () => {
  return "$" + labelCount++;
};

const compileFunctionDeclaration = (fun: FunctionDeclaration) => {
  let asm = "";
  const exitLabel = getLabel();
  asm += `${fun.name}:\n`;
  // asm += compileBlock(fun.body);
  asm += exitLabel + ":\n";
  asm += "ret\n";
};

export const compiler = (root: AstNode) => {
  let asm = "";
  if (!isProgram(root)) throw Error("Compiler expects Program root node");
  root.definitions.forEach((def) => {
    if (isFunctionDeclaration(def)) {
      asm += compileFunctionDeclaration(def);
    }
  });
  return asm;
};
