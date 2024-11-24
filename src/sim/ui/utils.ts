import { isOn } from "../emulator/Bits";
import { ComputerState } from "../emulator/Computer";
import { CTRL } from "../emulator/Controller";

export const anim = "transition-colors transition-duration-200";

export const fprint = (x: number, f: number) => {
  switch (f) {
    case 2:
      return x.toString(f).padStart(8, "0");
    case 8:
      return x.toString(f).padStart(3, "0");
    case 10:
      return x.toString(f).padStart(3, "0");
    case 16:
      return x.toString(f).padStart(2, "0").toUpperCase();
    default:
      throw Error("fprint invalid format");
  }
};

export const getNextFormat = (f: number) => {
  switch (f) {
    case 8:
      return 10;
    case 10:
      return 16;
    case 16:
      return 8;
    default:
      throw Error("fprint invalid format");
  }
};

export const getValueBG = (s: ComputerState, oe: number, we: number, col: string) => {
  if (isOn(s.ctrl_word, oe)) return "bg-gray-300";
  if (isOn(s.ctrl_word, we) && s.clkState == "tick") return col;
  return "";
};

export const getBusColor = (s: ComputerState) => {
  if (isOn(s.ctrl_word, CTRL.ALU_OE)) return "purple";
  if (isOn(s.ctrl_word, CTRL.MEM_OE)) return "red";
  if (isOn(s.ctrl_word, CTRL.REG_OE)) return "blue";
  if (isOn(s.ctrl_word, CTRL.ALU_FLAGS_OE)) return "purple";
  return "gray";
};
