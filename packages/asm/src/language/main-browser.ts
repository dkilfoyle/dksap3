import { DocumentState, EmptyFileSystem } from "langium";
import { startLanguageServer } from "langium/lsp";
import { BrowserMessageReader, BrowserMessageWriter, createConnection, NotificationType } from "vscode-languageserver/browser.js";
import { createAsmServices } from "./asm-module.js";
import { assember } from "./asm-assembler.js";

console.log("Starting asm main browser");

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared, Asm } = createAsmServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);

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
    if (document.diagnostics?.length == 0) {
      console.log("AST", document.parseResult.value);
      const { bytes, lineAddressMap, identifierMap } = assember(document.parseResult.value);
      console.log({
        identifierMap,
        bytes: bytes.slice(0, 0x60),
      });
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
