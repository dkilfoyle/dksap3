import { CpuComponent } from "../components/CpuComponent";
import { ComputerState } from "../../../cpusim";

export const StdoutUI = ({ compState }: { compState: ComputerState }) => {
  return (
    <CpuComponent label="Stdout" status={compState.regs[8] == 0 && compState.regs[9] == 7 ? "input" : "none"} direction={"none"}>
      <div className="flex">
        <span style={{ height: "50px" }}>{compState.stdout}</span>
      </div>
    </CpuComponent>
  );
};
