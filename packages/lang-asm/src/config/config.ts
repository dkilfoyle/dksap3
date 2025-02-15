import { ExtensionConfig, LanguageClientConfig } from "monaco-editor-wrapper";
import AsmLanguageConfig from "./language-configuration.json";
import AsmTmSyntax from "./asm.tmLanguage.json";

export const getAsmLanguageClientConfig = (): LanguageClientConfig => {
  // vite does not extract the worker properly if it is URL is a variable
  const lsWorker = new Worker(new URL("../language/main-browser", import.meta.url), {
    type: "module",
    name: "Asm Language Server",
  });

  return {
    name: "asm",
    connection: {
      options: {
        $type: "WorkerDirect",
        worker: lsWorker,
      },
    },
    clientOptions: {
      documentSelector: ["asm"], // the language id, NOT extension
    },
  };
};

const getAsmExtensionFiles = () => {
  const files = new Map<string, string | URL>();
  files.set(`/asm-configuration.json`, JSON.stringify(AsmLanguageConfig));
  files.set(`/asm-grammar.json`, JSON.stringify(AsmTmSyntax));
  return files;
};

export const getAsmLanguageExtension = (): ExtensionConfig => {
  return {
    config: {
      name: "asm-language-extension",
      publisher: "DK",
      version: "1.0.0",
      engines: {
        vscode: "*",
      },
      contributes: {
        languages: [
          {
            id: "asm",
            extensions: [".asm"],
            aliases: ["asm", "Asm", "ASM"],
            configuration: `./asm-configuration.json`,
          },
        ],

        grammars: [
          {
            language: "asm",
            scopeName: "source.asm",
            path: `./asm-grammar.json`,
          },
        ],
      },
    },
    filesOrContents: getAsmExtensionFiles(),
  };
};
