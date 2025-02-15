import "./App.css";
import { MonacoEditorLanguageClientWrapper, type TextChanges } from "monaco-editor-wrapper";
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import { configure, configurePostStart } from "./config.js";

import "./debugger/debugger.js";
const configResult = configure();

function App() {
  const onTextChanged = (textChanges: TextChanges) => {
    console.log(`Dirty? ${textChanges.isDirty}\ntext: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
  };

  return (
    <div style={{ backgroundColor: "#1f1f1f" }}>
      <MonacoEditorReactComp
        wrapperConfig={configResult.wrapperConfig}
        onTextChanged={onTextChanged}
        onLoad={async (wrapper: MonacoEditorLanguageClientWrapper) => {
          await configurePostStart(wrapper, configResult);
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
