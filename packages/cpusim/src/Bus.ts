import { IClocked } from "./Clock";
import { Computer } from "./Computer";

export class Bus implements IClocked {
  value = 0;

  reset() {
    this.value = 0;
  }
  posedge(__: Computer) {}
  negedge(__: Computer) {}
  always({ ctrl, alu, mem, regs }: Computer) {
    // regardless of tick/tock
    this.value = 0;
    console.assert(ctrl.alu_oe + ctrl.mem_oe + ctrl.reg_oe + ctrl.alu_flags_oe <= 1);
    if (ctrl.alu_oe) {
      this.value = alu.out;
      // console.log(`bus.* alu.out => bus = ${this.value}`);
    } else if (ctrl.mem_oe) {
      this.value = mem.out;
      // console.log(`bus.* mem.out => bus = ${this.value}`);
    } else if (ctrl.reg_oe) {
      this.value = regs.out;
      // console.log(`bus.* regs.out => bus = ${this.value}`);
    } else if (ctrl.alu_flags_oe) {
      this.value = alu.flags;
      // console.log(`bus.* alu.flags => bus = ${this.value}`);
    }
    if (this.value == undefined) debugger;
  }
}
