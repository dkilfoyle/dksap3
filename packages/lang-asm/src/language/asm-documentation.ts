import { AstNode, CommentProvider, DocumentationProvider, IndexManager, LangiumCoreServices } from "langium";
import { isAddrArgument, isInstr, isLabel, isOperation } from "./generated/ast.js";
import { operationInfo } from "../opcodes.js";

export class AsmDocumentationProvider implements DocumentationProvider {
  protected readonly indexManager: IndexManager;
  protected readonly commentProvider: CommentProvider;

  constructor(services: LangiumCoreServices) {
    this.indexManager = services.shared.workspace.IndexManager;
    this.commentProvider = services.documentation.CommentProvider;
  }

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
