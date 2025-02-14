import { DocumentState, EmptyFileSystem } from "langium";
import { startLanguageServer } from "langium/lsp";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  DidChangeConfigurationParams,
  NotificationType,
} from "vscode-languageserver/browser.js";
import { createAsmServices } from "./asm-module.js";
import { assember } from "./asm-assembler.js";
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

shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, (documents) => {
  for (const document of documents) {
    // console.log(document);
    // console.log("AST", document.parseResult.value);
    if (document.diagnostics?.length == 0) {
      const { bytes, lineAddressMap, identifierMap } = assember(document.parseResult.value);
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
    }
  }
});
