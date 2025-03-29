import { ITagSymbol } from "./TagTable";

export enum CompilerRegs {
  NONE = 0,
  HL_REG = 1 << 1,
  DE_REG = 1 << 2,
}

export enum SymbolType {
  UNSIGNED = 1,
  STRUCT = 2,
  CCHAR = 1 << 2,
  UCHAR = (1 << 2) + 1,
  CINT = 2 << 2,
  UINT = (2 << 2) + 1,
}

export enum SymbolIdentity {
  NONE = 0,
  VARIABLE,
  ARRAY,
  POINTER,
  FUNCTION,
}

export enum SymbolStorage {
  PUBLIC = 1,
  AUTO,
  EXTERN,
  STATIC,
  LSTATIC,
  DEFAUTO,
}

/**
 * Describes a symbol
 */
export interface ISymbol {
  name: string;
  /**
   * NONE, VARIABLE, ARRAY, POINTER, FUNCTION
   */
  identity: SymbolIdentity;
  /**
   * char, int, struct - which can be signed or unsigned
   * UNSIGNED=1, STRUCT=2, CCHAR=4, UCHAR=5, CINT=8, UINT=9
   */
  type: SymbolType;
  /**
   * PUBLIC=1, AUTO=2, EXTERN=3, STATIC=4, LSTATIC=5, DEFAUTO=6
   */
  storage: SymbolStorage;
  offset: number;
  tagidx?: number;
}

/**
 * Reference a symbol
 */
export interface ILValue {
  symbol: ISymbol | 0;
  /**
   * If non-zero the lval is pointer to symbol of type=indirect
   */
  indirect: number;
  ptr_type: number;
  tagsym: ITagSymbol | 0;
}
