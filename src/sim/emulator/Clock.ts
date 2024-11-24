import { Computer } from "./Computer";
import { Controller } from "./Controller";

export interface IClocked {
  posedge: (computer: Computer) => void;
  negedge: (computer: Computer) => void;
  always: (computer: Computer) => void;
  reset: () => void;
}

export class Clock {
  // tick is .0
  // tock is .5
  public count = 0;
  reset() {
    this.count = 0;
  }
  halftick(ctrl: Controller) {
    if (!(ctrl.hlt && !ctrl.reg_ext)) this.count += 0.5;
    // console.log(`clk.* ${this.count} ${this.isTick ? "tick" : ""} ${this.isTock ? "tock" : ""}`);
  }
  get isTick() {
    return this.count % 1 == 0;
  }
  get isTock() {
    return this.count % 1 == 0.5;
  }
}
