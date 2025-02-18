import { AstNode, DocumentState, EmptyFileSystem, LangiumDocument } from "langium";
import { startLanguageServer } from "langium/lsp";
import { BrowserMessageReader, BrowserMessageWriter, createConnection, NotificationType } from "vscode-languageserver/browser";
import { createScServices } from "./sc-module";
import { compiler } from "../compiler/sc-compiler";

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared, Sc } = createScServices({ connection, ...EmptyFileSystem });

console.log("Starting SmallC main browser");
startLanguageServer(shared);

export type ScDocumentChange = {
  uri: string;
  ast: string;
  asm: string;
};

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const sendScDocumentChange = (document: LangiumDocument<AstNode>) => {
  const asm = compiler(document.parseResult.value);
  const json = Sc.serializer.JsonSerializer.serialize(document.parseResult.value, {
    sourceText: false,
    textRegions: true,
    refText: true,
  });
  const documentChangeNotification = new NotificationType<ScDocumentChange>("browser/ScDocumentChange");
  // console.log("Sending notification from browser:", hackvm.trace);
  connection.sendNotification(documentChangeNotification, {
    uri: document.uri.toString(),
    ast: json,
    asm,
  });
};

const debouncedSendScDocumentChange = debounce(sendScDocumentChange, 1000);

shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, (documents) => {
  for (const document of documents) {
    // console.log(document);
    // console.log("AST", document.parseResult.value);
    if (document.diagnostics?.length == 0) {
      debouncedSendScDocumentChange(document);
    }
  }
});
