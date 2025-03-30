import { useMemo, useState } from "react";
import { fprint } from "./utils";
import { getBits, isOn } from "../emulator/Bits";
import { ComputerState } from "../../../cpusim";
import { CTRL } from "../emulator/Controller";
import { CpuComponent, CpuSignal, CpuValue } from "../components/CpuComponent";

const regnames: Record<number, string> = {
  0b00000: "B",
  0b00001: "C",
  0b00010: "D",
  0b00011: "E",
  0b00100: "H",
  0b00101: "L",
  0b00110: "W",
  0b00111: "Z",
  0b01000: "hi(PC)",
  0b01001: "lo(PC)",
  0b01010: "hi(SP)",
  0b01011: "lo(SP)",
  0b10000: "BC",
  0b10010: "DE",
  0b10100: "HL",
  0b10110: "WZ",
  0b11000: "PC",
  0b11010: "SP",
};
const extnames = ["NA", "INC", "DEC", "INC2"];

const getValueStatus = (ctrl: { rd: string; wr: string; ext: string; we: number; clk: string; oe: number }, x: string[]) => {
  if (ctrl.we == 1 && x.includes(ctrl.wr)) {
    return ctrl.clk == "tick" ? "active" : "ready";
  }
  if (ctrl.ext != "NA" && x.includes(ctrl.wr)) {
    return ctrl.clk == "tick" ? "active" : "ready";
  }
  if (ctrl.oe == 1 && x.includes(ctrl.rd)) return "active";
  return "inactive";
};

export const RegistersUI = ({ compState }: { compState: ComputerState }) => {
  const [format, setFormat] = useState<16 | 10>(16);

  const ctrl = useMemo(
    () => ({
      rd: regnames[getBits(compState.ctrl_word, [CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0])],
      wr: regnames[getBits(compState.ctrl_word, [CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0])],
      ext: extnames[getBits(compState.ctrl_word, [CTRL.REG_EXT1, CTRL.REG_EXT0])],
      we: isOn(compState.ctrl_word, CTRL.REG_WE),
      oe: isOn(compState.ctrl_word, CTRL.REG_OE),
      clk: compState.clkState,
    }),
    [compState.clkState, compState.ctrl_word]
  );

  const componentStatus = useMemo(() => {
    if (ctrl.oe) return "output";
    if (ctrl.we) return "input";
    return "none";
  }, [ctrl.oe, ctrl.we]);

  const direction = useMemo(() => {
    if (componentStatus == "input") return "down";
    if (componentStatus == "output") return "left";
    return "none";
  }, [componentStatus]);

  return (
    <CpuComponent label="Registers" onFormatToggle={() => setFormat(format == 16 ? 10 : 16)} status={componentStatus} direction={direction}>
      <div className="flex gap-3">
        <div className="grid grid-cols-[1.5rem_2rem_2rem] grid-rows-6 grid-flow-col gap-x-3 gap-y-1 align-top">
          <span>BC</span>
          <span>DE</span>
          <span>HL</span>
          <span>WZ</span>
          <span>PC</span>
          <span>SP</span>
          <CpuValue value={fprint(compState.regs[0], format)} status={getValueStatus(ctrl, ["B", "BC"])} />
          <CpuValue value={fprint(compState.regs[2], format)} status={getValueStatus(ctrl, ["D", "DE"])} />
          <CpuValue value={fprint(compState.regs[4], format)} status={getValueStatus(ctrl, ["H", "HL"])} />
          <CpuValue value={fprint(compState.regs[6], format)} status={getValueStatus(ctrl, ["W", "WZ"])} />
          <CpuValue value={fprint(compState.regs[8], format)} status={getValueStatus(ctrl, ["hi(PC)", "PC"])} />
          <CpuValue value={fprint(compState.regs[10], format)} status={getValueStatus(ctrl, ["hi(SP)", "SP"])} />
          <CpuValue value={fprint(compState.regs[1], format)} status={getValueStatus(ctrl, ["C", "BC"])} />
          <CpuValue value={fprint(compState.regs[3], format)} status={getValueStatus(ctrl, ["E", "DE"])} />
          <CpuValue value={fprint(compState.regs[5], format)} status={getValueStatus(ctrl, ["L", "HL"])} />
          <CpuValue value={fprint(compState.regs[7], format)} status={getValueStatus(ctrl, ["Z", "WZ"])} />
          <CpuValue value={fprint(compState.regs[9], format)} status={getValueStatus(ctrl, ["lo(PC)", "PC"])} />
          <CpuValue value={fprint(compState.regs[11], format)} status={getValueStatus(ctrl, ["lo(SP)", "SP"])} />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col text-right">
          <span>RD</span>
          <span>WR</span>
          <span>EXT</span>
        </div>
        <div className="flex flex-col text-right">
          <CpuSignal label={ctrl.rd} />
          <CpuSignal label={ctrl.wr} />
          <CpuSignal active={ctrl.ext != "NA"} label={ctrl.ext} />
          <CpuSignal active={isOn(compState.ctrl_word, 5) == 1} label="OE" />
          <CpuSignal active={isOn(compState.ctrl_word, 4) == 1} label="WE" />
        </div>
      </div>
    </CpuComponent>
  );
};
