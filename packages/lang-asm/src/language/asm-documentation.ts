import { AstNode, DocumentationProvider } from "langium";
import { isInstr, isOperation } from "./generated/ast.js";
import { operationInfo } from "./opcodes.js";

export class AsmDocumentationProvider implements DocumentationProvider {
  getDocumentation(node: AstNode) {
    if (isInstr(node)) {
      const info = operationInfo[node.op.opname.toUpperCase()];
      if (!info) return "";

      let help = node.op.opname.toUpperCase();
      if (info.arg1) help += " " + info.arg1;
      if (info.arg2) help += ", " + info.arg2;
      help += "\n\n";
      help += info.help;
      return help;
    } else if (isOperation(node)) {
      const info = operationInfo[node.opname.toUpperCase()];
      if (!info) return "";

      let help = node.opname.toUpperCase();
      if (info.arg1) help += " " + info.arg1;
      if (info.arg2) help += ", " + info.arg2;
      help += "\n\n";
      help += info.help;
      return help;
    }

    return "";
  }
}
