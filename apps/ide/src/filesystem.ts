import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from "@codingame/monaco-vscode-files-service-override";
import { createDefaultWorkspaceFile } from "./utils";
import * as vscode from "vscode";

// console.log("Creating filesystem");
export const workspaceFile = vscode.Uri.file("/workspace/.vscode/workspace.code-workspace");

export const fileSystemProvider = new RegisteredFileSystemProvider(false);
fileSystemProvider.registerFile(createDefaultWorkspaceFile(workspaceFile, "/dk8085"));
const examplesAsm = import.meta.glob<string>("./examples/asm/*.asm", { eager: true, query: "?raw", import: "default" });
Object.entries(examplesAsm).forEach(([key, value]) => {
  fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file(`dk8085/${key.replace("./examples/", "")}`), value));
});
const examplesC = import.meta.glob<string>("./examples/c/*.c", { eager: true, query: "?raw", import: "default" });
Object.entries(examplesC).forEach(([key, value]) => {
  fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file(`dk8085/${key.replace("./examples/", "")}`), value));
});
const testC = import.meta.glob<string>("./examples/test/*.c", { eager: true, query: "?raw", import: "default" });
Object.entries(testC).forEach(([key, value]) => {
  fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file(`dk8085/${key.replace("./examples/", "")}`), value));
});
registerFileSystemOverlay(1, fileSystemProvider);
