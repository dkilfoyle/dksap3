import { ComputerUI } from "./ui/ComputerUI";
import { useEffect, useState } from "react";
import { getZeroState } from "./emulator/Computer";
import { ComputerState } from "../../cpusim";

import "./App.css";

function App() {
  const [computerState, setComputerState] = useState<ComputerState[]>([getZeroState()]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.command) {
        case "setComputerState":
          // if (!message.data || message.data.length == 0) debugger;
          setComputerState(message.data);
          break;
      }
    });
  }, []);

  return (
    <div className="vscode-page p-3 flex justify-center text-sm">
      <ComputerUI computerState={computerState}></ComputerUI>
    </div>
  );
}

export default App;
