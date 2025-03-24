import { AstNode, DocumentState, EmptyFileSystem, LangiumDocument } from "langium";
import { startLanguageServer } from "langium/lsp";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  DidChangeConfigurationParams,
  NotificationType,
} from "vscode-languageserver/browser.js";
import { createAsmServices } from "./asm-module.js";
import { assembler } from "../assembler/asm-assembler.js";
import { ILinkerInfo } from "../assembler/asm-linker.js";
import { userPreferences } from "./asm-userpreferences.js";

const status = {
  isDebugging: false,
};

console.info("Starting asm main browser");

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared, Asm } = createAsmServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);

connection.onDidChangeConfiguration((params: DidChangeConfigurationParams) => {
  userPreferences.format.indentTabs = params.settings.asm.format.indentTabs ?? userPreferences.format.indentTabs;
  userPreferences.format.commentTabs = params.settings.asm.format.commentTabs ?? userPreferences.format.commentTabs;
  userPreferences.syntax.maxLabelSize = params.settings.asm.syntax.maxLabelSize ?? userPreferences.syntax.maxLabelSize;
});

connection.onNotification("statusChange", (n) => {
  if (n.isDebugging != undefined) status.isDebugging = n.isDebugging;
  // console.log("asmStatusChanged:", status);
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
  console.log("LinkerInfo:", linkerInfo);

  const json = Asm.serializer.JsonSerializer.serialize(document.parseResult.value, {
    sourceText: false,
    textRegions: true,
    refText: true,
  });
  const documentChangeNotification = new NotificationType<AsmDocumentChange>("browser/AsmDocumentChange");
  // console.log("Sending notification from browser:", hackvm.trace);
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
    // console.log("AST", document.parseResult.value);
    // console.log("Builtin", shared.workspace.LangiumDocuments);
    if (document.diagnostics?.length == 0) {
      debouncedSendAsmDocumentChange(document);
    }
  }
});
