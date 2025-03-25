import { Alu } from "./Alu";
import { Bus } from "./Bus";
import { Clock } from "./Clock";
import { Controller, CTRL } from "./Controller";
import { InstructionRegister } from "./InstructionRegister";
import { Memory } from "./Memory";
import { Registers } from "./Registers";

export interface ComputerState {
  clkCount: number;
  clkState: string;
  ctrl_word: number;
  regs: number[];
  ir: number;
  alu_acc: number;
  alu_carry: number;
  alu_act: number;
  alu_tmp: number;
  alu_flg: number;
  bus: number;
  mem: number[];
  mar: number;
  stage: number;
  stage_max: number;
  stage_rst: number;
  out: number;
  stdout: string;
}

export class Computer {
  clk = new Clock();
  ctrl = new Controller();
  regs = new Registers();
  ir = new InstructionRegister();
  alu = new Alu();
  bus = new Bus();
  mem = new Memory();
  rst = 0;
  out = 0;
  states: ComputerState[] = [];
  bdosAddress: number = -1;
  stdout = "";

  constructor(program?: number[]) {
    this.reset(program);
    // if (program) this.mem.load(program);
    // this.ctrl.always(this); // decode ir => controls
    // this.saveState();
  }

  bdos() {
    switch (this.regs.c) {
      case 2:
        // putchar
        this.stdout += String.fromCharCode(this.regs.de);
        break;
      default:
        console.error(`Unimplemented bdos func ${this.regs.c}`);
    }
  }

  reset(program?: number[]) {
    this.clk = new Clock();
    this.ctrl = new Controller();
    this.regs = new Registers();
    this.ir = new InstructionRegister();
    this.alu = new Alu();
    this.bus = new Bus();
    this.mem = new Memory();
    this.rst = 0;
    this.out = 0;
    this.stdout = "";
    this.states = [];
    if (program) this.mem.load(program);
    // this.ctrl.always(this); // decode ir => controls
    this.saveState();
    this.states.at(-1)!.stage_max = 0;
  }

  run(max = 2000) {
    let i = 0;
    while (i < max && !(this.ctrl.getControl(CTRL.HLT) && !this.ctrl.getControl(CTRL.REG_EXT0))) {
      this.halftick();
      i++;
    }
  }

  step() {
    this.states = [];
    this.ctrl.callResult = "unknown";
    this.ctrl.returnResult = "unknown";
    do {
      this.halftick(); // tock
      this.halftick(); // tick
    } while (!this.ctrl.stage_rst);
  }

  halftick() {
    if (this.rst) {
      this.alu.reset();
      this.bus.reset();
      this.regs.reset();
      this.mem.reset();
      this.ctrl.reset();
      this.clk.reset();
      this.ir.reset();
      this.rst = 0;
      return;
    }

    //        Tock          Always                Tick                                    Always
    // ctrl   Stage=0|+1    set ctrl signals                                              No change
    // regs                 out=reg_rd_sel        reg_wr_sl=(bus|ext)                     out=reg_rd_sel (maybe updated)
    // alu    update flgs   out=acc               tmp=bus => acc=(a op tmp)               out=acc (maybe updated)
    // mem                  out=ram[mar]          (ram|mar) = bus if mem_we or mar_we     out=ram[mar] (maybe updated)
    // ir                                         ir=bus if ir_we
    // bus                  bus=reg|alu|mem|flg                                           bus=reg|alu|mem|flg (maybe updated)

    if (this.clk.isTock) {
      // negative edge of clk
      this.ctrl.negedge(this); // stage = 0 or +1
      this.alu.negedge(this); //  update flags

      this.ctrl.always(this); // set control signals for current stage, set stage_rst if last stage
      this.regs.always(this); // out = selected reg
      this.alu.always(this); //  out = acc
      this.mem.always(this); //  out = ram[mar]
      this.bus.always(this); //  bus = alu | mem | reg | flags (do last)
    } else {
      // isTick, positive edge of clk
      this.regs.posedge(this); // bus => reg or reg_ext action
      this.ir.posedge(this); //   bus => ir
      this.mem.posedge(this); //  bus => mar or ram
      this.alu.posedge(this); //  bus => tmp and acc = action
    }

    this.saveState();
    this.clk.halftick();
  }

