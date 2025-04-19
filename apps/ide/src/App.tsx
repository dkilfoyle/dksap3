import "./App.css";
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper";
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import { configure, configurePostStart, sourceAsts, traceRegions } from "./config.js";
import * as monaco from "@codingame/monaco-vscode-editor-api";
import * as vscode from "vscode";
import "./debugger/debugger.js";

import { doIfInside, findFirstCodingLineAtOrAfter, ZeroPos } from "@dksap3/lang-sc";
// "../../../packages/lang-sc/src/language/traceUtils.js";

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
            const sourceUri = uri.toString();
            const targetUri = uri.toString().replace(".c", ".asm");
            // get the icode editor for the .c source file
            const sourceEditor = monaco.editor.getEditors().find((me) => me.getModel()?.uri.toString() == sourceUri);
            const targetEditor = monaco.editor.getEditors().find((me) => me.getModel()?.uri.toString() == targetUri);
            if (sourceEditor && targetEditor && sourceUri.endsWith(".c")) {
              const trace = traceRegions[sourceEditor.getModel()!.uri.toString()];
              const sourceAst = sourceAsts[sourceEditor.getModel()!.uri.toString()];
              console.log("pos", pos.line, pos.character);
              if (trace && sourceAst) {
                const sourceRegion = findFirstCodingLineAtOrAfter("source", trace, pos.line);
                const sourceDecs = decorations[uri.toString()];
                const targetDecs = decorations[uri.toString().replace(".c", ".asm")];
                if (sourceRegion) {
                  const sourceHighlights: monaco.editor.IModelDeltaDecoration[] = [];
                  const targetHighlights: monaco.editor.IModelDeltaDecoration[] = [];
                  doIfInside("source", sourceRegion, ZeroPos.FromVsCode(pos), (node) => {
                    sourceHighlights.unshift({
                      range: new monaco.Range(
                        node.sourceRegion!.range!.start.line + 1,
                        node.sourceRegion!.range!.start.character + 1,
                        node.sourceRegion!.range!.end.line + 1,
                        node.sourceRegion!.range!.end.character + 1
                      ),
                      options: {
                        isWholeLine: false,
                        className: "myContentClass",
                        zIndex: sourceHighlights.length,
                      },
                    });
                    targetHighlights.unshift({
                      range: new monaco.Range(
                        node.targetRegion!.range!.start.line + 1,
                        node.targetRegion!.range!.start.character + 1,
                        node.targetRegion!.range!.end.line + 1,
                        node.targetRegion!.range!.end.character + 1
                      ),
                      options: {
                        isWholeLine: false,
                        className: "myContentClass",
                        zIndex: targetHighlights.length,
                      },
                    });
                  });

                  console.log(sourceHighlights);
                  console.log(targetHighlights);

                  // const start = sourceRegion.sourceRegion!.range!.start;
                  // const end = sourceRegion.sourceRegion!.range!.end;
                  // const highlight = {
                  //   range: new monaco.Range(start.line + 1, start.character + 1, end.line + 1, end.character + 1),
                  //   options: {
                  //     isWholeLine: false,
                  //     className: "myContentClass",
                  //     glyphMarginClassName: "myGlyphMarginClass",
                  //   },
                  // };
                  if (!sourceDecs) decorations[sourceUri] = sourceEditor.createDecorationsCollection(sourceHighlights);
                  else sourceDecs.set(sourceHighlights);
                  if (!targetDecs) decorations[targetUri] = targetEditor.createDecorationsCollection(targetHighlights);
                  else targetDecs.set(targetHighlights);
                } else {
                  sourceDecs.set([]);
                  targetDecs.set([]);
                }
              }
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
