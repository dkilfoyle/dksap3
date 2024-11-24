import _ from "lodash";
import { getBit, getBits, isOn, setBits } from "./Bits";
import { IClocked } from "./Clock";
import { REGEXT, REGSEL } from "./Registers";
import { Computer } from "./Computer";

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

export class Controller implements IClocked {
  ctrl_word = 0;
  stage = 0;
  stage_rst = 0;
  stage_max = 2;

  setControl(bits: number | number[], value = 1) {
    this.ctrl_word = setBits(this.ctrl_word, bits, value);
  }

  getControl(bits: number | number[]) {
    return getBits(this.ctrl_word, bits);
  }
  reset() {
    this.ctrl_word = 0;
    this.stage = 0;
    this.stage_rst = 0;
    this.stage_max = 2;
  }
  posedge(__: Computer) {}
  negedge(__: Computer) {
    this.stage = this.stage_rst == 1 ? 0 : this.stage + 1;
  }

  always({ alu, ir }: Computer) {
    this.ctrl_word = 0;
    this.stage_rst = 0;
    const ir8 = ir.out.toString(8).padStart(3, "0");

    // fetch TState 0
    if (this.stage == 0) {
      this.setControls("mar=reg", REGSEL.PC);
    } else if (this.stage == 1) {
      // output ram[mar=PC] to bus and read bus into ir
      this.setControl(CTRL.MEM_OE);
      this.setControl(CTRL.IR_WE);
    } else if (this.stage == 2) {
      this.setControls("pc++");
    } else {
      // stage 3+
      switch (true) {
        case ir8.match(/1[0-7]+6/) != null:
          this.MOV_Rd_M(ir.out);
          break;
        case ir8.match(/16[0-7]+/) != null:
          this.MOV_M_Rs(ir.out);
          break;
        case ir8.match(/1[0-7]+[0-7]+/) != null:
          this.MOV_Rd_Rs(ir.out);
          break;
        case ir8 == "066":
          this.MVI_M_d8();
          break;
        case ir8.match(/0[0-7]+6/) != null:
          this.MVI_Rd_d8(ir.out);
          break;
        case ir8 == "064":
          this.INRDCR_M(ir.out);
          break;
        case ir8.match(/0[0-7]+4/) != null && ir8.match(/0[0-7]+5/) != null:
          this.INRDCR_Rs(ir.out);
          break;
        case ir8 == "001":
        case ir8 == "021":
        case ir8 == "041":
        case ir8 == "061":
          this.LXI_Rd_d16(ir.out);
          break;
        case ir8.match(/2[0-7]+6/) != null:
          this.ALU_M(ir.out);
          break;
        case ir8.match(/2[0-7]+[0-7]+/) != null:
          this.ALU_Rs(ir.out);
          break;
        case ir8.match(/0[0-7]+7/) != null:
          this.ALU2(ir.out);
          break;
        case ir8.match(/3[0-7]+6/) != null:
          this.ALU_d8(ir.out);
          break;
        case ir8.match(/3[0-7]+2/) != null:
          this.JMP(ir.out, alu.flags);
          break;
        case ir8 == "303":
          this.JMP(ir.out);
          break;
        case ir8.match(/3[0-7]+4/) != null:
          this.CALL(ir.out, alu.flags);
          break;
        case ir8 == "315":
          this.CALL(ir.out);
          break;
        case ir8.match(/3[0-7]+0/) != null:
          this.RET(ir.out, alu.flags);
          break;
        case ir8 == "311":
          this.RET(ir.out);
          break;
        case ir8 == "323":
          this.OUT();
          break;
        case ir8 == "062":
        case ir8 == "072":
          this.STALDA_a16(ir.out);
          break;
        default:
          console.error(`opcode 0o${ir8} / 0x${ir.out.toString(16)} not implemented`);
      }
    }
  }

