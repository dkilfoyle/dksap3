/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import { LogLevel } from "@codingame/monaco-vscode-api";
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from "@codingame/monaco-vscode-files-service-override";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import getLifecycleServiceOverride from "@codingame/monaco-vscode-lifecycle-service-override";
import getLocalizationServiceOverride from "@codingame/monaco-vscode-localization-service-override";
import getBannerServiceOverride from "@codingame/monaco-vscode-view-banner-service-override";
import getStatusBarServiceOverride from "@codingame/monaco-vscode-view-status-bar-service-override";
import getTitleBarServiceOverride from "@codingame/monaco-vscode-view-title-bar-service-override";
import getExplorerServiceOverride from "@codingame/monaco-vscode-explorer-service-override";
import getRemoteAgentServiceOverride from "@codingame/monaco-vscode-remote-agent-service-override";
import getEnvironmentServiceOverride from "@codingame/monaco-vscode-environment-service-override";
import getSecretStorageServiceOverride from "@codingame/monaco-vscode-secret-storage-service-override";
import getStorageServiceOverride from "@codingame/monaco-vscode-storage-service-override";
import getSearchServiceOverride from "@codingame/monaco-vscode-search-service-override";
import getWorkbenchServiceOverride from "@codingame/monaco-vscode-workbench-service-override";
import getOutputServiceOverride from "@codingame/monaco-vscode-output-service-override";
import getPreferencesServiceOverride from "@codingame/monaco-vscode-preferences-service-override";
import getMarkersServiceOverride from "@codingame/monaco-vscode-markers-service-override";
import getOutlineServiceOverride from "@codingame/monaco-vscode-outline-service-override";
import getDebugServiceOverride from "@codingame/monaco-vscode-debug-service-override";
import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextMateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";

import { createDefaultLocaleConfiguration } from "monaco-languageclient/vscode/services";
import { configureMonacoWorkers, createDefaultWorkspaceFile } from "./utils.ts";
import type { MonacoEditorLanguageClientWrapper, WrapperConfig } from "monaco-editor-wrapper";
import { RegisterLocalProcessExtensionResult } from "@codingame/monaco-vscode-api/extensions";
import { ScDocumentChange, getScLanguageClientConfig, getScLanguageExtension } from "@dksap3/lang-sc";
import { AsmDocumentChange, getAsmLanguageClientConfig, getAsmLanguageExtension } from "@dksap3/lang-asm";
import { EmulatorWebviewPanel } from "./components/EmulatorWebviewPanel.ts";
import { MemoryWebviewPanel } from "./components/MemoryWebviewPanel.ts";
import { compiledDocs } from "./debugger/AsmRuntime.ts";
import { TraceRegion } from "langium/generate";
import { AstNode } from "langium";
import { DslLibraryFileSystemProvider } from "./DslFileSystemProvider.ts";

export const HOME_DIR = "";
export const WORKSPACE_PATH = `${HOME_DIR}/dk8085`;

export type ConfigResult = {
  wrapperConfig: WrapperConfig;
  workspaceFile: vscode.Uri;
};

export const traceRegions: Record<string, TraceRegion> = {};
export const sourceAsts: Record<string, AstNode> = {};

const workspaceFile = vscode.Uri.file("/workspace/.vscode/workspace.code-workspace");
const fileSystemProvider = new RegisteredFileSystemProvider(false);
// const fileSystemProvider = new InMemoryFileSystemProvider();

fileSystemProvider.registerFile(createDefaultWorkspaceFile(workspaceFile, "/dk8085"));

const examplesAsm = import.meta.glob<string>("./examples/*.asm", { eager: true, query: "?raw", import: "default" });
Object.entries(examplesAsm).forEach(([key, value]) => {
  fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file(`dk8085/${key.replace("./examples/", "")}`), value));
});

const examplesC = import.meta.glob<string>("./examples/*.c", { eager: true, query: "?raw", import: "default" });
Object.entries(examplesC).forEach(([key, value]) => {
  fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file(`dk8085/${key.replace("./examples/", "")}`), value));
});

registerFileSystemOverlay(1, fileSystemProvider);

