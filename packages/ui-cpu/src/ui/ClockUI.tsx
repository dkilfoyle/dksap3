import clsx from "clsx";
import { CpuComponent } from "../components/CpuComponent";
import { ComputerState } from "../emulator/Computer";
import _ from "lodash";
import { Play, StepForward, Rewind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const bclsx =
  "vscode-button-primary inline-flex items-center justify-center gap-2 whitespace-nowrap h-5 rounded-sm px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const ClockUI = ({
  compState,
  maxStages,
  rewind,
  play,
  stepFoward,
}: {
  compState: ComputerState;
  maxStages: number;
  rewind: () => void;
  play: () => void;
  stepFoward: () => void;
}) => {
  const curStage = useMemo(() => {
    if (compState.stage_rst == 1) return compState.stage_max;
    return compState.stage;
  }, [compState]);

  return (
    <CpuComponent label="Clock" status="none" direction="none">
      <div className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-[3rem_auto] grid-flow-row gap-x-4 align-center auto-rows-min">
          <span>Cycle</span> <span>{compState.clkCount}</span>
          <span>CLK</span> <span>{compState.clkState}</span>
          <span>Stage</span>
          <div className="flex flex-row justify-between">
            <span>
              {curStage.toString().padStart(2, "0")} / {maxStages.toString().padStart(2, "0")}
            </span>
            <div className="flex flex-row gap-1">
              <Button onClick={rewind} className={bclsx}>
                <Rewind></Rewind>
              </Button>
              <Button onClick={stepFoward} className={bclsx}>
                <StepForward></StepForward>
              </Button>
              <Button onClick={play} className={bclsx}>
                <Play></Play>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {_.range(0, maxStages + 1).map((i) => (
            <span
              className={clsx(
                i == curStage && "bg-gray-200 text-black",
                i == curStage && compState.clkState == "tock" && "tock",
                i == curStage && compState.clkState == "tick" && "tick",
                i > curStage ? "border border-gray-700 text-gray-800" : "border border-gray-200",
                "flex-1 h-4"
              )}
              key={`t-${i}`}></span>
          ))}
        </div>
      </div>
      {/* 
      <div className="flex flex-col gap-4">
        <div className="flex gap-6">
          <div className="flex flex-col text-left">
            <span>Cycle</span>
            <span>CLK</span>
            <span>Stage</span>
          </div>
          <div className="flex flex-col text-left">
            <span>{compState.clkCount}</span>
            <span>{compState.clkState}</span>
            <span>
              {compState.stage} of {compState.stage_max}
            </span>
          </div>
        </div> */}
      {/* </div> */}
    </CpuComponent>
  );
};
