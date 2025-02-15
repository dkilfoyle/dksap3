/* eslint-disable @typescript-eslint/no-unused-vars */
import { Computer } from "./Computer";

export class Memory {
  ram = new Uint8Array(2048); // 2k;
  mar = 0;
  out = 0;

  load(bytes: number[]) {
    for (let i = 0; i < bytes.length; i++) {
      this.ram[i] = bytes[i] & 0xff;
    }
  }

  reset() {
    this.mar = 0;
    this.out = 0;
    this.ram.fill(0);
  }
  posedge({ ctrl, bus }: Computer) {
    console.assert(!(ctrl.mem_mar_we && ctrl.mem_we), "%o", { ctrl, msg: "Memory.always has both mar_we and we" });
    if (ctrl.mem_mar_we) {
      this.mar = bus.value;
      // console.log(`mem.tick write bus => mar = ${bus.value}`);
    }
    if (ctrl.mem_we) {
      this.ram[this.mar] = bus.value;
      // console.log(`mem.tick write bus => ram[${this.mar}] = ${bus.value}`);
    }
  }
  negedge(_: Computer) {}
  always(_: Computer) {
    this.out = this.ram[this.mar];
  }
}