export const configure = (htmlContainer?: HTMLElement): ConfigResult => {
  const wrapperConfig: WrapperConfig = {
    $type: "extended",
    id: "AAP",
    logLevel: LogLevel.Debug,
    htmlContainer,
    vscodeApiConfig: {
      serviceOverrides: {
        ...getConfigurationServiceOverride(),
        ...getKeybindingsServiceOverride(),
        ...getLifecycleServiceOverride(),
        ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
        ...getBannerServiceOverride(),
        ...getStatusBarServiceOverride(),
        ...getTitleBarServiceOverride(),
        ...getExplorerServiceOverride(),
        ...getRemoteAgentServiceOverride(),
        ...getEnvironmentServiceOverride(),
        ...getSecretStorageServiceOverride(),
        ...getStorageServiceOverride(),
        ...getSearchServiceOverride(),
        ...getWorkbenchServiceOverride(),
        ...getOutlineServiceOverride(),
        ...getMarkersServiceOverride(),
        ...getPreferencesServiceOverride(),
        ...getDebugServiceOverride(),
        ...getOutputServiceOverride(),
        ...getLanguagesServiceOverride(),
        ...getTextMateServiceOverride(),
        ...getThemeServiceOverride(),
      },
      enableExtHostWorker: true,
      viewsConfig: {
        viewServiceType: "WorkspaceService",
      },
      workspaceConfig: {
        enableWorkspaceTrust: true,
        windowIndicator: {
          label: "dksap3",
          tooltip: "",
          command: "",
        },
        workspaceProvider: {
          trusted: true,
          async open() {
            window.open(window.location.href);
            return true;
          },
          workspace: {
            workspaceUri: workspaceFile,
          },
        },
        configurationDefaults: {
          "window.title": "dksap3${separator}${dirty}${activeEditorShort}",
        },
        productConfiguration: {
          nameShort: "dksap3",
          nameLong: "dksap3",
        },
      },
      userConfiguration: {
        json: JSON.stringify({
          "workbench.colorTheme": "Default Dark Modern",
          "editor.wordBasedSuggestions": "off",
          "editor.guides.bracketPairsHorizontal": true,
          "editor.experimental.asyncTokenization": false,
        }),
      },
    },
    languageClientConfigs: {
      sc: getScLanguageClientConfig(),
      asm: getAsmLanguageClientConfig(),
    },
    extensions: [getScLanguageExtension(), getAsmLanguageExtension()],
    editorAppConfig: {
      monacoWorkerFactory: configureMonacoWorkers,
    },
  };

  return {
    wrapperConfig,
    workspaceFile,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const configurePostStart = async (wrapper: MonacoEditorLanguageClientWrapper, _configResult: ConfigResult) => {
  const result = wrapper.getExtensionRegisterResult("sc-language-extension") as RegisterLocalProcessExtensionResult;
  result.setAsDefaultApi();

  vscode.workspace.registerFileSystemProvider("builtin", new DslLibraryFileSystemProvider(), {
    isReadonly: true,
    isCaseSensitive: false,
  });

  vscode.commands.registerCommand("emulator.show", () => {
    EmulatorWebviewPanel.render();
  });
  vscode.commands.registerCommand("memory.show", () => {
    MemoryWebviewPanel.render();
  });

  // vscode.window.registerWebviewViewProvider(memoryViewProvider.viewType, memoryViewProvider);

  EmulatorWebviewPanel.render();
  MemoryWebviewPanel.render();

  wrapper.getLanguageClient("asm")?.onNotification("browser/AsmDocumentChange", (data: AsmDocumentChange) => {
    // console.log("App.tsx onNotification(browser/asmDocumentChange)", data.uri, data.machineCode.length);
    // console.log(JSON.parse(data.content));
    compiledDocs[data.uri] = data;
    MemoryWebviewPanel.sendMemory(Array.from(data.machineCode));
    MemoryWebviewPanel.sendLinkerInfoFileMap(data.linkerInfoFileMap);
  });

  wrapper.getLanguageClient("sc")?.onNotification("browser/ScDocumentChange", async (data: ScDocumentChange) => {
    // console.log("App.tsx onNotification(browser/scDocumentChange)", data.uri);
    // console.log(data.asm);
    // console.log(JSON.parse(data.ast));
    // console.log(data.uri);

    traceRegions[data.uri] = data.trace;
    sourceAsts[data.uri] = JSON.parse(data.ast);

    const uri = vscode.Uri.file(data.uri.replace(".c", ".asm").replace("file:///", ""));
    const content = Uint8Array.from(Array.from(data.asm).map((letter) => letter.charCodeAt(0)));
    vscode.workspace.fs.writeFile(uri, content);

    // compiledDocs[data.uri] = data;
  });

  // const codeLineDecoration = vscode.window.createTextEditorDecorationType({
  //   backgroundColor: "red",
  // });

  // WA: Force show explorer and not search
  // await vscode.commands.executeCommand('workbench.view.explorer');

  // await Promise.all([
  //   await vscode.workspace.openTextDocument(configResult.helloTsUri),
  //   await vscode.workspace.openTextDocument(configResult.testerTsUri),
  // ]);

  // await Promise.all([await vscode.window.showTextDocument(configResult.helloTsUri)]);

  console.log("dksap3 started");
};
