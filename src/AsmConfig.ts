import { LanguageClientConfig, WrapperConfig } from "monaco-editor-wrapper";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import { LogLevel } from "vscode/services";
import { MessageTransports } from "vscode-languageclient";
import { useWorkerFactory } from "monaco-editor-wrapper/workerFactory";
import { Logger } from "monaco-languageclient/tools";

import AsmLanguageConfig from "asm/language-configuration.json?raw";
import AsmTmSyntax from "asm/config/asm.tmLanguage.json?raw";

export const configureMonacoWorkers = (logger?: Logger) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useWorkerFactory({
    workerOverrides: {
      ignoreMapping: true,
      workerLoaders: {
        TextEditorWorker: () => new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url), { type: "module" }),
        TextMateWorker: () =>
          new Worker(new URL("@codingame/monaco-vscode-textmate-service-override/worker", import.meta.url), { type: "module" }),
      },
    },
    logger,
  });
};

export const createWrapperConfig = async (params: {
  languageServerId: string;
  useLanguageClient: boolean;
  htmlContainer: HTMLElement;
  text: string;
  worker?: Worker;
  messagePort?: MessagePort;
  messageTransports?: MessageTransports;
}): Promise<WrapperConfig> => {
  const extensionFilesOrContents = new Map<string, string | URL>();
  extensionFilesOrContents.set(`/${params.languageServerId}-configuration.json`, AsmLanguageConfig);
  extensionFilesOrContents.set(`/${params.languageServerId}-grammar.json`, AsmTmSyntax);

  let main;
  if (params.text !== undefined) {
    main = {
      text: params.text,
      fileExt: ".asm",
    };
  }

  const languageClientConfigs: Record<string, LanguageClientConfig> | undefined =
    params.useLanguageClient && params.worker
      ? {
          asm: {
            name: "asm",
            clientOptions: {
              documentSelector: ["asm"],
            },
            connection: {
              options: {
                $type: "WorkerDirect",
                worker: params.worker,
                messagePort: params.messagePort,
              },
              messageTransports: params.messageTransports,
            },
          },
        }
      : undefined;

  return {
    logLevel: LogLevel.Debug,

    vscodeApiConfig: {
      userServices: {
        ...getKeybindingsServiceOverride(),
        // ...getLifecycleServiceOverride(),
        // ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
      },
      userConfiguration: {
        json: JSON.stringify({
          "workbench.colorTheme": "Default Dark Modern",
          "editor.guides.bracketPairsHorizontal": "active",
          "editor.wordBasedSuggestions": "off",
          "editor.experimental.asyncTokenization": true,
          "editor.folding": true,
          "editor.foldingStrategy": "indentation",
        }),
      },
    },

    editorAppConfig: {
      $type: "extended",
      codeResources: {
        main,
      },
      useDiffEditor: false,
      extensions: [
        {
          config: {
            name: "asm",
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
                  configuration: `./${params.languageServerId}-configuration.json`,
                },
              ],

              grammars: [
                {
                  language: "asm",
                  scopeName: "source.asm",
                  path: `./${params.languageServerId}-grammar.json`,
                },
              ],
            },
          },
          filesOrContents: extensionFilesOrContents,
        },
      ],
      monacoWorkerFactory: configureMonacoWorkers,
      htmlContainer: params.htmlContainer,
    },
    languageClientConfigs,
  };
};
