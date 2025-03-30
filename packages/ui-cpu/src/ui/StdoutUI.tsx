import { CpuComponent } from "../components/CpuComponent";
import { ComputerState } from "../../../cpusim";
import { Textarea } from "@/components/ui/textarea";

export const StdoutUI = ({ compState }: { compState: ComputerState }) => {
  return (
    <CpuComponent label="Stdout" status={compState.regs[8] == 0 && compState.regs[9] == 7 ? "input" : "none"} direction={"none"}>
      <div className="flex">
        <Textarea value={compState.stdout} className="stdout"></Textarea>
      </div>
    </CpuComponent>
  );
};
