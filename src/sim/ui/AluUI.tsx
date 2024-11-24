import { Button } from "primereact/button";
import { useState } from "react";
import { getBits, isOn } from "../emulator/Bits";
import { ComputerState } from "../emulator/Computer";
import { clsx } from "clsx";
import { CTRL } from "../emulator/Controller";
import { anim, getBusColor, fprint } from "./utils";

const opnames = [
  "ADD",
  "ADC",
  "SUB",
  "SBB",
  "ANA",
  "XRA",
  "ORA",
  "CMP",
  "RLC",
  "RRC",
  "RAL",
  "RAR",
  "DAA", // unsupported
  "CMA",
  "STC",
  "CMC",
  "INR",
  "DCR",
];

export const AluUI = ({ compState }: { compState: ComputerState }) => {
  const [format, setFormat] = useState<16 | 10>(16);
  return (
    <div className="flex flex-column bg-purple-100 p-2 gap-2">
      <Button label="ALU" onClick={() => setFormat(format == 16 ? 10 : 16)} size="small" severity="secondary" className="ui-button"></Button>
      <div className="flex flex-row gap-2">
        <div className="flex flex-column">
          <span>ACC</span>
          <span>TMP</span>
          <span>Carry</span>
          <span>Flags</span>
          <span>ACT</span>
        </div>
        <div className="flex flex-column text-center w-3rem">
          <span
            className={clsx(anim, {
              [`bg-${getBusColor(compState)}-300`]: isOn(compState.ctrl_word, CTRL.ALU_A_WE) && compState.clkState == "tick",
              outline: isOn(compState.ctrl_word, CTRL.ALU_A_WE) && compState.clkState == "tock",
              "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_OE),
            })}>
            {fprint(compState.alu_acc, format)}
          </span>
          <span
            className={clsx(anim, {
              [`bg-${getBusColor(compState)}-300`]: isOn(compState.ctrl_word, CTRL.ALU_TMP_WE) && compState.clkState == "tick",
              outline: isOn(compState.ctrl_word, CTRL.ALU_TMP_WE) && compState.clkState == "tock",
            })}>
            {fprint(compState.alu_tmp, format)}
          </span>
          <span>{fprint(compState.alu_carry, format)}</span>
          <span
            className={clsx(anim, {
              [`bg-${getBusColor(compState)}-300`]: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_WE) && compState.clkState == "tick",
              outline: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_WE) && compState.clkState == "tock",
              "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_FLAGS_OE),
            })}>
            {fprint(compState.alu_flg, format)}
          </span>
          <span
            className={clsx(anim, {
              ["bg-purple-300"]:
                isOn(compState.ctrl_word, CTRL.ALU_CS) && getBits(compState.ir, [5, 3]) == 0b111 && compState.clkState == "tick",
              outline: isOn(compState.ctrl_word, CTRL.ALU_CS) && getBits(compState.ir, [5, 3]) == 0b111 && compState.clkState == "tock",
            })}>
            {fprint(compState.alu_act, format)}
          </span>
        </div>
        <div className="flex flex-column text-right w-2rem">
          <span>OP</span>
        </div>
        <div className="flex flex-column text-right w-5rem">
          <span className={clsx({ "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_CS) }, "pr-2")}>
            {opnames[getBits(compState.ctrl_word, [CTRL.ALU_OP4, CTRL.ALU_OP0])]}
          </span>
          <span className={clsx(anim, { "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_FLAGS_WE) }, "pr-2")}>FLG_WE</span>
          <span className={clsx(anim, { "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_A_WE) }, "pr-2")}>A_WE</span>
          <span className={clsx(anim, { "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_TMP_WE) }, "pr-2")}>TMP_WE</span>
          <span className={clsx(anim, { "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_OE) }, "pr-2")}>OE</span>
          <span className={clsx(anim, { "bg-purple-300": isOn(compState.ctrl_word, CTRL.ALU_FLAGS_OE) }, "pr-2")}>FLG_OE</span>
        </div>
      </div>
    </div>
  );
};
