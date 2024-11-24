import { Button } from "primereact/button";
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
    <div className="flex flex-column p-2 gap-2 bg-yellow-100">
      <Button
        label="Display"
        onClick={() => setFormat((cur) => getNextFormat(cur))}
        size="small"
        severity="secondary"
        className="ui-button"></Button>
      <div className="flex flex-row gap-5">
        <div className="flex flex-column">
          <span>{fprint(compState.out, format)}</span>
        </div>
      </div>
    </div>
  );
};
