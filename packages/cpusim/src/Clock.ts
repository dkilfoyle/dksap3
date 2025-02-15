import { Computer } from "./Computer";

export interface IClocked {
  posedge: (computer: Computer) => void;
  negedge: (computer: Computer) => void;
  always: (computer: Computer) => void;
  reset: () => void;
}

export class Clock {
  // tock is .0
  // tick is .5
  public count = 0; // start on tock to set stage=0
  reset() {
    this.count = 0;
  }
  halftick() {
    this.count += 0.5;
    // console.log(`clk.* ${this.count} ${this.isTick ? "tick" : ""} ${this.isTock ? "tock" : ""}`);
  }
  get isTock() {
    return this.count % 1 == 0;
  }
  get isTick() {
    return this.count % 1 == 0.5;
  }
}
