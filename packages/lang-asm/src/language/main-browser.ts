import { AstNode, DocumentState, EmptyFileSystem, LangiumDocument, URI } from "langium";
import { startLanguageServer } from "langium/lsp";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  DidChangeConfigurationParams,
  NotificationType,
} from "vscode-languageserver/browser.js";
import { createAsmServices } from "./asm-module.js";
import { assember } from "../assembler/asm-assembler.js";
import { userPreferences } from "./asm-userpreferences.js";

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

export type AsmDocumentChange = {
  uri: string;
  content: string;
  machineCode: Uint8Array;
  identifierMap: Record<string, number>;
  lineAddressMap: Record<number, number>;
};

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const sendAsmDocumentChange = (document: LangiumDocument<AstNode>) => {
  const runtimeAst = shared.workspace.LangiumDocuments.getDocument(URI.parse("builtin:/runtime8080.asm"));
  if (!runtimeAst) throw Error("No runtime found");
  const { bytes, lineAddressMap, identifierMap } = assember(document.parseResult.value, runtimeAst.parseResult.value);
  const json = Asm.serializer.JsonSerializer.serialize(document.parseResult.value, {
    sourceText: false,
    textRegions: true,
    refText: true,
  });
  const documentChangeNotification = new NotificationType<AsmDocumentChange>("browser/AsmDocumentChange");
  // console.log("Sending notification from browser:", hackvm.trace);
  connection.sendNotification(documentChangeNotification, {
    uri: document.uri.toString(),
    content: json,
    machineCode: bytes,
    identifierMap,
    lineAddressMap,
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
