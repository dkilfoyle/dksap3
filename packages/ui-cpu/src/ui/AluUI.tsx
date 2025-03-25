import { useMemo, useState } from "react";
import { getBits, isOn } from "../emulator/Bits";
import { fprint } from "./utils";
import { ComputerState } from "@dksap3/cpusim";
import { CTRL } from "../emulator/Controller";

import "./ui.css";
import { CpuComponent, CpuSignal, CpuValue } from "../components/CpuComponent";

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

  const ctrl = useMemo(
    () => ({
      a_we: isOn(compState.ctrl_word, CTRL.ALU_A_WE) == 1,
      tmp_we: isOn(compState.ctrl_word, CTRL.ALU_TMP_WE) == 1,
      flg_we: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_WE) == 1,
      oe: isOn(compState.ctrl_word, CTRL.ALU_OE) == 1,
      flg_oe: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_OE) == 1,
      cs: isOn(compState.ctrl_word, CTRL.ALU_CS) == 1,
      clk: compState.clkState,
    }),
    [compState.clkState, compState.ctrl_word]
  );

  const valueStatus = useMemo(() => {
    return {
      acc: ctrl.a_we ? (ctrl.clk == "tick" ? "active" : "ready") : ctrl.oe ? "active" : "inactive",
      tmp: ctrl.tmp_we ? (ctrl.clk == "tick" ? "active" : "ready") : "inactive",
      carry: "inactive",
      flg: ctrl.flg_we ? (ctrl.clk == "tick" ? "active" : "ready") : ctrl.flg_oe ? "active" : "inactive",
      act: ctrl.cs && getBits(compState.ir, [5, 3]) == 0b111 ? (ctrl.clk == "tick" ? "active" : "ready") : "inactive",
    };
  }, [compState.ir, ctrl.a_we, ctrl.clk, ctrl.cs, ctrl.flg_oe, ctrl.flg_we, ctrl.oe, ctrl.tmp_we]);

  const componentStatus = useMemo(() => {
    if (ctrl.a_we || ctrl.flg_we || ctrl.tmp_we) return "input";
    if (ctrl.oe || ctrl.flg_oe) return "output";
    return "none";
  }, [ctrl.a_we, ctrl.flg_oe, ctrl.flg_we, ctrl.oe, ctrl.tmp_we]);

  const direction = useMemo(() => {
    if (componentStatus == "input") return "down";
    if (componentStatus == "output") return "left";
    return "none";
  }, [componentStatus]);

  return (
    <CpuComponent label="ALU" onFormatToggle={() => setFormat(format == 16 ? 10 : 16)} status={componentStatus} direction={direction}>
      <div className="grid grid-cols-[2rem_auto] grid-flow-row gap-x-4 align-top auto-rows-min">
        <span>ACC</span> <CpuValue value={fprint(compState.alu_acc, format)} status={valueStatus.acc} />
        <span>TMP</span> <CpuValue value={fprint(compState.alu_tmp, format)} status={valueStatus.tmp} />
        <span>ACT</span> <CpuValue value={fprint(compState.alu_act, format)} status={valueStatus.act} />
        <span>Flg</span>
        <CpuValue value={fprint(compState.alu_flg, format)} status={valueStatus.flg} />
        <div className="flex gap-[3px] mt-[6px]">
          <CpuValue value={"S"} px="1" status={compState.alu_flg & 0b1000 ? "active" : "ready"} />
          <CpuValue value={"C"} px="1" status={compState.alu_flg & 0b10 ? "active" : "ready"} />
          <CpuValue value={"Z"} px="1" status={compState.alu_flg & 0b1 ? "active" : "ready"} />
        </div>
        {/* <span>SPCZ</span> <CpuValue value={compState.alu_flg.toString(2).padStart(4, "0")} status={valueStatus.flg} /> */}
      </div>

      <div className="flex flex-col text-right">
        <CpuSignal
          active={isOn(compState.ctrl_word, CTRL.ALU_CS) == 1}
          label={opnames[getBits(compState.ctrl_word, [CTRL.ALU_OP4, CTRL.ALU_OP0])]}
        />
        <CpuSignal active={ctrl.a_we} label="A_WE"></CpuSignal>
        <CpuSignal active={ctrl.tmp_we} label="TMP_WE"></CpuSignal>
        <CpuSignal active={ctrl.flg_we} label="FLG_WE"></CpuSignal>
        <CpuSignal active={ctrl.oe} label="OE"></CpuSignal>
        <CpuSignal active={ctrl.flg_oe} label="FLG_OE"></CpuSignal>
      </div>
    </CpuComponent>
  );
};
