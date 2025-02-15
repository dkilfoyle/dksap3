import { CpuComponent } from "../components/CpuComponent";
import { ComputerState } from "../emulator/Computer";
import { fprint } from "./utils";
import { useState } from "react";

const getNextFormat = (f: number) => {
  switch (f) {
    case 2:
      return 8;
    case 8:
      return 10;
    case 10:
      return 16;
    case 16:
      return 2;
    default:
      throw Error("fprint invalid format");
  }
};

export const DisplayUI = ({ compState }: { compState: ComputerState }) => {
  const [format, setFormat] = useState(2);
  return (
    <CpuComponent
      label="Display"
      onFormatToggle={() => setFormat((cur) => getNextFormat(cur))}
      status={compState.ir == 0xd3 ? "input" : "none"}
      direction={compState.ir == 0xd3 ? "down" : "none"}>
      <div className="flex">
        <span>{fprint(compState.out, format)}</span>
      </div>
    </CpuComponent>
  );
};
