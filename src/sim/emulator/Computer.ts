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
  out: number;
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

  constructor(program: number[]) {
    this.mem.load(program);
    this.ctrl.always(this); // decode ir => controls
    this.saveState();
  }

  run(max = 2000) {
    let i = 0;
    while (i < max && !(this.ctrl.getControl(CTRL.HLT) && !this.ctrl.getControl(CTRL.REG_EXT0))) {
      this.halftick();
      i++;
    }
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
      return;
    }
    if (this.clk.isTick) {
      // positive edge of tick
      if (this.ctrl.hlt && this.ctrl.reg_ext == 1) {
        this.out = this.alu.out;
        console.log(`Out @ clk ${this.clk.count} = ${this.out} / ${this.out.toString(2)}`);
      }
      this.ctrl.posedge(this);
      this.ir.posedge(this);
      this.regs.posedge(this);
      this.bus.posedge(this);
      this.mem.posedge(this);
      this.alu.posedge(this);
    } else {
      // negative edge of tock
      this.ctrl.negedge(this);
      this.ir.negedge(this);
      this.regs.negedge(this);
      this.bus.negedge(this);
      this.mem.negedge(this);
      this.alu.negedge(this);
    }

    // which component is writing to the bus
    // - do this first so that the other components reading the bus get the uptodate value
    this.ctrl.always(this);
    if (this.ctrl.reg_oe) {
      this.regs.always(this);
      this.bus.always(this);
      this.regs.always(this);
      this.mem.always(this);
      this.alu.always(this);
    } else if (this.ctrl.alu_oe || this.ctrl.alu_flags_oe) {
      this.alu.always(this);
      this.bus.always(this);
      this.regs.always(this);
      this.mem.always(this);
    } else if (this.ctrl.mem_oe) {
      this.mem.always(this);
      this.bus.always(this);
      this.alu.always(this);
      this.regs.always(this);
    } else {
      // nothing written to bus so order doesnt matter
      this.mem.always(this);
      this.bus.always(this);
      this.alu.always(this);
      this.regs.always(this);
    }
    this.ir.always(this);

    this.saveState();
    this.clk.halftick(this.ctrl);
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
      out: this.out,
    });
  }
}
