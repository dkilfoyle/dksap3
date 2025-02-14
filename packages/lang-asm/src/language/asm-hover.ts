import { AstNode, DocumentationProvider, LangiumDocument, MaybePromise } from "langium";
import { Hover, HoverParams } from "vscode-languageclient";
import { AstNodeHoverProvider, LangiumServices } from "langium/lsp";
import { isOperation } from "./generated/ast.js";
import { CstUtils } from "langium";

export class AsmHoverProvider extends AstNodeHoverProvider {
  documentationProvider: DocumentationProvider;

  constructor(services: LangiumServices) {
    super(services);
    this.documentationProvider = services.documentation.DocumentationProvider;
  }

  override getHoverContent(document: LangiumDocument, params: HoverParams): MaybePromise<Hover | undefined> {
    const rootNode = document.parseResult?.value?.$cstNode;
    if (rootNode) {
      const offset = document.textDocument.offsetAt(params.position);
      const cstNode = CstUtils.findLeafNodeBeforeOffset(rootNode, offset);

      if (isOperation(cstNode?.astNode)) return this.getAstNodeHoverContent(cstNode.astNode);
      if (cstNode && cstNode.offset + cstNode.length > offset) {
        const targetNode = this.references.findDeclaration(cstNode);
        if (targetNode) {
          return this.getAstNodeHoverContent(targetNode);
        }
      }
    }
    return undefined;
  }

  protected getAstNodeHoverContent(node: AstNode): Hover | undefined {
    if (isOperation(node)) {
      const docInfo = this.documentationProvider.getDocumentation(node);
      if (docInfo) {
        return {
          contents: {
            kind: "markdown",
            value: docInfo,
          },
        };
      }
    }
    return undefined;
  }
}
