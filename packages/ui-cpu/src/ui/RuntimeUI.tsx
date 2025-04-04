import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComputerState } from "@dksap3/cpusim";
import { getRegister, fprint16 } from "./utils";
import { IRuntimeState } from "@/App";

export const RuntimeUI = ({ compState, rtState }: { compState: ComputerState; rtState: IRuntimeState }) => {
  return (
    <div className="flex flex-row gap-10 rounded-md border p-3 border-zinc-500 mt-3">
      <div className="flex-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="text-right">Hex</TableHead>
              <TableHead className="text-right">Dec</TableHead>
              <TableHead className="text-right">Lbl</TableHead>
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
              <TableCell className="text-right">{rtState.hlLabel}</TableCell>
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
              <TableCell className="text-right">{rtState.deLabel}</TableCell>
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
            {rtState.frames.map((f) => (
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
              <TableHead className="w-[50px]">Lbl</TableHead>
              <TableHead className="text-right">Hex</TableHead>
              <TableHead className="text-right">Dec</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rtState.frames.length
              ? rtState.frames[0].mem.map((m, i) => {
                  const frm = rtState.frames[0];
                  const startAddr = frm.base - frm.mem.length * 2 + 1;
                  const addr = startAddr + i * 2;
                  return (
                    <TableRow>
                      <TableCell className="text-right">{addr}</TableCell>
                      <TableCell>{frm.labels[addr.toString()]}</TableCell>
                      <TableCell className="text-right">0x{m.toString(16).padStart(4, "0")}</TableCell>
                      <TableCell className="text-right">{m}</TableCell>
                    </TableRow>
                  );
                })
              : ""}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
