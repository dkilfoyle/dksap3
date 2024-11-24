import { Button } from "primereact/button";
import { ComputerState } from "../emulator/Computer";
import { PropsWithChildren } from "react";

interface ClockProps {
  compState: ComputerState;
}

export const ClockUI = ({ compState, children }: PropsWithChildren<ClockProps>) => {
  return (
    <div className="flex flex-column p-2 gap-2 bg-yellow-100">
      <Button label="Clock" size="small" severity="secondary" className="ui-button"></Button>
      <div className="flex flex-row gap-5">
        <div className="flex flex-column text-left">
          <span>Cycle</span>
          <span>CLK</span>
        </div>
        <div className="flex flex-column text-right w-2rem">
          <span>{compState.clkCount}</span>
          <span>{compState.clkState}</span>
        </div>
      </div>
      {children}
    </div>
  );
};
