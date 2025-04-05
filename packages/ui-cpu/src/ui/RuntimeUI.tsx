import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComputerState } from "@dksap3/cpusim";
import { getRegister, fprint16, regnames } from "./utils";
import { IRuntimeState } from "@/App";
import { useCallback, useMemo, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { getBits } from "../emulator/Bits";
import clsx from "clsx";

import { CTRL } from "../emulator/Controller";

const pillClasses = "bg-[#fafafa] text-black rounded-md";

export const RuntimeUI = ({ compStates, halfStage, rtState }: { compStates: ComputerState[]; halfStage: number; rtState: IRuntimeState }) => {
  const [spformat, setSpformat] = useState(10);
  const [sbformat, setSbformat] = useState(10);

  const onSPFormatToggle = useCallback(() => {
    setSpformat((cur) => (cur == 10 ? 16 : 10));
  }, []);
  const onSBFormatToggle = useCallback(() => {
    setSbformat((cur) => (cur == 10 ? 16 : 10));
  }, []);

  const curState = useMemo(() => compStates[Math.min(halfStage, compStates.length - 1)], [compStates, halfStage]);
  const regChanges = useMemo(() => {
    const res = compStates.reduce<{ sp: number[]; de: number[]; hl: number[] }>(
      (accum, cur, i) => {
        const wr = regnames[getBits(cur.ctrl_word, [CTRL.REG_WR_SEL4, CTRL.REG_WR_SEL0])];
        if (wr == "hi(SP)" || wr == "lo(SP)") accum.sp.push(i);
        if (wr == "H" || wr == "L" || wr == "HL") accum.hl.push(i);
        if (wr == "D" || wr == "E" || wr == "DE") accum.de.push(i);
        return accum;
      },
      { sp: [], de: [], hl: [] }
    );
    console.log("regChanges", res);
    return res;
  }, [compStates]);

  return (
    <div className="flex flex-row gap-4 rounded-md border p-3 border-zinc-500 mt-3">
      <div className="flex-none font-mono">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="text-right">Hex</TableHead>
              <TableHead className="text-right">Dec</TableHead>
              <TableHead className="text-right w-[40px]">Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <span
                  className={clsx(
                    "transition-colors border border-transparent rounded-md px-1.5",
                    regChanges.sp.length && "!border-[#e5e7eb]",
                    regChanges.sp.includes(halfStage) && pillClasses
                  )}>
                  SP
                </span>
              </TableCell>
              <TableCell className="text-right">{fprint16(getRegister(curState.regs, "sp"), 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(curState.regs, "sp"), 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(SP)</TableCell>
              <TableCell className="text-right">{fprint16(curState.mem[getRegister(curState.regs, "sp")], 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(curState.mem[getRegister(curState.regs, "sp")], 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <span
                  className={clsx(
                    "transition-colors border border-transparent rounded-md px-1.5",
                    regChanges.hl.length && "!border-[#e5e7eb]",
                    regChanges.hl.includes(halfStage) && pillClasses
                  )}>
                  HL
                </span>
              </TableCell>
              <TableCell className="text-right">{fprint16(getRegister(curState.regs, "hl"), 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(curState.regs, "hl"), 10, true)}</TableCell>
              <TableCell className="text-right">{rtState.hlLabel}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(HL)</TableCell>
              <TableCell className="text-right">{fprint16(curState.mem[getRegister(curState.regs, "hl")], 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(curState.mem[getRegister(curState.regs, "hl")], 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <span
                  className={clsx(
                    "transition-colors border border-transparent rounded-md px-1.5",
                    regChanges.de.length && "!border-[#e5e7eb]",
                    regChanges.de.includes(halfStage) && "pillclasses"
                  )}>
                  DE
                </span>
              </TableCell>
              <TableCell className="text-right">{fprint16(getRegister(curState.regs, "de"), 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(curState.regs, "de"), 10, true)}</TableCell>
              <TableCell className="text-right">{rtState.deLabel}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(DE)</TableCell>
              <TableCell className="text-right">{fprint16(curState.mem[getRegister(curState.regs, "de")], 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(curState.mem[getRegister(curState.regs, "de")], 10, true)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="grow"></div>
      <div className="flex flex-col gap-1 font-mono">
        <div className="flex flex-row gap-4 border-b-[1px] border-b-zinc-800 text-muted-foreground h-[20px] items-center">
          <span className="w-[40px] text-right">
            <button onClick={onSBFormatToggle} className="border px-3 rounded-lg border-gray-500 hover:bg-gray-700 text-xs">
              SB
            </button>
          </span>
          <span className="w-[40px]">File</span>
          <span className="w-[40px]">Frame</span>
        </div>
        <ScrollArea>
          <AnimatePresence mode="popLayout">
            {rtState.frames.length
              ? rtState.frames.map((f, i) => {
                  return (
                    <motion.div
                      layout
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring" }}
                      className="flex flex-row gap-4"
                      key={`frame${i}`}>
                      <span className="w-[40px] pr-2 text-right">{fprint16(f.base, sbformat, true)}</span>
                      <span className="w-[40px] pl-1">
                        {f.file.slice(f.file.includes("/") ? f.file.lastIndexOf("/") + 1 : 0, f.file.indexOf(".asm"))}
                      </span>
                      <span className="w-[40px] pl-1">{f.name.slice(0, 10)}</span>
                    </motion.div>
                  );
                })
              : ""}
          </AnimatePresence>
        </ScrollArea>
      </div>
      <div className="flex flex-col gap-1 px-2 font-mono">
        <div className="flex flex-row gap-4 border-b-[1px] border-b-zinc-800 text-muted-foreground h-[20px] items-center">
          <span className="w-[40px] text-right">
            <button onClick={onSPFormatToggle} className="border px-3 rounded-lg border-gray-500 hover:bg-gray-700 text-xs">
              SP
            </button>
          </span>
          <span className="w-[40px]">Name</span>
          <span className="w-[30px] text-right">Hex</span>
          <span className="w-[30px] text-right">Dec</span>
        </div>
        <ScrollArea>
          <AnimatePresence mode="popLayout">
            {rtState.frames.length
              ? rtState.frames[0].mem.map((m, i) => {
                  const frm = rtState.frames[0];
                  const startAddr = frm.base - frm.mem.length * 2 + 1;
                  const addr = startAddr + i * 2;
                  return (
                    <motion.div
                      layout
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring" }}
                      className="flex flex-row gap-4"
                      key={`stack${addr}`}>
                      <span className="w-[40px] pr-2 text-right">{fprint16(addr, spformat, true)}</span>
                      <span className="w-[40px] pl-2">{frm.labels[addr.toString()]}</span>
                      <span className="w-[30px] text-right">{fprint16(m, 16, true)}</span>
                      <span className="w-[30px] text-right">{m}</span>
                    </motion.div>
                  );
                })
              : ""}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </div>
  );
};
