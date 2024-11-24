import { Button } from "primereact/button";
import { useMemo, useState } from "react";
import { anim, fprint, getBusColor } from "./utils";
import { ComputerState } from "../emulator/Computer";
import clsx from "clsx";
import { isOn } from "../emulator/Bits";
import { CTRL } from "../emulator/Controller";

export const MemUI = ({ compState }: { compState: ComputerState }) => {
  const [format, setFormat] = useState<16 | 10>(16);
  const ctrl = useMemo(
    () => ({
      mem_we: isOn(compState.ctrl_word, CTRL.MEM_WE),
      mem_mar_we: isOn(compState.ctrl_word, CTRL.MEM_MAR_WE),
      mem_oe: isOn(compState.ctrl_word, CTRL.MEM_OE),
    }),
    [compState.ctrl_word]
  );
  return (
    <div className="flex flex-column bg-red-100 p-2 gap-2">
      <Button label="Mem" onClick={() => setFormat(format == 16 ? 10 : 16)} size="small" severity="secondary" className="ui-button"></Button>
      <div className="flex flex-row gap-2">
        <div className="flex flex-column text-left w-5rem">
          <span>RAM[MAR]</span>
          <span>MAR</span>
        </div>
        <div className="flex flex-column text-center w-4rem">
          <span
            className={clsx(
              {
                [`bg-${getBusColor(compState)}-300`]: ctrl.mem_we && compState.clkState == "tick",
                "bg-red-300": ctrl.mem_oe,
              },
              anim
            )}>
            {fprint(compState.mem[compState.mar], format)}
          </span>
          <span
            className={clsx(
              {
                [`bg-${getBusColor(compState)}-300`]: ctrl.mem_mar_we && compState.clkState == "tick",
              },
              anim
            )}>
            {fprint(compState.mar, format)}
          </span>
        </div>
        <div className="w-1rem"></div>
        <div className="flex flex-column text-right w-5rem">
          <span className={clsx({ "bg-red-200": ctrl.mem_we }, "pr-2", anim)}>MEM_WE</span>
          <span className={clsx({ "bg-red-200": ctrl.mem_mar_we }, "pr-2", anim)}>MAR_WE</span>
          <span className={clsx({ "bg-red-200": ctrl.mem_oe }, "pr-2", anim)}>OE</span>
        </div>
      </div>
    </div>
  );
};
