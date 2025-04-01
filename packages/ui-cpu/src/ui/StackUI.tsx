import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComputerState } from "../../../cpusim";
import { getRegister, fprint16 } from "./utils";
import { IStackFrame } from "@/App";

export const StackUI = ({ compState, stackFrames }: { compState: ComputerState; stackFrames: IStackFrame[] }) => {
  return (
    <div className="flex flex-row gap-10 rounded-md border p-3 border-zinc-500 mt-3">
      <div className="flex-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="text-right">Hex</TableHead>
              <TableHead className="text-right">Dec</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>SP</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(compState.regs, "sp"), 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(compState.regs, "sp"), 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(SP)</TableCell>
              <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "sp")], 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "sp")], 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>HL</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(compState.regs, "hl"), 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(compState.regs, "hl"), 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(HL)</TableCell>
              <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "hl")], 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "hl")], 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>DE</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(compState.regs, "de"), 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(getRegister(compState.regs, "de"), 10, true)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(DE)</TableCell>
              <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "de")], 16, true)}</TableCell>
              <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "de")], 10, true)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="grow"></div>
      <div className="w-[120px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Frame</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Base</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stackFrames.map((f) => (
              <TableRow>
                <TableCell>{f.name}</TableCell>
                <TableCell>{f.file.slice(f.file.lastIndexOf("/") + 1)}</TableCell>
                <TableCell className="text-right">{f.base}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="w-[180px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[30px]">SP</TableHead>
              <TableHead className="text-right">Hex</TableHead>
              <TableHead className="text-right">Dec</TableHead>
              <TableHead className="w-[50px]">Lbl</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stackFrames.length
              ? stackFrames[0].mem.map((m, i) => (
                  <TableRow>
                    <TableCell className="text-right">{stackFrames[0].base - i * 2 - 1}</TableCell>
                    <TableCell className="text-right">0x{m.toString(16).padStart(4, "0")}</TableCell>
                    <TableCell className="text-right">{m}</TableCell>
                    <TableCell>{stackFrames[0].labels[i]}</TableCell>
                  </TableRow>
                ))
              : ""}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
