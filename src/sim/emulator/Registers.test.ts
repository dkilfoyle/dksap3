import { expect, test } from "vitest";
import { Registers, REGSEL } from "./Registers";

test("getters and setters", () => {
  const regs = new Registers();
  regs.b = 0xab;
  regs.c = 0xcd;
  regs.pc = 0x1122;
  expect(regs.b).toBe(0xab);
  expect(regs.c).toBe(0xcd);
  expect(regs.bc).toBe(0xabcd);
  expect(regs.pc).toBe(0x1122);
});

test("read 8 bit and 16 bit", () => {
  const regs = new Registers();
  regs.d = 0xab;
  regs.e = 0xcd;
  expect(regs.read(0b00010)).toBe(0xab);
  expect(regs.read(0b00011)).toBe(0xcd);
  expect(regs.read(0b10010)).toBe(0xabcd);
});

test("ext", () => {
  const regs = new Registers();
  regs.pc = 5;
  regs.ext(0b11000, 0b01);
  expect(regs.pc).toBe(6);
  regs.ext(0b11000, 0b11);
  expect(regs.pc).toBe(8);
  regs.ext(0b11000, 0b10);
  expect(regs.pc).toBe(7);
});

test("write 8bit", () => {
  const regs = new Registers();
  regs.write(REGSEL.B, 123);
  expect(regs.b).toBe(123);
});

test("write 16bit", () => {
  const regs = new Registers();
  regs.write(REGSEL.BC, 0xabcd);
  expect(regs.bc).toBe(0xabcd);
});
