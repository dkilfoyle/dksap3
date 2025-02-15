import { ExtensionHostKind, registerExtension } from "@codingame/monaco-vscode-api/extensions";
import * as vscode from "vscode";
import { AsmDebugSession } from "./AsmDebugSession.ts";
import { DebugConfiguration, WorkspaceFolder } from "vscode";
import { compiledDocs } from "./AsmRuntime.ts";

let outputChannel: vscode.OutputChannel;

export const printOutputChannel = (content: string, reveal = false) => {
  outputChannel.appendLine(content);
  if (reveal) outputChannel.show(true);
};

const { getApi, registerFileUrl } = registerExtension(
  {
    name: "debugger",
    publisher: "codingame",
    version: "1.0.0",
    engines: {
      vscode: "*",
    },
    // A browser field is mandatory for the extension to be flagged as `web`
    browser: "extension.js",
    contributes: {
      debuggers: [
        {
          type: "asm",
          label: "dk8085 ASM",
          languages: ["asm"],
          configurationAttributes: {
            launch: {
              required: ["program"],
              properties: {
                program: { type: "string", description: "Path to asm source file", default: "${workspaceFolder}/ummmm" },
                stopOnEntry: { type: "boolean", description: "Stop after launch", default: true },
                trace: { type: "boolean", description: "Enable logging of debug adapter protocol", default: true },
              },
            },
          },
        },
      ],
      breakpoints: [
        {
          language: "asm",
        },
      ],
      menus: {
        "editor/title/run": [
          {
            command: "extension.asm-debug.runEditorContents",
            when: "resourceLangId == asm",
            group: "navigation@1",
          },
        ],
        commandPalette: [
          {
            command: "extension.asm-debug.runEditorContents",
            when: "resourceLangId == asm",
          },
        ],
        "debug/variables/context": [
          {
            command: "extension.mock-debug.toggleFormatting",
            when: "debugType == 'mock' && debugProtocolVariableMenuContext == 'simple'",
          },
        ],
      },
      commands: [
        {
          command: "extension.asm-debug.runEditorContents",
          title: "Run File",
          category: "Asm Debug",
          enablement: "!inDebugMode",
          icon: "$(play)",
        },
      ],
    },
  },
  ExtensionHostKind.LocalProcess
);

registerFileUrl("./extension.js", "data:text/javascript;base64," + window.btoa("// nothing"));

void getApi().then(async (debuggerVscodeApi) => {
  outputChannel = vscode.window.createOutputChannel("8085 Emulator");

  debuggerVscodeApi.commands.registerCommand("extension.asm-debug.runEditorContents", (resource: vscode.Uri) => {
    let targetResource; // = resource;
    let fn: string | undefined;
    if (!targetResource && debuggerVscodeApi.window.activeTextEditor) {
      targetResource = debuggerVscodeApi.window.activeTextEditor.document.uri;
      fn = debuggerVscodeApi.window.activeTextEditor.document.uri.toString();
    }
    if (targetResource && fn) {
      debuggerVscodeApi.debug.startDebugging(
        undefined,
        {
          type: "asm",
          name: "Run File",
          request: "launch",
          program: targetResource.toString(),
          labels: compiledDocs[fn].identifierMap,
          stopOnEntry: false,
        },
        { noDebug: true }
      );
    }
  });

  debuggerVscodeApi.debug.registerDebugConfigurationProvider("asm", {
    resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration) {
      const editor = debuggerVscodeApi.window.activeTextEditor;
      if (!(editor && editor.document.languageId == "asm")) return undefined;
      return {
        type: "asm",
        name: "Launch",
        request: "launch",
        program: config.program || editor?.document.uri.toString(),
        stopOnEntry: config.stopOnEntry || false,
        labels: config.labels || {},
      };
    },
  });

  debuggerVscodeApi.debug.registerDebugAdapterDescriptorFactory("asm", {
    async createDebugAdapterDescriptor() {
      return new debuggerVscodeApi.DebugAdapterInlineImplementation(new AsmDebugSession());
    },
  });
});
