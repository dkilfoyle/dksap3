import { AstNode, Cancellation, DefaultWorkspaceManager, LangiumDocument, LangiumDocumentFactory } from "langium";
import { LangiumSharedServices } from "langium/lsp";
import { WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";
import { stdlibsrc } from "../compiler/stdlib";

export class ScWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory;

  constructor(services: LangiumSharedServices) {
    super(services);
    this.documentFactory = services.workspace.LangiumDocumentFactory;
  }

  protected override async loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument<AstNode>) => void
  ): Promise<void> {
    await super.loadAdditionalDocuments(folders, collector);
    // Load stdlib using the `builtin` URI schema
    const lib_c_ast = this.documentFactory.fromString(stdlibsrc, URI.parse("builtin:///stdlib.c"));
    collector(lib_c_ast);
  }
}