  INRDCR_M(irout: number) {
    this.stage_max = 6;
    const op = getBit(irout, 0);
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.HL);
        break;
      case 4:
        this.setControl(CTRL.MEM_OE);
        this.setControl(CTRL.ALU_A_STORE);
        this.setControl(CTRL.ALU_A_WE);
        break;
      case 5:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b1000 | op);
        break;
      case 6:
        this.setControl(CTRL.ALU_OE);
        this.setControl(CTRL.ALU_A_RESTORE);
        this.setControl(CTRL.MEM_WE);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  INRDCR_Rs(irout: number) {
    this.stage_max = 5;
    const op = getBit(irout, 0);
    const Rs = getBits(irout, [5, 3]);
    switch (this.stage) {
      case 3:
        if (Rs == 0b111) {
          this.setControl(CTRL.ALU_CS);
          this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b10000);
          this.stage_rst = 1;
        } else {
          this.setControls("bus=reg", Rs);
          this.setControl(CTRL.ALU_A_STORE);
          this.setControl(CTRL.ALU_A_WE);
        }
        break;
      case 4:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b1000 | op);
        break;
      case 5:
        this.setControl(CTRL.ALU_OE);
        this.setControl(CTRL.ALU_A_RESTORE);
        this.setControls("reg=bus", Rs);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  INXDCX(irout: number) {
    this.stage_max = 3;
    const op = getBit(irout, 0);
    const Rs = getBits(irout, [5, 4]);
    if (this.stage == 3) {
      if (Rs == 0b11) {
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], REGSEL.SP);
      } else {
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], 0b10000 | (op << 1));
      }
      this.setControl([CTRL.REG_EXT1, CTRL.REG_EXT1], op == 1 ? 0b10 : 0b01);
      this.stage_rst = 1;
    } else throw Error();
  }

  ALU_M(irout: number) {
    this.stage_max = 5;
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.HL);
        break;
      case 4:
        this.setControl(CTRL.MEM_OE);
        this.setControl(CTRL.ALU_TMP_WE);
        break;
      case 5:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], getBits(irout, [5, 3]));
        this.stage_rst = 1;
    }
  }

  ALU_Rs(irout: number) {
    this.stage_max = 4;
    const Rs = getBits(irout, [2, 0]);
    const op = getBits(irout, [5, 3]);
    switch (this.stage) {
      case 3:
        if (op == 0b111) {
          this.setControl(CTRL.ALU_CS);
          this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], op);
          this.stage_rst = 1;
        } else {
          this.setControls("bus=reg", Rs);
        }
        this.setControl(CTRL.ALU_TMP_WE);
        break;
      case 4:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], op);
        this.stage_rst = 1;
        break;
    }
  }

  ALU_d8(irout: number) {
    this.stage_max = 5;
    const op = getBits(irout, [5, 3]);
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        this.setControl(CTRL.MEM_OE);
        this.setControl(CTRL.ALU_TMP_WE);
        break;
      case 5:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], op);
        this.setControls("pc++");
        this.stage_rst = 1;
    }
  }

  ALU2(irout: number) {
    this.stage_max = 3;
    if (this.stage == 3) {
      this.setControl(CTRL.ALU_CS);
      this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b01000 | getBits(irout, [5, 3]));
      this.stage_rst = 1;
    }
  }

  JMP(irout: number, flags?: number) {
    this.stage_max = 8;
    switch (this.stage) {
      case 3:
        if (!_.isUndefined(flags) && getBit(flags, getBits(irout, [5, 4])) != getBit(irout, 3)) {
          this.setControls("pc+2");
          this.stage_rst = 1;
        } else this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        // z = lo(address)
        this.setControls("reg=mem", REGSEL.Z);
        break;
      case 5:
        this.setControls("pc++");
        break;
      case 6:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 7:
        // w = hi(address)
        this.setControls("reg=mem", REGSEL.W);
        break;
      case 8:
        // PC = WZ
        this.setControls("bus=reg", REGSEL.WZ);
        this.setControls("reg=bus", REGSEL.PC);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  CALL(irout: number, flags?: number) {
    // pass irout if conditional call
    this.stage_max = 15;
    switch (this.stage) {
      case 3:
        if (!_.isUndefined(flags) && getBit(flags, getBits(irout, [5, 4])) != getBit(irout, 3)) {
          this.setControls("pc+2");
          this.stage_rst = 1;
        } else this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        this.setControls("reg=mem", REGSEL.Z); // z = lo(address)
        break;
      case 5:
        this.setControls("pc++");
        break;
      case 6:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 7:
        this.setControls("reg=mem", REGSEL.W); // w = hi(address)
        break;
      case 8:
        this.setControls("pc++");
        break;
      case 9:
        this.setControls("sp--");
        break;
      case 10:
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 11:
        this.setControls("mem=reg", REGSEL.PCC); // save lo(PC) to stack
        break;
      case 12:
        this.setControls("sp--");
        break;
      case 13:
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 14:
        this.setControls("mem=reg", REGSEL.PCP); // save hi(PC) to stack
        break;
      case 15:
        this.setControls("bus=reg", REGSEL.WZ);
        this.setControls("reg=bus", REGSEL.PC); // jump to address stored in WZ
        this.stage_rst = 1;
    }
  }

  RET(irout: number, flags?: number) {
    this.stage_max = 15;
    switch (this.stage) {
      case 3:
        if (!_.isUndefined(flags) && getBit(flags, getBits(irout, [5, 4])) != getBit(irout, 3)) {
          this.stage_rst = 1;
        } else this.setControls("mar=reg", REGSEL.SP);
        break;
      case 4:
        this.setControls("reg=mem", REGSEL.W); // pop hi(ret address) from stack
        break;
      case 5:
        this.setControls("sp++");
        break;
      case 6:
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 7:
        this.setControls("reg=mem", REGSEL.Z); // pop lo(ret address) from stack
        break;
      case 8:
        this.setControls("sp++");
        break;
      case 9:
        this.setControls("bus=reg", REGSEL.WZ);
        this.setControls("reg=bus", REGSEL.PC);
        this.stage_rst = 1;
    }
  }

  OUT() {
    this.stage_max = 3;
    if (this.stage == 3) {
      this.setControls("pc++");
      this.setControl(CTRL.HLT); // out is combination of HLT and REG_EXT0
      this.stage_rst = 1;
    } else throw Error();
  }

  MOV_Rd_M(irout: number) {
    this.stage_max = 4;
    const Rd = getBits(irout, [5, 3]);
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.HL);
        break;
      case 4:
        this.setControl(CTRL.MEM_OE);
        this.setControls("reg3=bus", Rd);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  MOV_M_Rs(irout: number) {
    this.stage_max = 4;
    const Rs = getBits(irout, [2, 0]);
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.HL);
        break;
      case 4:
        this.setControls("bus=reg3", Rs);
        this.setControl(CTRL.MEM_WE);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  MOV_Rd_Rs(irout: number) {
    this.stage_max = 3;
    const Rd = getBits(irout, [5, 3]);
    const Rs = getBits(irout, [2, 0]);
    // Rs = 2:0
    switch (this.stage) {
      case 3:
        this.setControls("bus=reg3", Rs);
        this.setControls("reg3=bus", Rd);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  MVI_Rd_d8(irout: number) {
    this.stage_max = 5;
    const Rd = getBits(irout, [5, 3]);
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        this.setControl(CTRL.MEM_OE);
        this.setControls("reg3=bus", Rd);
        break;
      case 5:
        this.setControls("pc++");
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  MVI_M_d8() {
    // MVI M, d8
    this.stage_max = 7;
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        this.setControls("reg=mem", REGSEL.W);
        break;
      case 5:
        this.setControls("mar=reg", REGSEL.HL);
        break;
      case 6:
        this.setControls("mem=reg", REGSEL.W);
        break;
      case 7:
        this.setControls("pc++");
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  LXI_Rd_d16(irout: number) {
    this.stage_max = 9;
    const Rd = getBits(irout, [5, 4]);
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        this.setControl(CTRL.MEM_OE);
        this.setControls("reg=bus", REGSEL.Z);
        break;
      case 5:
        this.setControls("pc++");
        break;
      case 6:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 7:
        this.setControl(CTRL.MEM_OE);
        this.setControls("reg=bus", REGSEL.W);
        break;
      case 8:
        this.setControls("bus=reg", REGSEL.WZ);
        this.setControls("reg=bus", [REGSEL.BC, REGSEL.DE, REGSEL.HL, REGSEL.SP][Rd]);
        break;
      case 9:
        this.setControls("pc++");
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  STALDA_a16(irout: number) {
    this.stage_max = 10;
    const op3 = getBit(irout, 3); // 1 = LDA, 0 = STA
    switch (this.stage) {
      case 3:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 4:
        this.setControls("reg=mem", REGSEL.Z);
        break;
      case 5:
        this.setControls("pc++");
        break;
      case 6:
        this.setControls("mar=reg", REGSEL.PC);
        break;
      case 7:
        this.setControl(CTRL.MEM_OE);
        this.setControls("reg=bus", REGSEL.W);
        break;
      case 8:
        this.setControls("pc++");
        break;
      case 9:
        this.setControls("mar=reg", REGSEL.WZ);
        break;
      case 10:
        if (op3 == 0) this.setControls("mem=alu"); // STA
        else this.setControls("alu=mem"); // LDA
        this.stage_rst = 1;
        break;

      default:
        throw Error();
    }
  }

  setControls(macroName: string, reg?: number) {
    switch (macroName) {
      case "pc++":
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], REGSEL.PC);
        this.setControl([CTRL.REG_EXT1, CTRL.REG_EXT0], REGEXT.INC);
        break;
      case "pc+2":
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], REGSEL.PC);
        this.setControl([CTRL.REG_EXT1, CTRL.REG_EXT0], REGEXT.INC2);
        break;
      case "sp++":
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], REGSEL.SP);
        this.setControl([CTRL.REG_EXT1, CTRL.REG_EXT0], REGEXT.INC);
        break;
      case "sp--":
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], REGSEL.SP);
        this.setControl([CTRL.REG_EXT1, CTRL.REG_EXT0], REGEXT.DEC);
        break;
      case "mar=reg":
        this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], reg);
        this.setControl(CTRL.REG_OE);
        this.setControl(CTRL.MEM_MAR_WE);
        break;
      case "reg=mem":
        this.setControl(CTRL.MEM_OE);
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], reg);
        this.setControl(CTRL.REG_WE);
        break;
      case "mem=reg":
        this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], reg);
        this.setControl(CTRL.REG_OE);
        this.setControl(CTRL.MEM_WE);
        break;
      case "reg3=bus":
        if (reg == 0b111) {
          this.setControl(CTRL.ALU_A_WE);
        } else {
          this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], reg);
          this.setControl(CTRL.REG_WE);
        }
        break;
      case "bus=reg3":
        if (reg == 0b111) {
          this.setControl(CTRL.ALU_OE);
        } else {
          this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], reg);
          this.setControl(CTRL.REG_OE);
        }
        break;
      case "reg=bus":
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], reg);
        this.setControl(CTRL.REG_WE);
        break;
      case "bus=reg":
        this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], reg);
        this.setControl(CTRL.REG_OE);
        break;
      case "mem=alu":
        this.setControl(CTRL.ALU_OE);
        this.setControl(CTRL.MEM_WE);
        break;
      case "alu=mem":
        this.setControl(CTRL.ALU_A_WE);
        this.setControl(CTRL.MEM_OE);
        break;
    }
  }

  get hlt() {
    return isOn(this.ctrl_word, CTRL.HLT);
  }
  get alu_cs() {
    return isOn(this.ctrl_word, CTRL.ALU_CS);
  }
  get alu_flags_we() {
    return isOn(this.ctrl_word, CTRL.ALU_FLAGS_WE);
  }
  get alu_a_we() {
    return isOn(this.ctrl_word, CTRL.ALU_A_WE);
  }
  get alu_a_store() {
    return isOn(this.ctrl_word, CTRL.ALU_A_STORE);
  }
  get alu_a_restore() {
    return isOn(this.ctrl_word, CTRL.ALU_A_RESTORE);
  }
  get alu_tmp_we() {
    return isOn(this.ctrl_word, CTRL.ALU_TMP_WE);
  }
  get alu_op() {
    return this.getControl([CTRL.ALU_OP4, CTRL.ALU_OP0]);
  }
  get alu_oe() {
    return isOn(this.ctrl_word, CTRL.ALU_OE);
  }
  get alu_flags_oe() {
    return isOn(this.ctrl_word, CTRL.ALU_FLAGS_OE);
  }
  get reg_rd_sel() {
    return this.getControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0]);
  }
  get reg_wr_sel() {
    return this.getControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0]);
  }
  get reg_ext() {
    return this.getControl([CTRL.REG_EXT1, CTRL.REG_EXT0]);
  }
  get reg_oe() {
    return isOn(this.ctrl_word, CTRL.REG_OE);
  }
  get reg_we() {
    return isOn(this.ctrl_word, CTRL.REG_WE);
  }
  get mem_we() {
    return isOn(this.ctrl_word, CTRL.MEM_WE);
  }
  get mem_mar_we() {
    return isOn(this.ctrl_word, CTRL.MEM_MAR_WE);
  }
  get mem_oe() {
    return isOn(this.ctrl_word, CTRL.MEM_OE);
  }
  get ir_we() {
    return isOn(this.ctrl_word, CTRL.IR_WE);
  }
}
