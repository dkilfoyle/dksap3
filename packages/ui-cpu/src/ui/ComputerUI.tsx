import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { AluUI } from "./AluUI";
import { BusUI } from "./BusUI";
import { ClockUI } from "./ClockUI";
import { CtrlUI } from "./CtrlUI";
import { DisplayUI } from "./DisplayUI";
import { IrUI } from "./IrUI";
import { MemUI } from "./MemUI";
// import { RamUI } from "./RamUI";
import { RegistersUI } from "./RegistersUI";
import { ComputerState } from "../../../cpusim";
import { StdoutUI } from "./StdoutUI";
import { StackUI } from "./StackUI";

// const pt = { root: { style: { padding: "0.3em 0.6em" } } };

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes.
  useLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}

export function ComputerUI({ computerState }: { computerState: ComputerState[] }) {
  const [halfStage, setHalfStage] = useState(0);
  const [isRun, setIsRun] = useState(false);
  const [runSpeed] = useState(200);

  useEffect(() => {
    setHalfStage(Math.max(0, computerState.length - 1));
    setIsRun(false);
    console.log(`ComputerUI received ${computerState.length} states, ir=${computerState[0].ir}`);
  }, [computerState]);

  const lastTick = useMemo(() => computerState[Math.max(0, computerState.length - 2)], [computerState]);
  const maxStages = useMemo(() => lastTick.stage_max, [lastTick.stage_max]);
  const curState = useMemo(() => {
    const x = computerState[Math.min(computerState.length - 1, halfStage)];
    return x;
  }, [computerState, halfStage]);

  useInterval(
    () => {
      if (halfStage < computerState.length - 1) {
        setHalfStage((cur) => Math.min(cur + 1, computerState.length - 1));
      } else setIsRun(false);
    },
    isRun ? runSpeed : null
  );

  const onRewind = useCallback(() => {
    setHalfStage(0);
  }, []);

  const onPlay = useCallback(() => {
    setIsRun(true);
  }, []);

  const onStepFoward = useCallback(() => {
    setHalfStage((cur) => Math.min(cur + 1, computerState.length - 1));
  }, [computerState.length]);

  return (
    <div className="flex flex-col gap-3 align-items-center max-w-fit">
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-3 justify-between">
          <MemUI compState={curState}></MemUI>
          <IrUI compState={curState}></IrUI>
          <ClockUI compState={curState} maxStages={maxStages} play={onPlay} rewind={onRewind} stepFoward={onStepFoward}></ClockUI>
        </div>
        <div className="flex flex-1 flex-col gap-3 justify-between">
          <BusUI compState={curState}></BusUI>
          <StdoutUI compState={curState}></StdoutUI>
          <DisplayUI compState={curState}></DisplayUI>
        </div>
        <div className="flex flex-1 flex-col gap-3 justify-between">
          <AluUI compState={curState}></AluUI>
          <RegistersUI compState={curState}></RegistersUI>
        </div>
      </div>
      <CtrlUI compState={curState}></CtrlUI>
      <StackUI compState={curState}></StackUI>
    </div>
  );
}
