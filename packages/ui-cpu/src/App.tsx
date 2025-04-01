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
  labels: string[];
}

function App() {
  const [computerState, setComputerState] = useState<ComputerState[]>([getZeroState()]);
  const [stackFrames, setStackFrames] = useState<IStackFrame[]>([]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.command) {
        case "setComputerState":
          // if (!message.data || message.data.length == 0) debugger;
          setComputerState(message.data);
          break;
        case "setStackFrames":
          // if (!message.data || message.data.length == 0) debugger;
          setStackFrames(message.data);
          break;
      }
    });
  }, []);

  return (
    <div className="vscode-page p-3 flex justify-center text-sm">
      <ComputerUI computerState={computerState} stackFrames={stackFrames}></ComputerUI>
    </div>
  );
}

export default App;
