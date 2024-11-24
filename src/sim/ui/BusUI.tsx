import { Button } from "primereact/button";
import { useMemo, useState } from "react";
import { ComputerState } from "../emulator/Computer";
import { isOn } from "../emulator/Bits";
import clsx from "clsx";
import { CTRL } from "../emulator/Controller";
import { getBusColor, anim, fprint } from "./utils";

export const BusUI = ({ compState }: { compState: ComputerState }) => {
  const [format, setFormat] = useState<16 | 10>(16);

  const bg = useMemo(() => {
    return `bg-${getBusColor(compState)}`;
  }, [compState]);

  const ctrl = useMemo(
    () => ({
      alu_oe: isOn(compState.ctrl_word, CTRL.ALU_OE),
      reg_oe: isOn(compState.ctrl_word, CTRL.REG_OE),
      mem_oe: isOn(compState.ctrl_word, CTRL.MEM_OE),
      flags_oe: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_OE),
    }),
    [compState.ctrl_word]
  );

  return (
    <div className={"flex flex-column p-2 gap-2 " + bg + "-100"}>
      <Button label="Bus" onClick={() => setFormat(format == 16 ? 10 : 16)} size="small" severity="secondary" className="ui-button"></Button>
      <div className="flex flex-row gap-5">
        <div className="flex flex-column">
          <span>BUS</span>
        </div>
        <div className="flex flex-column text-center w-2rem">
          <span
            className={clsx(anim, {
              [bg + "-300"]: getBusColor(compState) != "gray",
              outline: (ctrl.alu_oe || ctrl.flags_oe || ctrl.mem_oe || ctrl.reg_oe) && compState.clkState == "tock",
            })}>
            {fprint(compState.bus, format)}
          </span>
        </div>
        <div className="flex flex-column text-right w-5rem">
          <span className={clsx({ [bg + "-200"]: ctrl.alu_oe }, "pr-2", anim)}>ALU_OE</span>
          <span className={clsx({ [bg + "-200"]: ctrl.reg_oe }, "pr-2", anim)}>REG_OE</span>
          <span className={clsx({ [bg + "-200"]: ctrl.mem_oe }, "pr-2", anim)}>MEM_OE</span>
          <span className={clsx({ [bg + "-200"]: ctrl.flags_oe }, "pr-2", anim)}>FLG_OE</span>
        </div>
      </div>
    </div>
  );
};
