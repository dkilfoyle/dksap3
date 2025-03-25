import { useMemo, useState } from "react";
import { fprint } from "./utils";
import { ComputerState } from "../../../cpusim";
import { isOn } from "../emulator/Bits";
import { CTRL } from "../emulator/Controller";
import { CpuComponent, CpuSignal, CpuValue } from "../components/CpuComponent";

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

  const valueStatus = useMemo(() => {
    return {
      ram_mar: ctrl.mem_we ? (compState.clkState == "tick" ? "active" : "ready") : ctrl.mem_oe ? "active" : "inactive",
      mar: ctrl.mem_mar_we ? (compState.clkState == "tick" ? "active" : "ready") : "inactive",
    };
  }, [compState.clkState, ctrl.mem_mar_we, ctrl.mem_oe, ctrl.mem_we]);

  const componentStatus = useMemo(() => {
    if (ctrl.mem_mar_we || ctrl.mem_we) return "input";
    if (ctrl.mem_oe) return "output";
    return "none";
  }, [ctrl.mem_mar_we, ctrl.mem_oe, ctrl.mem_we]);

  const direction = useMemo(() => {
    if (componentStatus == "input") return "down";
    if (componentStatus == "output") return "right";
    return "none";
  }, [componentStatus]);

  return (
    <CpuComponent label="Mem" onFormatToggle={() => setFormat(format == 16 ? 10 : 16)} status={componentStatus} direction={direction}>
      <div className="grid grid-cols-[3rem_2rem] grid-flow-row gap-x-4 align-top auto-rows-min">
        <span>@MAR</span> <CpuValue value={fprint(compState.mem[compState.mar], format)} status={valueStatus.ram_mar} />
        <span>MAR</span> <CpuValue value={fprint(compState.mar, format)} status={valueStatus.mar} />
      </div>

      <div className="flex flex-col text-right">
        <CpuSignal active={ctrl.mem_we == 1} label="MEM_WE" />
        <CpuSignal active={ctrl.mem_mar_we == 1} label="MAR_WE" />
        <CpuSignal active={ctrl.mem_oe == 1} label="OE" />
      </div>
    </CpuComponent>
  );
};
