import { ExtensionConfig, LanguageClientConfig } from "monaco-editor-wrapper";
import ScLanguageConfig from "./language-configuration.json";
import ScTmSyntax from "./sc.tmLanguage.json";

export const getScLanguageClientConfig = (): LanguageClientConfig => {
  // vite does not extract the worker properly if it is URL is a variable
  const lsWorker = new Worker(new URL("../language/main-browser", import.meta.url), {
    type: "module",
    name: "Sc Language Server",
  });

  return {
    name: "Sc",
    connection: {
      options: {
        $type: "WorkerDirect",
        worker: lsWorker,
      },
    },
    clientOptions: {
      documentSelector: ["sc"], // the language id, NOT extension
    },
  };
};

const getScExtensionFiles = () => {
  const files = new Map<string, string | URL>();
  files.set(`/sc-configuration.json`, JSON.stringify(ScLanguageConfig));
  files.set(`/sc-grammar.json`, JSON.stringify(ScTmSyntax));
  return files;
};

export const getScLanguageExtension = (): ExtensionConfig => {
  return {
    config: {
      name: "sc-language-extension",
      publisher: "DK",
      version: "1.0.0",
      engines: {
        vscode: "*",
      },
      contributes: {
        languages: [
          {
            id: "sc",
            extensions: [".sc", ".c"],
            aliases: ["Sc"],
            configuration: `./sc-configuration.json`,
          },
        ],
        grammars: [
          {
            language: "sc",
            scopeName: "source.sc",
            path: `./sc-grammar.json`,
          },
        ],
        configuration: {
          title: "SmallC",
          properties: {
            "sc.compiler.commentStatements": {
              type: "boolean",
              default: true,
              description: "Annotate the start of each statement in compiled asm code",
            },
            "sc.compiler.commentExpressions": {
              type: "boolean",
              default: true,
              description: "Annotate the start of each expression in compiled asm code",
            },
          },
        },
      },
    },
    filesOrContents: getScExtensionFiles(),
  };
};
