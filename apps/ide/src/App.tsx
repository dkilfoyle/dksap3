import "./App.css";
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper";
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import { configure, configurePostStart } from "./config.js";
import * as monaco from "@codingame/monaco-vscode-editor-api";
import * as vscode from "vscode";
import "./debugger/debugger.js";

const configResult = configure();
const decorations: Record<string, monaco.editor.IEditorDecorationsCollection> = {};

function App() {
  return (
    <div style={{ backgroundColor: "#1f1f1f" }}>
      <MonacoEditorReactComp
        wrapperConfig={configResult.wrapperConfig}
        onLoad={async (wrapper: MonacoEditorLanguageClientWrapper) => {
          await configurePostStart(wrapper, configResult);

          vscode.window.onDidChangeTextEditorSelection((e) => {
            const uri = e.textEditor.document.uri;
            const pos = e.selections[0].anchor;
            console.log(pos.line);
            // get the icode editor
            const editor = monaco.editor.getEditors().find((me) => me.getModel()?.uri.toString() == uri.toString());
            if (editor) {
              const uri = editor.getModel()!.uri.path;
              const decs = decorations[uri];
              const highlight = {
                range: new monaco.Range(pos.line + 1, 0, pos.line + 1, 0),
                options: {
                  isWholeLine: true,
                  // className: "myContentClass",
                  glyphMarginClassName: "myGlyphMarginClass",
                },
              };
              if (!decs) decorations[uri] = editor.createDecorationsCollection([highlight]);
              else decs.set([highlight]);
              console.log(decorations);
            }
            // e.textEditor.setDecorations(codeLineDecoration, [{ range: new vscode.Range(pos.line, 0, pos.line, 80) }]);
          });
        }}
        onError={(e) => {
          console.error(e);
        }}
        style={{ height: "100vh" }}
      />
    </div>
  );
}

export default App;
