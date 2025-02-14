import AsmLanguageConfig from "./language-configuration.json" with {type: "json"};
import AsmTmSyntax from "./asm.tmLanguage.json" with {type: "json"};

export const getAsmLanguageClientConfig = () => {
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

export const getAsmLanguageExtension = () => {
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
