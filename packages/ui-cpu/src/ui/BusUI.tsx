import { useMemo, useState } from "react";
import { fprint } from "./utils";
import { isOn } from "../emulator/Bits";
import { CTRL } from "../emulator/Controller";
import { ComputerState } from "../emulator/Computer";
import { CpuComponent, CpuSignal, CpuValue } from "../components/CpuComponent";

export const BusUI = ({ compState }: { compState: ComputerState }) => {
  const [format, setFormat] = useState<16 | 10>(16);

  const ctrl = useMemo(
    () => ({
      alu_oe: isOn(compState.ctrl_word, CTRL.ALU_OE),
      reg_oe: isOn(compState.ctrl_word, CTRL.REG_OE),
      mem_oe: isOn(compState.ctrl_word, CTRL.MEM_OE),
      flags_oe: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_OE),
      ir_we: isOn(compState.ctrl_word, CTRL.IR_WE),
      reg_we: isOn(compState.ctrl_word, CTRL.REG_WE),
      mem_we: isOn(compState.ctrl_word, CTRL.MEM_WE),
      mem_mar_we: isOn(compState.ctrl_word, CTRL.MEM_MAR_WE),
      a_we: isOn(compState.ctrl_word, CTRL.ALU_A_WE),
      tmp_we: isOn(compState.ctrl_word, CTRL.ALU_TMP_WE),
      flg_we: isOn(compState.ctrl_word, CTRL.ALU_FLAGS_WE),
    }),
    [compState.ctrl_word]
  );

  const valueStatus = useMemo(() => {
    const anyOE = ctrl.alu_oe || ctrl.reg_oe || ctrl.mem_oe || ctrl.flags_oe;
    return { bus: anyOE ? (compState.clkState == "tick" ? "active" : "ready") : "inactive" };
  }, [compState.clkState, ctrl.alu_oe, ctrl.flags_oe, ctrl.mem_oe, ctrl.reg_oe]);

  const direction = useMemo(() => {
    if (ctrl.a_we || ctrl.tmp_we || ctrl.flg_we) return "right";
    if (ctrl.mem_mar_we || ctrl.mem_we) return "left";
    if (ctrl.ir_we) return "left";
    if (ctrl.reg_we) return "right";
    return "none";
  }, [ctrl.a_we, ctrl.flg_we, ctrl.ir_we, ctrl.mem_mar_we, ctrl.mem_we, ctrl.reg_we, ctrl.tmp_we]);

  return (
    <CpuComponent
      label="Bus"
      onFormatToggle={() => setFormat(format == 16 ? 10 : 16)}
      // status={direction == "none" ? "inactive" : "active"}
      status="none"
      direction={direction}>
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span>BUS</span>
        </div>
        <div className="flex flex-col text-center">
          <CpuValue value={fprint(compState.bus, format)} status={valueStatus.bus} />
        </div>
      </div>

      <div className="flex flex-col text-right">
        <CpuSignal label="ALU_OE" active={ctrl.alu_oe == 1} />
        <CpuSignal label="REG_OE" active={ctrl.reg_oe == 1} />
        <CpuSignal label="MEM_OE" active={ctrl.mem_oe == 1} />
        <CpuSignal label="FLG_OE" active={ctrl.flags_oe == 1} />
      </div>
    </CpuComponent>
  );
};
