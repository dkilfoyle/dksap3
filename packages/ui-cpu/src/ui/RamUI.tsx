import { useState, useMemo } from "react";
import _ from "lodash";
import { fprint } from "./utils";
import { ComputerState } from "../../../cpusim";
import clsx from "clsx";
import { CpuComponent } from "../components/CpuComponent";

export const RamUI = ({ compState }: { compState: ComputerState }) => {
  const [offset] = useState(0);
  const [format, setFormat] = useState<16 | 10>(16);

  const memslice = useMemo(() => {
    return compState.mem.slice(offset, offset + 16 * 16 + 1).map((x) => fprint(x, format));
  }, [compState.mem, format, offset]);

  const pc = useMemo(() => {
    const r8 = compState.regs[8];
    const r9 = compState.regs[9];
    return ((r8 << 8) | r9) & 0xffff;
  }, [compState.regs]);

  return (
    <CpuComponent label="RAM" onFormatToggle={() => setFormat(format == 16 ? 10 : 16)} status="none" direction="none">
      <div className="flex">
        <div className="flex flex-col w-2rem">
          {/* row names */}
          <span>__</span>
          {_.range(0, 16).map((j) => (
            <span className="bg-gray-400 text-center" key={`ramrow-${j}`}>
              {j.toString(16).padStart(2, "0")}
            </span>
          ))}
        </div>
        {_.range(0, 16).map((j) => (
          <div className="flex flex-col w-[2rem]" key={`memcol-${j}`}>
            <span className="bg-gray-400 text-right">{j.toString(16)}</span>
            {_.range(0, 16).map((i) => (
              <span
                className={clsx(
                  {
                    "bg-red-100": i * 16 + j == compState.mar,
                    outline: i * 16 + j == pc,
                  },
                  "text-right"
                )}
                key={`memcell-${i}-${j}`}>
                {memslice[i * 16 + j]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </CpuComponent>
  );
};
