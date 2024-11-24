import _ from "lodash";
import { getBit } from "../emulator/Bits";
import { ComputerState } from "../emulator/Computer";
import clsx from "clsx";
import { getTStates } from "../emulator/InstructionRegister";
import { useMemo } from "react";
import { anim } from "./utils";

const names = [
  "HLT",
  "CS",
  "FLG_WE",
  "A_WE",
  "A_STR",
  "A_RSR",
  "TMP_WE",
  "OP4",
  "OP3",
  "OP2",
  "OP1",
  "OP0",
  "OE",
  "FLG_OE",
  "RD_SEL4",
  "RD_SEL3",
  "RD_SEL2",
  "RD_SEL1",
  "RD_SEL0",
  "WR_SEL4",
  "WR_SEL3",
  "WR_SEL2",
  "WR_SEL1",
  "WR_SEL0",
  "EXT1",
  "EXT0",
  "OE",
  "WE",
  "WE",
  "MAR_WE",
  "OE",
  "IR_WE",
].reverse();

export const CtrlUI = ({ compState }: { compState: ComputerState }) => {
  const numStages = useMemo(() => {
    if (compState.stage == 0 || (compState.stage == 1 && compState.clkState == "tock")) return 2;
    return getTStates(compState.ir);
  }, [compState.clkState, compState.ir, compState.stage]);
  return (
    <div className="flex flex-column gap-2 mt-5">
      <div className="flex gap-2">
        <span className="w-2rem text-right">ALU</span>
        {_.range(31, 17, -1).map((i) => (
          <div className="flex flex-column w-3rem bg-purple-100 text-center" key={`alu-${i}`}>
            <span>{i}</span>
            <span className="text-xs">{names[i]}</span>
            <span className={clsx("bg-purple-100", { "bg-purple-300": getBit(compState.ctrl_word, i) }, anim)}>
              {getBit(compState.ctrl_word, i)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <span className="w-2rem text-right">REG</span>
        {_.range(17, 3, -1).map((i) => (
          <div className="flex flex-column w-3rem bg-blue-100 text-center" key={`reg-${i}`}>
            <span>{i}</span>
            <span className="text-xs">{names[i]}</span>
            <span className={clsx("bg-blue-100", { "bg-blue-300": getBit(compState.ctrl_word, i) }, anim)}>
              {getBit(compState.ctrl_word, i)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <span className="w-2rem text-right">MEM</span>
        {_.range(3, -1, -1).map((i) => (
          <div className="flex flex-column w-3rem bg-red-100 text-center" key={`mem-${i}`}>
            <span>{i}</span>
            <span className="text-xs">{names[i]}</span>
            <span className={clsx("bg-red-100", { "bg-red-300": getBit(compState.ctrl_word, i) }, anim)}>{getBit(compState.ctrl_word, i)}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="w-2rem text-right">T</span>
        {_.range(0, numStages + 1).map((i) => (
          <span className={clsx(i == compState.stage ? compState.clkState : "bg-gray-300", "w-2rem text-center")} key={`t-${i}`}>
            {i}
          </span>
        ))}
      </div>
    </div>
  );
};
