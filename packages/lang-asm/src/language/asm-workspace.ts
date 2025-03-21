import { AstNode, DefaultWorkspaceManager, LangiumDocument, LangiumDocumentFactory } from "langium";
import { LangiumSharedServices } from "langium/lsp";
import { WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";
import { assembler } from "../assembler/asm-assembler";

import { runtime8080 } from "../assembler/runtime8080";
import { os8080 } from "../assembler/os8080";
import { stdlib8080 } from "../assembler/stdlib8080";

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
    // Load runtime using the `builtin` URI schema
    const runtime = this.documentFactory.fromString(runtime8080, URI.parse("builtin:///runtime8080.asm"));
    assembler.runtime = runtime;
    collector(runtime);
    // load os
    const os = this.documentFactory.fromString(os8080, URI.parse("builtin:///os8080.asm"));
    assembler.os = os;
    collector(os);
    // load stdlib
    const stdlib = this.documentFactory.fromString(stdlib8080, URI.parse("builtin:///stdlib8080.asm"));
    assembler.stdlib = stdlib;
    collector(stdlib);
  }
}
