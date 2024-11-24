import { AstNode, DocumentationProvider } from "langium";
import { isInstr, isInstruction, isOperation } from "./generated/ast.js";
import { operationInfo } from "./opcodes.js";

export class AsmDocumentationProvider implements DocumentationProvider {
  getDocumentation(node: AstNode) {
    if (isInstr(node)) {
      const info = operationInfo[node.op.name.toUpperCase()];
      if (!info) return "";

      let help = node.op.name.toUpperCase();
      if (info.arg1) help += " " + info.arg1;
      if (info.arg2) help += ", " + info.arg2;
      help += "\n\n";
      help += info.help;
      return help;
    } else if (isOperation(node)) {
      const info = operationInfo[node.name.toUpperCase()];
      if (!info) return "";

      let help = node.name.toUpperCase();
      if (info.arg1) help += " " + info.arg1;
      if (info.arg2) help += ", " + info.arg2;
      help += "\n\n";
      help += info.help;
      return help;
    }

    return "";
  }
}
