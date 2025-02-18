export enum CompilerRegs {
  HL_REG = 1 << 1,
  DE_REG = 1 << 2,
}

export interface ISymbol {
  name: string;
  identity: SymbolIdentity;
  type: SymbolType;
  storage: SymbolStorage;
  offset: number;
  tagidx?: number;
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
export interface Ilvalue {
  symbol: ISymbol | 0;
  indirect: number;
  ptr_type: number;
  tagsym: ITagSymbol | 0;
}

export interface ITagSymbol {
  name: string;
  size: number;
  member_idx: number;
  number_of_members: number;
}