  saveState() {
    this.states.push({
      alu_acc: this.alu.acc,
      alu_act: this.alu.act,
      alu_carry: this.alu.carry,
      alu_flg: this.alu.flags,
      alu_tmp: this.alu.tmp,
      bus: this.bus.value,
      clkCount: this.clk.count,
      clkState: this.clk.isTick ? "tick" : "tock",
      ctrl_word: this.ctrl.ctrl_word,
      ir: this.ir.out,
      mem: [...this.mem.ram.slice(0, 255).values()],
      mar: this.mem.mar,
      regs: [...this.regs.registers.slice(0).values()],
      stage: this.ctrl.stage,
      stage_max: this.ctrl.stage_max,
      stage_rst: this.ctrl.stage_rst,
      out: this.out,
      stdout: this.stdout,
    });
  }

  // halftickold() {
  //   if (this.rst) {
  //     this.alu.reset();
  //     this.bus.reset();
  //     this.regs.reset();
  //     this.mem.reset();
  //     this.ctrl.reset();
  //     this.clk.reset();
  //     this.ir.reset();
  //     return;
  //   }

  //   if (this.clk.isTick) {
  //     // positive edge of tick
  //     if (this.ctrl.hlt && this.ctrl.reg_ext == 1) {
  //       this.out = this.alu.out;
  //       console.log(`Out @ clk ${this.clk.count} = ${this.out} / ${this.out.toString(2)}`);
  //     }
  //     this.regs.posedge(this); // bus => reg or reg_ext action
  //     this.ir.posedge(this); //   bus => ir
  //     this.mem.posedge(this); //  bus => mar or ram
  //     this.alu.posedge(this); //  bus => tmp and acc = action
  //     this.bus.posedge(this); //  nothing
  //     this.ctrl.posedge(this); // nothing
  //   } else {
  //     // negative edge of tock
  //     this.ctrl.negedge(this); // stage = 0 or +1
  //     this.alu.negedge(this); //  update flags
  //     this.ir.negedge(this); //   nothing
  //     this.regs.negedge(this); // nothing
  //     this.bus.negedge(this); //  nothing
  //     this.mem.negedge(this); //  nothing
  //   }

  //   // always
  //   // ctrl - set control signals for current stage, set stage_rst if last stage
  //   // regs - out = selected reg
  //   // alu  - out = acc
  //   // mem  - out = ram[mar]
  //   // bus  - bus = alu | mem | reg | flags
  //   // ir   - nothing

  //   this.ctrl.always(this);
  //   this.ir.always(this);
  //   this.regs.always(this);
  //   this.alu.always(this);
  //   this.mem.always(this);
  //   this.bus.always(this); // bus last so it can read the updated out

  //   // // which component is writing to the bus
  //   // // - do this first so that the other components reading the bus get the uptodate value
  //   // if (this.ctrl.reg_oe) {
  //   //   this.regs.always(this);
  //   //   this.bus.always(this);
  //   //   this.regs.always(this);
  //   //   this.mem.always(this);
  //   //   this.alu.always(this);
  //   // } else if (this.ctrl.alu_oe || this.ctrl.alu_flags_oe) {
  //   //   this.alu.always(this);
  //   //   this.bus.always(this);
  //   //   this.regs.always(this);
  //   //   this.mem.always(this);
  //   // } else if (this.ctrl.mem_oe) {
  //   //   this.mem.always(this);
  //   //   this.bus.always(this);
  //   //   this.alu.always(this);
  //   //   this.regs.always(this);
  //   // } else {
  //   //   // nothing written to bus so order doesnt matter
  //   //   this.mem.always(this);
  //   //   this.bus.always(this);
  //   //   this.alu.always(this);
  //   //   this.regs.always(this);
  //   // }

  //   // this.ir.always(this);

  //   this.saveState();
  //   this.clk.halftick(this.ctrl);
  // }
}

export const emulator = new Computer();
