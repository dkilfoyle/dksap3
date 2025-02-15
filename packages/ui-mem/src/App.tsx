import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./App.css";
import _ from "lodash";
import clsx from "clsx";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

// // @ts-expect-error will be provided by vscode webview
// const vscode = acquireVsCodeApi();
// // Get existing state
// const oldState = vscode.getState() || {
//   memory: new Array(255).fill(0),
//   pointers: { sp: 0, sb: 0, pc: 0, hl: 0 },
//   start: 0,
//   end: 255,
//   selection: "0",
// };

const oldState = {
  memory: new Array(255).fill(0),
  pointers: { sp: 0, sb: 0, pc: 0, hl: 0 },
  start: 0,
  end: 255,
  selection: "0",
};

function App() {
  const [memory, setMemory] = useState<number[]>(oldState.memory);
  const [pointers, setPointers] = useState<{ sp: number; sb: number; pc: number; hl: number }>({ ...oldState.pointers });
  const [start, setStart] = useState(oldState.start);
  const [end, setEnd] = useState(oldState.end);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const [hoverCell, setHoverCell] = useState<number>();
  const [selection, setSelection] = useState(oldState.selection);
  const [labels, setLabels] = useState<Record<string, number>>({});

  // useEffect(() => {
  //   vscode.setState({
  //     memory,
  //     pointers,
  //     start,
  //     end,
  //     selection,
  //   });
  // }, [end, memory, pointers, selection, start]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      // console.log("Memview received message", message.command, message.data);
      switch (message.command) {
        case "setMemory":
          setMemory(message.data);
          break;
        case "setPointers":
          setPointers({ sp: message.data.sp, sb: message.data.sb, pc: message.data.pc, hl: message.data.hl });
          break;
        case "setLabels":
          setLabels(message.data);
          break;
        case "setRange":
          setStart(message.data.start);
          setEnd(Math.min(message.data.end, memory.length));
          break;
      }
    });
  }, [end, memory, memory.length, pointers, selection, start]);

  const page = useMemo(() => {
    const firstRow = Math.floor(start / 16);
    const lastRow = Math.floor(end / 16);
    return { firstRow, lastRow };
  }, [end, start]);

  const hoverInfo = useMemo(() => {
    if (hoverCell == undefined) return "[]:";
    const addr = hoverCell; // - page.firstRow;
    const val = memory.at(addr);
    let x = `[0x${addr.toString(16).padStart(4, "0")}, ${addr.toString(10).padStart(4, "0")}]: 0x${val?.toString(16).padStart(2, "0")}, ${val
      ?.toString(10)
      .padStart(3, "0")}`;

    // add character represention if printable
    // if (val && val > 31 && val < 255) x += `, ${String.fromCharCode(val)}`;

    // add label offset
    let nearestLabel = "";
    let nearestOffset = 0;
    Object.entries(labels).forEach(([label, offset]) => {
      if (offset <= addr && offset > nearestOffset) {
        nearestLabel = label;
        nearestOffset = offset;
      }
    });

    if (nearestLabel != "") x += ` [${nearestLabel} + ${addr - nearestOffset}]`;
    return x;
  }, [hoverCell, labels, memory]);

  const onZero = useCallback(() => {
    setSelection("0");
    setStart(0);
    setEnd(memory.length);
    if (startInputRef.current) startInputRef.current.value = "0000";
    if (endInputRef.current) endInputRef.current.value = memory.length.toString(16).padStart(4, "0");
  }, [memory.length]);

  const onSP = useCallback(() => {
    setSelection("SP");
    setStart(pointers.sp);
    setEnd(pointers.sb);
    if (startInputRef.current) startInputRef.current.value = pointers.sp.toString(16).padStart(4, "0");
    if (endInputRef.current) endInputRef.current.value = pointers.sb.toString(16).padStart(4, "0");
  }, [pointers.sb, pointers.sp]);

  const onPC = useCallback(() => {
    setSelection("PC");
    setStart(pointers.pc);
    setEnd(pointers.pc + 100);
    if (startInputRef.current) startInputRef.current.value = pointers.pc.toString(16).padStart(4, "0");
    if (endInputRef.current) endInputRef.current.value = (pointers.pc + 100).toString(16).padStart(4, "0");
  }, [pointers]);

  const onHL = useCallback(() => {
    setSelection("HL");
    setStart(pointers.hl);
    setEnd(pointers.hl + 100);
    if (startInputRef.current) startInputRef.current.value = pointers.hl.toString(16).padStart(4, "0");
    if (endInputRef.current) endInputRef.current.value = (pointers.hl + 100).toString(16).padStart(4, "0");
  }, [pointers.hl]);

  return (
    <div className="flex font-mono p-3">
      <div className={clsx("flex flex-col gap-3 w-fit memview-page")}>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <Label className="text-right pr-2" htmlFor="from">
              Addr
            </Label>
            <Input
              ref={startInputRef}
              id="from"
              variant="vscode"
              sizeVariant="sm"
              size={4}
              onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key == "Enter") {
                  setSelection("custom");
                  setStart(parseInt(`0x${e.currentTarget.value}`));
                }
              }}></Input>
            <Label>-</Label>
            <Input
              ref={endInputRef}
              variant="vscode"
              sizeVariant="sm"
              size={4}
              onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key == "Enter") {
                  setSelection("custom");
                  setEnd(parseInt(`0x${e.currentTarget.value}`));
                }
              }}></Input>
            <Button size="xs" variant={selection == "0" ? "vscodePrimary" : "vscodeSecondary"} onClick={onZero}>
              <span className="w-3">0</span>
            </Button>
            <Button size="xs" variant={selection == "PC" ? "vscodePrimary" : "vscodeSecondary"} onClick={onPC}>
              <span className="w-3">PC</span>
            </Button>
            <Button size="xs" variant={selection == "SP" ? "vscodePrimary" : "vscodeSecondary"} onClick={onSP}>
              <span className="w-3">SP</span>
            </Button>
            <Button size="xs" variant={selection == "HL" ? "vscodePrimary" : "vscodeSecondary"} onClick={onHL}>
              <span className="w-3">HL</span>
            </Button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span>{hoverInfo}</span>
        </div>
        <div className="grid grid-cols-[auto_repeat(16,_minmax(1rem,_1rem))_minmax(0,_auto)] grid-flow-row gap-x-1 text-center cursor-default">
          <span className="pr-2 text-right"></span>
          <span className="text-yellow-700">00</span>
          <span className="text-yellow-700">01</span>
          <span className="text-yellow-700">02</span>
          <span className="text-yellow-700">03</span>
          <span className="text-yellow-700">04</span>
          <span className="text-yellow-700">05</span>
          <span className="text-yellow-700">06</span>
          <span className="text-yellow-700">07</span>
          <span className="text-yellow-700">08</span>
          <span className="text-yellow-700">09</span>
          <span className="text-yellow-700">0a</span>
          <span className="text-yellow-700">0b</span>
          <span className="text-yellow-700">0c</span>
          <span className="text-yellow-700">0d</span>
          <span className="text-yellow-700">0e</span>
          <span className="text-yellow-700">0f</span>
          <div className="pl-4 flex items-center justify-between invisible min-[400px]:visible"></div>

          {_.range(page.firstRow, page.lastRow).map((r) => (
            <React.Fragment key={`row${r}`}>
              <span className="text-right pr-4 text-yellow-700">{(r * 16).toString(16).padStart(4, "0")}</span>
              {_.range(0, 16).map((i) => (
                <span
                  key={`cell${r * 16 + i}`}
                  className={clsx(
                    "text-gray-400",
                    r * 16 + i < start && "text-gray-600",
                    r * 16 + i > end && "text-gray-600",
                    "hover:text-black hover:bg-gray-200",
                    r * 16 + i == pointers.pc && "border border-orange-500",
                    r * 16 + i == pointers.sp && "border border-green-500",
                    r * 16 + i == pointers.hl && "border border-blue-500"
                  )}
                  onMouseOver={() => {
                    setHoverCell(r * 16 + i);
                  }}>
                  {memory
                    .at(r * 16 + i)
                    ?.toString(16)
                    .padStart(2, "0")}
                </span>
              ))}
              <div className="text-right pl-4 memview-ascii invisible min-[400px]:visible overflow-hidden inline-flex">
                {memory.slice(r * 16, r * 16 + 16).map((x, i) => (
                  <span className={clsx(r * 16 + i == hoverCell && "text-black bg-gray-200")}>
                    {x > 32 && x < 127 ? String.fromCharCode(x) : "."}
                  </span>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
