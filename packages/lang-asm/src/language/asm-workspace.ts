import { AstNode, DefaultWorkspaceManager, LangiumDocument, LangiumDocumentFactory } from "langium";
import { LangiumSharedServices } from "langium/lsp";
import { WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";
import { runtime8080 } from "../assembler/runtime8080";
import { assembler } from "../assembler/asm-assembler";

export class AsmWorkspaceManager extends DefaultWorkspaceManager {
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
    // Load our library using the `builtin` URI schema
    const node = this.documentFactory.fromString(runtime8080, URI.parse("builtin:///runtime8080.asm"));
    assembler.runtime = node;
    collector(node);
  }
}
