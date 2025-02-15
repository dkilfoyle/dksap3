import { getBit, getBits, isOn, setBits } from "./Bits";
import { IClocked } from "./Clock";
import { REGEXT, Registers, REGSEL } from "./Registers";
import { Computer } from "./Computer";
import { Memory } from "./Memory";
import { ALUOP } from "./Alu";

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
  stage_rst = 1;
  stage_max = 2;
  public bdos: (c: number, de: number) => void = () => {};
  skipCall = false;

  setControl(bits: number | number[], value = 1) {
    this.ctrl_word = setBits(this.ctrl_word, bits, value);
  }

  getControl(bits: number | number[]) {
    return getBits(this.ctrl_word, bits);
  }

  reset() {
    this.ctrl_word = 0;
    this.stage = 0;
    this.stage_rst = 1;
    this.stage_max = 2;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  posedge(__: Computer) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  negedge(__: Computer) {
    this.stage = this.stage_rst == 1 ? 0 : this.stage + 1;
  }

  always({ alu, ir, mem, regs }: Computer) {
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
        case ir8 == "166":
          this.HLT();
          break;
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
        case ir8.match(/0[0-7]+4/) != null || ir8.match(/0[0-7]+5/) != null:
          this.INRDCR_Rs(ir.out);
          break;
        case ir8.match(/0[0-7]+3/) != null:
          this.INXDCX(ir.out);
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
        case ir8.match(/2[0-7]+7/) != null:
          this.ALU_A(ir.out);
          break;
        case ir8.match(/2[0-7]+[0-5]+/) != null:
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
          this.CALL(ir.out, mem, regs, alu.flags);
          break;
        case ir8 == "315":
          this.CALL(ir.out, mem, regs);
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
        case ir8 == "353":
          this.XCHG();
          break;
        case ir8 == "343":
          this.XTHL();
          break;
        case ir8 == "351":
          this.PCHL();
          break;
        case ir8 == "062":
        case ir8 == "072":
          this.STALDA_a16(ir.out);
          break;
        case ir8.match(/3[0-7]+5/) != null:
          this.PUSH(ir.out);
          break;
        case ir8 == "301":
        case ir8 == "321":
        case ir8 == "341":
        case ir8 == "361":
          this.POP(ir.out);
          break;
        case ir8 == "011":
        case ir8 == "031":
        case ir8 == "051":
        case ir8 == "071":
          this.DAD(ir.out);
          break;

        case ir8 == "002":
        case ir8 == "012":
        case ir8 == "022":
        case ir8 == "032":
          // 8'o002, 8'o012, 8'o022, 8'o032: begin
          this.STAX_LDAX(ir.out);
          break;

        default:
          console.error(`opcode 0o${ir8} / 0x${ir.out.toString(16)} not implemented`);
          this.setControl(CTRL.HLT);
          this.setControl(CTRL.REG_EXT0, 0);
          this.stage_max = 3;
          this.stage_rst = 1;
      }
    }
  }

  STAX_LDAX(irout: number) {
    this.stage_max = 7;
    const reg = getBits(irout, [5, 4]);
    switch (this.stage) {
      // STAX/LDAX Rs
      // opcode[5:4] - Rs
      // opcode[3]   - STAX (0) / LDAX (1)
      // 8'o002, 8'o012, 8'o022, 8'o032: begin
      case 3:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = {2'b0, opcode[5:4], 1'b0};
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_WZ_W;
        // 		ctrl_word[REG_WE] = 1'b1;
        this.setControls("bus=reg", reg << 1);
        this.setControls("reg=bus", REGSEL.W);
        break;
      case 4:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = {2'b0, opcode[5:4], 1'b1};
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_WZ_Z;
        // 		ctrl_word[REG_WE] = 1'b1;
        this.setControls("bus=reg", (reg << 1) + 1);
        this.setControls("reg=bus", REGSEL.Z);
        break;
      case 5:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_WZ;
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[MEM_MAR_WE] = 1'b1;
        this.setControls("mar=reg", REGSEL.WZ);
        break;
      case 6:
        // why is there no stage 6
        break;
      case 7:
        // 		if (opcode[3] == 1'b0) begin
        // 			ctrl_word[ALU_OE] = 1'b1;
        // 			ctrl_word[MEM_WE] = 1'b1;
        // 		end else begin
        // 			ctrl_word[ALU_A_WE] = 1'b1;
        // 			ctrl_word[MEM_OE] = 1'b1;
        // 		end
        // 		stage_rst = 1'b1;
        if (getBits(irout, 3) == 0) {
          this.setControl(CTRL.ALU_OE);
          this.setControl(CTRL.MEM_WE);
        } else {
          this.setControl(CTRL.ALU_A_WE);
          this.setControl(CTRL.MEM_OE);
        }
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  // PUSH Rs
  // opcode[5:4] - Extended Register
  PUSH(irout: number) {
    this.stage_max = 8;
    switch (this.stage) {
      case 3:
        // ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_SP;
        // ctrl_word[REG_EXT1:REG_EXT0] = REG_DEC;
        this.setControls("sp--");
        break;
      case 4:
        // ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_SP;
        // ctrl_word[REG_OE] = 1'b1;
        // ctrl_word[MEM_MAR_WE] = 1'b1;
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 5:
        // if (opcode[5:4] == 2'b11) begin // PSW
        // 	ctrl_word[ALU_OE] = 1'b1;
        // end else begin
        // 	ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = {2'b0, opcode[5:4], 1'b0};
        // 	ctrl_word[REG_OE] = 1'b1;
        // end
        // ctrl_word[MEM_WE] = 1'b1;
        if (getBits(irout, [5, 4]) == 0b11)
          // PSW
          this.setControl(CTRL.ALU_OE, 1);
        else this.setControls("bus=reg", getBits(irout, [5, 4]) << 1);
        this.setControl(CTRL.MEM_WE);
        break;
      case 6:
        // ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_SP;
        // ctrl_word[REG_EXT1:REG_EXT0] = REG_DEC;
        this.setControls("sp--");
        break;
      case 7:
        // ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_SP;
        // ctrl_word[REG_OE] = 1'b1;
        // ctrl_word[MEM_MAR_WE] = 1'b1;
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 8:
        // if (opcode[5:4] == 2'b11) begin // PSW
        // 	ctrl_word[ALU_FLAGS_OE] = 1'b1;
        // end else begin
        // 	ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = {2'b0, opcode[5:4], 1'b1};
        // 	ctrl_word[REG_OE] = 1'b1;
        // end

        // ctrl_word[MEM_WE] = 1'b1;
        // stage_rst = 1'b1;
        if (getBits(irout, [5, 4]) == 0b11)
          // PSW
          this.setControl(CTRL.ALU_FLAGS_OE, 1);
        else this.setControls("bus=reg", (getBits(irout, [5, 4]) << 1) + 1);
        this.setControl(CTRL.MEM_WE);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  POP(irout: number) {
    this.stage_max = 8;
    switch (this.stage) {
      case 3:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_SP;
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[MEM_MAR_WE] = 1'b1;
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 4:
        // 		if (opcode[5:4] == 2'b11) begin // PSW
        // 			ctrl_word[ALU_FLAGS_WE] = 1'b1;
        // 		end else begin
        // 			ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = {2'b0, opcode[5:4], 1'b1};
        // 			ctrl_word[REG_WE] = 1'b1;
        // 		end
        // 		ctrl_word[MEM_OE] = 1'b1;
        if (getBits(irout, [5, 4]) == 0b11)
          // PSW
          this.setControl(CTRL.ALU_FLAGS_WE);
        else this.setControls("reg=bus", (getBits(irout, [5, 4]) << 1) + 1);
        this.setControl(CTRL.MEM_OE);
        break;
      case 5:
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_SP;
        // 		ctrl_word[REG_EXT1:REG_EXT0] = REG_INC;
        this.setControls("sp++");
        break;
      case 6:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_SP;
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[MEM_MAR_WE] = 1'b1;
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 7:
        // 		if (opcode[5:4] == 2'b11) begin // PSW
        // 			ctrl_word[ALU_A_WE] = 1'b1;
        // 		end else begin
        // 			ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = {2'b0, opcode[5:4], 1'b0};
        // 			ctrl_word[REG_WE] = 1'b1;
        // 		end
        // 		ctrl_word[MEM_OE] = 1'b1;
        if (getBits(irout, [5, 4]) == 0b11)
          // PSW
          this.setControl(CTRL.ALU_A_WE);
        else this.setControls("reg=bus", getBits(irout, [5, 4]) << 1);
        this.setControl(CTRL.MEM_OE);
        break;
      case 8:
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_SP;
        // 		ctrl_word[REG_EXT1:REG_EXT0] = REG_INC;
        // 		stage_rst = 1'b1;
        this.setControls("sp++");
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  DAD(irout: number) {
    // DAD
    // opcode[5:4] - Extended Register
    // 8'o011, 8'o031, 8'o051, 8'o071: begin
    this.stage_max = 11;
    const reg = getBits(irout, [5, 4]);
    switch (this.stage) {
      case 3:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_HL_L;
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[ALU_A_STORE] = 1'b1;
        // 		ctrl_word[ALU_A_WE] = 1'b1;
        this.setControls("bus=reg", REGSEL.L);
        this.setControl(CTRL.ALU_A_STORE);
        this.setControl(CTRL.ALU_A_WE);
        break;
      case 4:
        // 		if (opcode[5:4] == 2'b11) begin
        // 			ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_SP_P;
        // 		end else begin
        // 			ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = {2'b0, opcode[5:4], 1'b1};
        // 		end
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[ALU_TMP_WE] = 1'b1;
        if (reg == 0b11) this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], REGSEL.SPP);
        else this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], (reg << 1) + 1);
        this.setControl(CTRL.REG_OE);
        this.setControl(CTRL.ALU_TMP_WE);
        break;
      case 5:
        // 		ctrl_word[ALU_CS] = 1'b1;
        // 		ctrl_word[ALU_OP4:ALU_OP0] = 5'b00000; // Add
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], ALUOP.ADD);
        break;
      case 6:
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_WZ_Z;
        // 		ctrl_word[REG_WE] = 1'b1;
        // 		ctrl_word[ALU_OE] = 1'b1;
        this.setControls("reg=bus", REGSEL.Z);
        this.setControl(CTRL.ALU_OE);
        break;
      case 7:
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_HL_H;
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[ALU_A_WE] = 1'b1;
        this.setControls("bus=reg", REGSEL.H);
        this.setControl(CTRL.ALU_A_WE);
        break;
      case 8:
        // 		if (opcode[5:4] == 2'b11) begin
        // 			ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_SP_S;
        // 		end else begin
        // 			ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = {2'b0, opcode[5:4], 1'b0};
        // 		end
        // 		ctrl_word[REG_OE] = 1'b1;
        // 		ctrl_word[ALU_TMP_WE] = 1'b1;
        if (reg == 0b11) this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], REGSEL.SPS);
        else this.setControl([CTRL.REG_RD_SEL4, CTRL.REG_RD_SEL0], reg << 1);
        this.setControl(CTRL.REG_OE);
        this.setControl(CTRL.ALU_TMP_WE);
        break;
      case 9:
        // 		ctrl_word[ALU_CS] = 1'b1;
        // 		ctrl_word[ALU_OP4:ALU_OP0] = 5'b00001; // Add w/ Carry
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], ALUOP.ADC); // add with carry
        break;
      case 10:
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_WZ_W;
        // 		ctrl_word[REG_WE] = 1'b1;
        // 		ctrl_word[ALU_OE] = 1'b1;
        // 		ctrl_word[ALU_A_RESTORE] = 1'b1;
        this.setControls("reg=bus", REGSEL.W);
        this.setControl(CTRL.ALU_OE);
        this.setControl(CTRL.ALU_A_RESTORE);
        break;
      case 11:
        // 		ctrl_word[REG_WR_SEL4:REG_WR_SEL0] = REG_HL;
        // 		ctrl_word[REG_WE] = 1'b1;
        // 		ctrl_word[REG_RD_SEL4:REG_RD_SEL0] = REG_WZ;
        // 		ctrl_word[REG_OE] = 1'b1;
        this.setControls("bus=reg", REGSEL.WZ);
        this.setControls("reg=bus", REGSEL.HL);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  XCHG() {
    this.stage_max = 5;
    // TODO: Does the 8080/5 use special hardware to do this without bus?
    // could implement by extending REGEXT signal to 3 bits
    // regext = 100 could be xchg
    switch (this.stage) {
      case 3: // wz = de
        this.setControls("bus=reg3", REGSEL.DE);
        this.setControls("reg3=bus", REGSEL.WZ);
        break;
      case 4: // de = hl
        this.setControls("bus=reg3", REGSEL.HL);
        this.setControls("reg3=bus", REGSEL.DE);
        break;
      case 5: // hl = wz
        this.setControls("bus=reg3", REGSEL.WZ);
        this.setControls("reg3=bus", REGSEL.HL);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  XTHL() {
    this.stage_max = 11;
    switch (this.stage) {
      case 3: // wz = hl
        this.setControls("bus=reg3", REGSEL.HL);
        this.setControls("reg3=bus", REGSEL.WZ);
        break;
      // pop lo byte to L
      case 4:
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 5:
        this.setControls("reg=bus", REGSEL.L);
        this.setControl(CTRL.MEM_OE);
        break;
      case 6:
        // replace lobyte in stack with saved L in Z
        this.setControls("bus=reg", REGSEL.Z);
        this.setControl(CTRL.MEM_WE);
        break;
      case 7:
        this.setControls("sp++");
        break;
      // pop hi byte to H
      case 8:
        this.setControls("mar=reg", REGSEL.SP);
        break;
      case 9:
        this.setControls("reg=bus", REGSEL.H);
        this.setControl(CTRL.MEM_OE);
        break;
      case 10:
        // replace hibyte in stack with saved h in W
        this.setControls("bus=reg", REGSEL.W);
        this.setControl(CTRL.MEM_WE);
        break;
      case 11:
        this.setControls("sp--"); // restore SP
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  PCHL() {
    this.stage_max = 3;
    // TODO: Does the 8080/5 use special hardware to do this without bus?
    // could implement by extending REGEXT signal to 3 bits
    // regext = 100 could be xchg
    switch (this.stage) {
      case 3: // wz = de
        this.setControls("bus=reg3", REGSEL.HL);
        this.setControls("reg3=bus", REGSEL.PC);
        this.stage_rst = 1;
        break;
      default:
        throw Error();
    }
  }

  HLT() {
    this.setControl(CTRL.HLT);
    this.setControl(CTRL.REG_EXT0, 0);
    this.stage_max = 3;
    this.stage_rst = 1;
  }

  INRDCR_M(irout: number) {
    // INR reg = 0o064
    // DCR reg = 0o065
    // opcode[0] 0 = INR, 1 = DCR
    // opcode[5:3] = 111

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
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b10000 | op);
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
    const op = getBit(irout, 0);
    const Rs = getBits(irout, [5, 3]);
    this.stage_max = Rs == 0b111 ? 3 : 5;
    switch (this.stage) {
      case 3:
        if (Rs == 0b111) {
          this.setControl(CTRL.ALU_CS);
          this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b10000 | op);
          this.stage_rst = 1;
        } else {
          this.setControls("bus=reg", Rs);
          this.setControl(CTRL.ALU_A_STORE);
          this.setControl(CTRL.ALU_A_WE);
        }
        break;
      case 4:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], 0b10000 | op);
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
    // opcode[3] 0 = INX, 1 = DCX
    // opcode[5:4]
    // 00 - BC
    // 01 - DE
    // 10 - HL
    // 11 - SP
    this.stage_max = 3;
    const op = getBit(irout, 3);
    const Rs = getBits(irout, [5, 4]);
    if (this.stage == 3) {
      if (Rs == 0b11) {
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], REGSEL.SP);
      } else {
        const wrsel = 0b10000 | (Rs << 1);
        this.setControl([CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0], wrsel);
      }
      this.setControl([CTRL.REG_EXT1, CTRL.REG_EXT0], op == 1 ? 0b10 : 0b01);
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

  ALU_A(irout: number) {
    // eg add a
    // a -> bus -> tmp
    // a = a + tmp
    this.stage_max = 4;
    switch (this.stage) {
      case 3:
        this.setControl(CTRL.ALU_OE);
        this.setControl(CTRL.ALU_TMP_WE);
        break;
      case 4:
        this.setControl(CTRL.ALU_CS);
        this.setControl([CTRL.ALU_OP4, CTRL.ALU_OP0], getBits(irout, [5, 3]));
        this.stage_rst = 1;
        break;
    }
  }

  ALU_Rs(irout: number) {
    this.stage_max = 4;
    const Rs = getBits(irout, [2, 0]);
    const op = getBits(irout, [5, 3]);
    switch (this.stage) {
      case 3:
        if (Rs == 0b111) {
          // eg ADD A
          // this doesn't seem to work
          // TMP_WE is set but A isn't on the bus
          // ALU_A used instead (=departure from Austin's verilog )
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
        if (!(flags == undefined) && getBit(flags, getBits(irout, [5, 4])) != getBit(irout, 3)) {
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

  CALL(irout: number, mem: Memory, regs: Registers, flags?: number) {
    // 0xcd / 205
    // pass irout if conditional call
    // console.log("call", this.stage, this.stage_rst, regs.pc);
    this.stage_max = 15;
    switch (this.stage) {
      case 3:
        if (mem.ram.at(regs.pc) == 5) {
          // bdos call
          this.bdos(regs.c, regs.de);
          // skip the address bytes
          this.setControls("pc+2");
          this.stage_rst = 1;
          this.stage_max = 3;
          this.skipCall = true;
          return;
        }
        if (flags !== undefined) {
          const conditionalFlag = getBits(irout, [5, 4]);
          const condition = getBit(irout, 3);
          if (getBit(flags, conditionalFlag) != condition) {
            // condition failed, don't jump, skip address bytes
            this.setControls("pc+2");
            this.stage_rst = 1;
            this.stage_max = 3;
            this.skipCall = true;
            return;
          }
        }
        this.setControls("mar=reg", REGSEL.PC);
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
    this.stage_max = 9;
    switch (this.stage) {
      case 3:
        if (!(flags == undefined) && getBit(flags, getBits(irout, [5, 4])) != getBit(irout, 3)) {
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
