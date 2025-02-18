import { ITagSymbol } from "./interface";

class StructTable {
  structs: ITagSymbol[] = [];
  constructor() {}
  find(name: string) {
    return this.structs.findIndex((s) => s.name == name);
  }
}

export const struct_table = new StructTable();
