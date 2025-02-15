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
}

export const getZeroState = () => {
  const x: ComputerState = {
    clkCount: 0,
    clkState: "tock",
    ctrl_word: 0,
    regs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ir: 0,
    alu_acc: 0,
    alu_carry: 0,
    alu_act: 0,
    alu_tmp: 0,
    alu_flg: 0,
    bus: 0,
    mem: Array<number>(255).fill(0),
    mar: 0,
    stage: 0,
    stage_max: 0,
    stage_rst: 0,
    out: 0,
  };
  return x;
};
