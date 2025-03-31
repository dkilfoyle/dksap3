import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComputerState } from "../../../cpusim";
import { getRegister, fprint16 } from "./utils";

export const StackUI = ({ compState }: { compState: ComputerState }) => {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 border-zinc-500 mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead className="text-right">SP</TableHead>
            <TableHead className="text-right">(SP)</TableHead>
            <TableHead className="w-[15px]"></TableHead>
            <TableHead className="text-right">HL</TableHead>
            <TableHead className="text-right">(HL)</TableHead>
            <TableHead className="w-[15px]"></TableHead>
            <TableHead className="text-right">DE</TableHead>
            <TableHead className="text-right">(DE)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Hex</TableCell>
            <TableCell className="text-right">{fprint16(getRegister(compState.regs, "sp"), 16, true)}</TableCell>
            <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "sp")], 16, true)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{fprint16(getRegister(compState.regs, "hl"), 16, true)}</TableCell>
            <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "hl")], 16, true)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{fprint16(getRegister(compState.regs, "de"), 16, true)}</TableCell>
            <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "de")], 16, true)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dec</TableCell>
            <TableCell className="text-right">{fprint16(getRegister(compState.regs, "sp"), 10, true)}</TableCell>
            <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "sp")], 10, true)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{fprint16(getRegister(compState.regs, "hl"), 10, true)}</TableCell>
            <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "hl")], 10, true)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{fprint16(getRegister(compState.regs, "de"), 10, true)}</TableCell>
            <TableCell className="text-right">{fprint16(compState.mem[getRegister(compState.regs, "de")], 10, true)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
