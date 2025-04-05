export const fprint = (x: number, f: number, prefix = false) => {
  if (x == undefined) return "??";
  switch (f) {
    case 2:
      return (prefix ? "0b" : "") + x.toString(f).padStart(8, "0");
    case 8:
      return (prefix ? "0o" : "") + x.toString(f).padStart(3, "0");
    case 10:
      return x.toString(f).padStart(3, "0");
    case 16:
      return (prefix ? "0x" : "") + x.toString(f).padStart(2, "0").toUpperCase();
    default:
      throw Error("fprint invalid format");
  }
};

export const fprint16 = (x: number, f: number, prefix = false) => {
  if (x == undefined) return "??";
  switch (f) {
    case 10:
      return x.toString(f);
    case 16:
      return (prefix ? "0x" : "") + x.toString(f).padStart(4, "0").toUpperCase();
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

export const getRegister = (regs: number[], reg: "de" | "hl" | "sp") => {
  switch (reg) {
    case "de":
      return ((regs[2] << 8) | regs[3]) & 0xffff;
    case "hl":
      return ((regs[4] << 8) | regs[5]) & 0xffff;
    case "sp":
      return ((regs[10] << 8) | regs[11]) & 0xffff;
  }
};

export const regnames: Record<number, string> = {
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
