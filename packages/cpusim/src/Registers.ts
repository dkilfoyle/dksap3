/* eslint-disable @typescript-eslint/no-unused-vars */
import { hi, isOn, lo } from "./Bits";
import { IClocked } from "./Clock";
import { Computer } from "./Computer";

enum REG8 {
  B = 0,
  C,
  D,
  E,
  H,
  L,
  W,
  Z,
  PCP,
  PCC,
  SPS,
  SPP,
}

enum REG16 {
  BC = 0,
  DE = 2,
  HL = 4,
  WZ = 6,
  PC = 8,
  SP = 10,
}

export enum REGSEL {
  B = 0,
  C,
  D,
  E,
  H,
  L,
  W,
  Z,
  PCP,
  PCC,
  SPS,
  SPP,
  BC = 0b10000,
  DE = 0b10010,
  HL = 0b10100,
  WZ = 0b10110,
  PC = 0b11000,
  SP = 0b11010,
}

export enum REGEXT {
  INC = 0b01,
  DEC = 0b10,
  INC2 = 0b11,
}

export class Registers implements IClocked {
  registers = new Uint8Array(12);
  stackBase: number | undefined;
  out = 0;
  reset() {
    this.out = 0;
    this.registers.fill(0);
  }

  posedge({ ctrl, bus }: Computer) {
    if (ctrl.reg_ext > 0) {
      this.ext(ctrl.reg_wr_sel, ctrl.reg_ext);
    } else if (ctrl.reg_we) {
      this.write(ctrl.reg_wr_sel, bus.value);
    }
  }
  negedge(_: Computer) {}
  always({ ctrl }: Computer) {
    this.out = this.read(ctrl.reg_rd_sel);
  }

  read(rd_sel: number) {
    const rd_ext = isOn(rd_sel, 4);
    const rd_src = rd_sel & 0b1111;
    return rd_ext ? ((this.registers[rd_src] << 8) | this.registers[rd_src + 1]) & 0xffff : this.registers[rd_src] & 0xffff;
  }

  write(wr_sel: REGSEL, data_in: number) {
    const wr_ext = isOn(wr_sel, 4);
    const wr_dst = wr_sel & 0b1111;
    if (wr_ext) {
      this.registers[wr_dst] = hi(data_in);
      this.registers[wr_dst + 1] = lo(data_in);
      if (wr_dst == REGSEL.SP && this.stackBase == undefined) {
        this.stackBase = data_in;
        // assume that the stackbase is the first value written to SP register
      }
    } else this.registers[wr_dst] = data_in & 0xff;
  }

  ext(wr_sel: REGSEL, ext: REGEXT) {
    if (wr_sel < 0b10000) throw Error(`register.ext invalid wr_sel ${wr_sel}`);
    const extAdd = [0, 1, -1, 2][ext];

    switch (wr_sel) {
      case REGSEL.BC:
        this.bc += extAdd;
        break;
      case REGSEL.DE:
        this.de += extAdd;
        break;
      case REGSEL.HL:
        this.hl += extAdd;
        break;
      case REGSEL.WZ:
        this.wz += extAdd;
        break;
      case REGSEL.PC:
        this.pc += extAdd;
        break;
      case REGSEL.SP:
        this.sp += extAdd;
        break;
    }
  }

  get b() {
    return this.registers[REG8.B];
  }
  set b(x: number) {
    this.registers[REG8.B] = x & 0xff;
  }
  get c() {
    return this.registers[REG8.C];
  }
  set c(x: number) {
    this.registers[REG8.C] = x & 0xff;
  }
  get d() {
    return this.registers[REG8.D];
  }
  set d(x: number) {
    this.registers[REG8.D] = x & 0xff;
  }
  get e() {
    return this.registers[REG8.E];
  }
  set e(x: number) {
    this.registers[REG8.E] = x & 0xff;
  }
  get h() {
    return this.registers[REG8.H];
  }
  set h(x: number) {
    this.registers[REG8.H] = x & 0xff;
  }
  get l() {
    return this.registers[REG8.L];
  }
  set l(x: number) {
    this.registers[REG8.L] = x & 0xff;
  }
  get bc() {
    return ((this.b << 8) | this.c) & 0xffff;
  }
  set bc(x: number) {
    this.registers[REG16.BC] = hi(x);
    this.registers[REG16.BC + 1] = lo(x);
  }
  get de() {
    return ((this.d << 8) | this.e) & 0xffff;
  }
  set de(x: number) {
    this.registers[REG16.DE] = hi(x);
    this.registers[REG16.DE + 1] = lo(x);
  }
  get hl() {
    return ((this.h << 8) | this.l) & 0xffff;
  }
  set hl(x: number) {
    this.registers[REG16.HL] = hi(x);
    this.registers[REG16.HL + 1] = lo(x);
  }
  get wz() {
    return ((this.registers[REG8.W] << 8) | this.registers[REG8.Z]) & 0xffff;
  }
  set wz(x: number) {
    this.registers[REG16.WZ] = hi(x);
    this.registers[REG16.WZ + 1] = lo(x);
  }
  get pc() {
    return ((this.registers[8] << 8) | this.registers[9]) & 0xffff;
  }
  set pc(x: number) {
    this.registers[REG16.PC] = hi(x);
    this.registers[REG16.PC + 1] = lo(x);
  }
  get sp() {
    return ((this.registers[10] << 8) | this.registers[11]) & 0xffff;
  }
  set sp(x: number) {
    this.registers[REG16.SP] = hi(x);
    this.registers[REG16.SP + 1] = lo(x);
  }

  dump() {
    console.table([[this.registers], ["B", "C", "D", "E", "H", "L", "W", "Z", "PCP", "PCC", "SPS", "SPP", "BC", "DE", "HL", "WZ", "PC", "SP"]]);
  }
}
