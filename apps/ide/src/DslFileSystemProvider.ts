import * as vscode from "vscode";

import { runtime8080 } from "../../../packages/lang-asm";
const runtime8080bytes = Uint8Array.from(Array.from(runtime8080).map((letter) => letter.charCodeAt(0)));

import { os8080 } from "../../../packages/lang-asm";
const os8080bytes = Uint8Array.from(Array.from(os8080).map((letter) => letter.charCodeAt(0)));

import { stdlibsrc } from "../../../packages/lang-sc";
const stdlibbytes = Uint8Array.from(Array.from(stdlibsrc).map((letter) => letter.charCodeAt(0)));

const lib: Record<string, Uint8Array> = {
  "builtin:/os8080.asm": os8080bytes,
  "builtin:/runtime8080.asm": runtime8080bytes,
  "builtin:/stdlib.c": stdlibbytes,
};

export class DslLibraryFileSystemProvider implements vscode.FileSystemProvider {
  stat(uri: vscode.Uri): vscode.FileStat {
    const date = Date.now();
    return {
      ctime: date,
      mtime: date,
      size: lib[uri.toString()].length,
      type: vscode.FileType.File,
    };
  }

  readFile(uri: vscode.Uri): Uint8Array {
    // We could return different libraries based on the URI
    // We have only one, so we always return the same
    return lib[uri.toString()];
  }

  // The following class members only serve to satisfy the interface

  private readonly didChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  onDidChangeFile = this.didChangeFile.event;

  watch() {
    return {
      dispose: () => {},
    };
  }

  readDirectory(): [] {
    throw vscode.FileSystemError.NoPermissions();
  }

  createDirectory() {
    throw vscode.FileSystemError.NoPermissions();
  }

  writeFile() {
    throw vscode.FileSystemError.NoPermissions();
  }

  delete() {
    throw vscode.FileSystemError.NoPermissions();
  }

  rename() {
    throw vscode.FileSystemError.NoPermissions();
  }
}
