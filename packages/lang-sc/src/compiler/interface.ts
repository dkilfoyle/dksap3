import { ISymbol } from "./SymbolTable";
import { ITagSymbol } from "./TagTable";

export enum CompilerRegs {
  NONE = 0,
  HL_REG = 1 << 1,
  DE_REG = 1 << 2,
}

export interface ILValue {
  symbol: ISymbol | 0;
  indirect: number;
  ptr_type: number;
  tagsym: ITagSymbol | 0;
}
