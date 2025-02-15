import { PropsWithChildren } from "react";
import clsx from "clsx";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

const pillClasses = "bg-[#fafafa] text-black rounded-md";

export function CpuComponent({
  label,
  onFormatToggle,
  status,
  children,
  direction,
}: PropsWithChildren<{ label: string; status: string; direction: string; onFormatToggle?: () => void }>) {
  return (
    <div
      className={clsx(
        "rounded-xl border",
        status == "output" && "border-green-400",
        status == "inout" && "border-blue-200",
        status == "input" && "border-red-400",
        status == "none" && "border-zinc-600"
      )}>
      <div className={`flex flex-col gap-1rem p-4`}>
        <div className="flex flex-row justify-between">
          <span className="font-semibold">{label}</span>
          {status == "x" && (
            <ArrowRightIcon
              className={clsx(
                "size-6 transition-transform",
                direction == "right" && "rotate-0",
                direction == "left" && "rotate-180",
                direction == "down" && "rotate-90 scale-95",
                direction == "none" && "scale-0"
              )}
            />
          )}
          {onFormatToggle && (
            <button onClick={onFormatToggle} className="border px-3 rounded-lg border-gray-500 hover:bg-gray-700 text-xs">
              H
            </button>
          )}
        </div>
        <div className="flex flex-row justify-between text-zinc-400">{children}</div>
      </div>
    </div>
  );
}

export function CpuSignal({ label, active }: { label: string; active?: boolean }) {
  return <div className={clsx("transition-colors px-1.5", clsx(active && pillClasses))}>{label}</div>;
}

export function CpuValue({ value, status, px = "1.5" }: { value: string; status: string; px?: string }) {
  return (
    <span
      className={clsx(
        "transition-colors border border-transparent rounded-md text-right",
        `px-${px}`,
        status == "active" && pillClasses,
        status == "ready" && "!border-[#e5e7eb]"
      )}>
      {value}
    </span>
  );
}

// export function CpuComponent({ label, onFormatToggle, children }: PropsWithChildren<{ label: string; onFormatToggle: () => void }>) {
//   return (
//     <div className={`flex flex-col gap-2 p-2 rounded-md ${componentColors[label][0]} text-white`}>
//       <div onClick={onFormatToggle} className={`flex-1 ${componentColors[label][1]} rounded-lg text-center text-black font-bold py-1`}>
//         {label}
//       </div>
//       <div className="flex flex-row justify-between px-2">{children}</div>
//     </div>
//   );
// }
