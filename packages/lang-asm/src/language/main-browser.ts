import { AstNode, DocumentState, EmptyFileSystem, FileSystemNode, FileSystemProvider, LangiumDocument, URI } from "langium";
import { startLanguageServer } from "langium/lsp";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  DidChangeConfigurationParams,
  FoldingRange,
  NotificationType,
} from "vscode-languageserver/browser.js";
import { createAsmServices } from "./asm-module.js";
import { assembler } from "../assembler/asm-assembler.js";
import { ILinkerInfo } from "../assembler/asm-linker.js";
import { userPreferences } from "./asm-userpreferences.js";
import { compiledFolds } from "./asm-fold.js";

const status = {
  isDebugging: false,
};

// console.info("Starting ASM main browser");

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

class EmptyFileSystemProvider implements FileSystemProvider {
  readFile(uri: URI): Promise<string> {
    // hack
    // sc compiler writes compiled asm
    // langium watch detects file
    // but documentbuilder gets "" - why???
    // opening file tab works ok
    return new Promise((resolve) => resolve("main:"));
  }

  async readDirectory(): Promise<FileSystemNode[]> {
    return [];
  }
}

const { shared, Asm } = createAsmServices({ connection, fileSystemProvider: () => new EmptyFileSystemProvider() });

startLanguageServer(shared);

connection.onDidChangeConfiguration((params: DidChangeConfigurationParams) => {
  userPreferences.format.indentTabs = params.settings.asm.format.indentTabs ?? userPreferences.format.indentTabs;
  userPreferences.format.commentTabs = params.settings.asm.format.commentTabs ?? userPreferences.format.commentTabs;
  userPreferences.syntax.maxLabelSize = params.settings.asm.syntax.maxLabelSize ?? userPreferences.syntax.maxLabelSize;
});

connection.onNotification("statusChange", (n) => {
  if (n.isDebugging != undefined) status.isDebugging = n.isDebugging;
});

connection.onNotification("asmFolds", (params: { folds: FoldingRange[]; uri: string }) => {
  compiledFolds[params.uri] = params.folds;
});

connection.onNotification("newCompiledAsm", (params: { text: string; uri: string }) => {
  shared.workspace.LangiumDocumentFactory.fromString(params.text, URI.file(params.uri));
});

export type AsmDocumentChange = {
  uri: string;
  ast: string;
  machineCode: Uint8Array;
  linkerInfo: ILinkerInfo;
};

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const sendAsmDocumentChange = (document: LangiumDocument<AstNode>) => {
  if (status.isDebugging) return;
  const { bytes, linkerInfo } = assembler.assembleAndLink([document]);

  const json = Asm.serializer.JsonSerializer.serialize(document.parseResult.value, {
    sourceText: false,
    textRegions: true,
    refText: true,
  });
  const documentChangeNotification = new NotificationType<AsmDocumentChange>("browser/AsmDocumentChange");
  connection.sendNotification(documentChangeNotification, {
    uri: document.uri.toString(),
    ast: json,
    machineCode: bytes,
    linkerInfo: linkerInfo,
  });
};

const debouncedSendAsmDocumentChange = debounce(sendAsmDocumentChange, 1000);

shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, (documents) => {
  for (const document of documents) {
    console.log("On build phase", document);
    if (!document.diagnostics) console.log("UNDERFINED");
    if (document.diagnostics?.length != 0) console.log("HAS ERRORS");
    if (document.diagnostics?.length == 0) {
      // debouncedSendAsmDocumentChange(document);
      sendAsmDocumentChange(document);
    }
  }
});
