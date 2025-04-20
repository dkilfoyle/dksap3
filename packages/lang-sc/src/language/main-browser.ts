import { AstNode, DocumentState, EmptyFileSystem, LangiumDocument } from "langium";
import { startLanguageServer } from "langium/lsp";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  DidChangeConfigurationParams,
  FoldingRange,
  NotificationType,
  Trace,
} from "vscode-languageserver/browser";
import { createScServices } from "./sc-module";
import { TraceRegion } from "langium/generate";
import { userPreferences } from "./sc-userpreferences";
import { scCompiler } from "../compiler/sc-compiler";
import { getAsmFolds } from "./sc-fold";

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);
const { shared, Sc } = createScServices({ connection, ...EmptyFileSystem });

// console.log("Starting SmallC main browser");
startLanguageServer(shared);

connection.onDidChangeConfiguration((params: DidChangeConfigurationParams) => {
  // console.log("sc config", params);
  userPreferences.compiler.commentStatements = params.settings.sc.compiler.commentStatements ?? userPreferences.compiler.commentStatements;
  userPreferences.compiler.commentExpressions = params.settings.sc.compiler.commentExpressions ?? userPreferences.compiler.commentExpressions;
  shared.workspace.DocumentBuilder.build(shared.workspace.LangiumDocuments.all.toArray());
});

export type ScDocumentChange = {
  uri: string;
  ast: string;
  asm: string;
  trace: TraceRegion;
  asmFolds: FoldingRange[];
};

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const sendScDocumentChange = (document: LangiumDocument<AstNode>) => {
  const asm = scCompiler.compile(document.uri.toString(), document.parseResult.value);
  const json = Sc.serializer.JsonSerializer.serialize(document.parseResult.value, {
    sourceText: false,
    textRegions: true,
    refText: true,
  });
  const documentChangeNotification = new NotificationType<ScDocumentChange>("browser/ScDocumentChange");
  connection.sendNotification(documentChangeNotification, {
    uri: document.uri.toString(),
    ast: json,
    asm: asm.text,
    trace: asm.trace,
    asmFolds: getAsmFolds(document, asm.trace),
  });
};

const debouncedSendScDocumentChange = debounce(sendScDocumentChange, 1000);

shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, (documents) => {
  for (const document of documents) {
    // console.log(document);
    // console.log(`AST for ${document.uri.toString()}`, document.parseResult.value);
    if (document.diagnostics?.length == 0) {
      // debouncedSendScDocumentChange(document);
      sendScDocumentChange(document);
    }
  }
});
