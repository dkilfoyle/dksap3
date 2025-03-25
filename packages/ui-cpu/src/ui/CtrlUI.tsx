import _ from "lodash";
import { getBit } from "../emulator/Bits";
import { ComputerState } from "../../../cpusim";
import clsx from "clsx";

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
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 border-zinc-500 mt-3">
      <div className="flex gap-2">
        <span className="w-3rem text-right mr-1">ALU</span>
        {_.range(31, 17, -1).map((i) => (
          <div
            className={clsx(
              "flex flex-col w-[25px] rounded-sm border text-center p-1",
              getBit(compState.ctrl_word, i) ? "bg-[#fafafa] text-black" : "border-gray-700"
            )}
            key={`alu-${i}`}>
            <span className="text-gray-400">{i}</span>
            <span className="text-xxs">{names[i]}</span>
            {/* <span className={clsx("bg-purple-100", { "bg-purple-400": getBit(compState.ctrl_word, i) }, anim)}>
              {getBit(compState.ctrl_word, i)}
            </span> */}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <span className="w-3rem text-right mr-1 text-white">REG</span>
        {_.range(17, 3, -1).map((i) => (
          <div
            className={clsx(
              "flex flex-col w-[25px] rounded-sm border text-center p-1 transition-colors",
              getBit(compState.ctrl_word, i) ? "bg-[#fafafa] text-black" : "border-gray-700"
            )}
            key={`alu-${i}`}>
            <span className="text-gray-400">{i}</span>
            <span className="text-xxs">{names[i]}</span>
            {/* <span className={clsx("bg-blue-100", { "bg-blue-400": getBit(compState.ctrl_word, i) }, anim)}>
              {getBit(compState.ctrl_word, i)}
            </span> */}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <span className="w-3rem text-right mr-1 text-white">MEM</span>
        {_.range(3, -1, -1).map((i) => (
          <div
            className={clsx(
              "flex flex-col w-[25px] rounded-sm border text-center p-1",
              getBit(compState.ctrl_word, i) ? "bg-[#fafafa] text-black" : "border-gray-700"
            )}
            key={`alu-${i}`}>
            <span className="text-gray-400">{i}</span>
            <span className="text-xxs">{names[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
