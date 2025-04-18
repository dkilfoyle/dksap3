export enum CTRL {
  HLT = 31,
  ALU_CS = 30,
  ALU_FLAGS_WE = 29,
  ALU_A_WE = 28,
  ALU_A_STORE = 27,
  ALU_A_RESTORE = 26,
  ALU_TMP_WE = 25,
  ALU_OP4 = 24,
  ALU_OP0 = 20,
  ALU_OE = 19,
  ALU_FLAGS_OE = 18,
  REG_RD_SEL4 = 17,
  REG_RD_SEL0 = 13,
  REG_WR_SEL4 = 12,
  REG_WR_SEL0 = 8,
  REG_EXT1 = 7,
  REG_EXT0 = 6,
  REG_OE = 5,
  REG_WE = 4,
  MEM_WE = 3,
  MEM_MAR_WE = 2,
  MEM_OE = 1,
  IR_WE = 0,
}
