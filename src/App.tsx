import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import "./App.css";

import { ComputerUI } from "./sim/ui/ComputerUI";
import { createWrapperConfig } from "./AsmConfig";
import { useCallback, useEffect, useRef, useState } from "react";
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper";
import * as monaco from "monaco-editor";

import { Allotment } from "allotment";
import "allotment/dist/style.css";

import "../node_modules/primeflex/primeflex.css";
import "../node_modules/primeflex/themes/primeone-light.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { PrimeReactProvider } from "primereact/api";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";

import cylon from "./examples/cylon.asm?raw";
import add from "./examples/add.asm?raw";
import test from "./examples/test.asm?raw";

import { AsmDocumentChange } from "asm/src/language/main-browser";

const wrapperConfig = await createWrapperConfig({
  languageServerId: "asm",
  useLanguageClient: true,
  text: test,
  worker: new Worker(new URL("asm/src/language/main-browser.js", import.meta.url), {
    type: "module",
    name: "Asm Language Server",
  }),
  htmlContainer: document.getElementById("monaco-editor-root")!,
});

const files: Record<string, string> = {
  cylon,
  add,
};
function App() {
  const wrapperRef = useRef<MonacoEditorLanguageClientWrapper | null>(null);
  const [asmFile, setAsmFile] = useState("test");
  const [machineCode, setMachineCode] = useState<Uint8Array>(new Uint8Array());
  const [lineAddressMap, setLineAddressMap] = useState<Record<number, number>>({});
  const [asmDecorations, setAsmDecorations] = useState<monaco.editor.IEditorDecorationsCollection>();

  const handleLoad = useCallback(async (editorWrapper: MonacoEditorLanguageClientWrapper) => {
    wrapperRef.current = editorWrapper;
    editorWrapper.getLanguageClient("asm")?.onNotification("browser/AsmDocumentChange", (data: AsmDocumentChange) => {
      console.log("got", data);
      setMachineCode(data.machineCode);
      setLineAddressMap(data.lineAddressMap);
    });
    setAsmDecorations(editorWrapper.getEditor()?.createDecorationsCollection());
  }, []);

  useEffect(() => {
    console.log("Setting file", asmFile);
    wrapperRef.current?.getEditor()?.setValue(files[asmFile]);
  }, [asmFile]);

  const onStep = useCallback(
    (pc: number) => {
      const line = Object.entries(lineAddressMap).find(([key, val]) => val == pc);
      if (line) {
        const delta: monaco.editor.IModelDeltaDecoration[] = [];
        delta.push({
          range: new monaco.Range(parseInt(line[0]) + 1, 0, parseInt(line[0]) + 1, 10),
          options: { isWholeLine: true, linesDecorationsClassName: "sourceRegion" },
        });
        asmDecorations?.set(delta);
      }
    },
    [asmDecorations, lineAddressMap]
  );

  const startContent = <Button label="hello"></Button>;
  const endContent = <Dropdown variant="filled" value={asmFile} onChange={(e) => setAsmFile(e.value)} options={["cylon", "add"]}></Dropdown>;

  return (
    <PrimeReactProvider>
      <Allotment>
        <div className="h-full w-full">
          <Toolbar start={startContent} center={endContent}></Toolbar>
          <MonacoEditorReactComp
            wrapperConfig={wrapperConfig}
            onLoad={handleLoad}
            style={{ height: "100%", width: "100%" }}></MonacoEditorReactComp>
        </div>
        <div className="p-5">
          <ComputerUI machineCode={machineCode} onStep={onStep}></ComputerUI>
        </div>
      </Allotment>
    </PrimeReactProvider>
  );
}

export default App;
