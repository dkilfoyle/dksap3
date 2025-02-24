import { Generator, generator } from "./Generator";

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

export class SymbolTable {
  public static NUMBER_OF_GLOBALS = 100;
  public static NUMBER_OF_LOCALS = 20;
  public symbols: ISymbol[] = [];
  public global_table_index = 0;
  public local_table_index = SymbolTable.NUMBER_OF_GLOBALS;
  // public current_symbol_table_index = 0;

  init() {
    this.local_table_index = SymbolTable.NUMBER_OF_GLOBALS;
    this.global_table_index = 0;
  }

  find_global(name: string) {
    return this.symbols.slice(0, this.global_table_index).findIndex((s) => s.name == name);
  }

  find_local(name: string) {
    // search from newest to oldest
    let idx = this.local_table_index;
    while (idx > SymbolTable.NUMBER_OF_GLOBALS) {
      idx--;
      if (this.symbols[idx] && this.symbols[idx].name == name) return idx;
    }
    return -1;
  }

  add_local(name: string, identity: SymbolIdentity, type: SymbolType, offset: number, storage: number) {
    const existing = this.find_local(name);
    if (existing > -1) return { index: existing, lines: [] };
    if (this.local_table_index >= SymbolTable.NUMBER_OF_GLOBALS + SymbolTable.NUMBER_OF_LOCALS) throw Error("local symbole table overflow");

    const lines = [];
    if (storage == SymbolStorage.LSTATIC) {
      lines.push(...generator.data_segment_gdata());
      const k = generator.get_label();
      lines.push(...generator.gen_label(k));
      lines.push(".ds\t${offset}");
      lines.push(...generator.code_segment_gtext());
      offset = k;
    }

    this.symbols[this.local_table_index] = {
      name,
      identity,
      type,
      offset,
      storage,
    };

    this.local_table_index++;
    return { index: this.local_table_index - 1, lines };
  }

  add_global(name: string, identity: SymbolIdentity, type: SymbolType, offset: number, storage: number) {
    const existing = this.find_global(name);
    if (existing > -1) return existing;
    if (this.global_table_index >= SymbolTable.NUMBER_OF_GLOBALS) throw Error("global symbol table overflow");

    this.symbols[this.global_table_index++] = {
      name,
      identity,
      type,
      offset,
      storage,
    };
    return this.global_table_index - 1;
  }
}

export const symbol_table = new SymbolTable();
