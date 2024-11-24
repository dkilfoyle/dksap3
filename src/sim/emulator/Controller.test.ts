import { expect, test } from "vitest";
import { Controller, CTRL } from "./Controller";
import { getBit } from "./Bits";

test("set controls", () => {
  const c = new Controller();
  c.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], 0b11000);
  expect(getBit(c.ctrl_word, CTRL.REG_WR_SEL4)).toBe(1);
  expect(getBit(c.ctrl_word, CTRL.REG_WR_SEL4 - 1)).toBe(1);
  expect(getBit(c.ctrl_word, CTRL.REG_WR_SEL4 - 2)).toBe(0);
  expect(getBit(c.ctrl_word, CTRL.REG_WR_SEL4 - 3)).toBe(0);
  expect(getBit(c.ctrl_word, CTRL.REG_WR_SEL4 - 4)).toBe(0);
  expect(c.reg_wr_sel).toBe(24);
});
