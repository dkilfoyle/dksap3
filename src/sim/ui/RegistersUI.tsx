import { useMemo, useState } from "react";
import { anim, fprint, getBusColor } from "./utils";
import { Button } from "primereact/button";
import { getBits, isOn } from "../emulator/Bits";
import { ComputerState } from "../emulator/Computer";
import clsx from "clsx";
import { CTRL } from "../emulator/Controller";

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

const getClass = (ctrl: { rd: string; wr: string; ext: string; we: number; clk: string; oe: number }, s: ComputerState, x: string[]) => {
  if (ctrl.we == 1 && x.includes(ctrl.wr)) {
    return ctrl.clk == "tick" ? `bg-${getBusColor(s)}-300` : "outline";
  }
  if (ctrl.ext != "NA" && x.includes(ctrl.wr)) {
    return ctrl.clk == "tick" ? `bg-blue-300` : "outline";
  }
  if (ctrl.oe == 1 && x.includes(ctrl.rd)) return "bg-blue-300";
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

  return (
    <div className="flex flex-column bg-blue-100 p-2 gap-2">
      <Button
        label="Registers"
        onClick={() => setFormat(format == 16 ? 10 : 16)}
        size="small"
        severity="secondary"
        className="ui-button"></Button>
      <div className="flex flex-row gap-2">
        <div className="flex flex-column w-2rem text-left">
          <span>BC</span>
          <span>DE</span>
          <span>HL</span>
          <span>WZ</span>
          <span>PC</span>
          <span>SP</span>
        </div>
        <div className="flex flex-column text-center w-2rem">
          <span className={anim + " " + getClass(ctrl, compState, ["B", "BC"])}>{fprint(compState.regs[0], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["D", "DE"])}>{fprint(compState.regs[2], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["H", "HL"])}>{fprint(compState.regs[4], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["W", "WZ"])}>{fprint(compState.regs[6], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["hi(PC)", "PC"])}>{fprint(compState.regs[8], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["hi(SP)", "SP"])}>{fprint(compState.regs[10], format)}</span>
        </div>
        <div className="flex flex-column text-center w-2rem">
          <span className={anim + " " + getClass(ctrl, compState, ["C", "BC"])}>{fprint(compState.regs[1], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["E", "DE"])}>{fprint(compState.regs[3], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["L", "HL"])}>{fprint(compState.regs[5], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["Z", "WZ"])}>{fprint(compState.regs[7], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["lo(PC)", "PC"])}>{fprint(compState.regs[9], format)}</span>
          <span className={anim + " " + getClass(ctrl, compState, ["lo(SP)", "SP"])}>{fprint(compState.regs[11], format)}</span>
        </div>
        <div className="flex flex-column text-right w-3rem">
          <span>RD</span>
          <span>WR</span>
          <span>EXT</span>
        </div>
        <div className="flex flex-column text-right w-3rem">
          <span className={"pr-2 " + anim}>{ctrl.rd}</span>
          <span className={"pr-2 " + anim}>{ctrl.wr}</span>
          <span className={clsx(anim, { "bg-blue-300": ctrl.ext != "NA" }, "pr-2")}>{ctrl.ext}</span>
          <span className={clsx(anim, { "bg-blue-300": isOn(compState.ctrl_word, 5) }, "pr-2")}>OE</span>
          <span className={clsx(anim, { "bg-blue-300": isOn(compState.ctrl_word, 4) }, "pr-2")}>WE</span>
        </div>
      </div>
    </div>
  );
};
