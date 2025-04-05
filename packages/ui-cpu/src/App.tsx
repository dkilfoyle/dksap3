import { ComputerUI } from "./ui/ComputerUI";
import { useEffect, useState } from "react";
import { getZeroState } from "./emulator/Computer";
import { ComputerState } from "../../cpusim";

import "./App.css";

export interface IStackFrame {
  name: string;
  file: string;
  base: number;
  mem: number[];
  labels: Record<string, string>;
}

export interface IRuntimeState {
  frames: IStackFrame[];
  hlLabel: string;
  deLabel: string;
}

function App() {
  const [computerState, setComputerState] = useState<ComputerState[]>([getZeroState()]);
  const [runtimeState, setRuntimeState] = useState<IRuntimeState>({
    frames: [], //{ name: "main", file: "hello.asm", base: 10, mem: [3, 2, 1], labels: { "9": "x", "7": "y", "5": "z" } }
    hlLabel: "",
    deLabel: "",
  });

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.command) {
        case "setComputerState":
          // if (!message.data || message.data.length == 0) debugger;
          setComputerState(message.data);
          break;
        case "setRuntimeState":
          // if (!message.data || message.data.length == 0) debugger;
          setRuntimeState(message.data);
          break;
      }
    });
  }, []);

  return (
    <div className="vscode-page p-3 flex justify-center text-sm">
      <ComputerUI computerState={computerState} runtimeState={runtimeState}></ComputerUI>
    </div>
  );
}

export default App;
