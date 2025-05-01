import { SymbolType } from "./interface";
import { ITagSymbol } from "./struct";

interface ISymbolInitial {
  name: string;
  type: number;
  dim: number;
  data_len: number;
  data_start: number;
}

// TODO: Simplify
// {
//   name:string;
//   type: SymbolType;
//   data: number[];
// }

// TODO: Handle initials for array of structs
// struct S {
//   int x;
//   int y;
// } z[3] = {{1,2},{3,4},{5,6}}

export class InitialTable {
  initials: Record<string, ISymbolInitial> = {};
  data: number[] = [];
  init() {
    this.initials = {};
    this.data = [];
  }
  add_symbol(name: string, type: SymbolType) {
    this.initials[name] = {
      name,
      type,
      dim: 0,
      data_len: 0,
      data_start: this.data.length,
    };
    return this.initials[name];
  }
  add_initial(name: string, type: SymbolType, value: number, tag: ITagSymbol | 0, member_index?: number) {
    const initial = this.initials[name] || this.add_symbol(name, tag == 0 ? type : SymbolType.STRUCT);
    if (tag != 0) {
      if (member_index == undefined) throw Error("Need member index");
      const index = initial.dim % tag.members.length;
      const member_type = tag.members[member_index].type;
      this.add_initial(name, member_type, value, 0);
    } else {
      if (type & SymbolType.CCHAR) {
        this.data.push(0xff & value);
        initial.data_len += 1;
      } else if (type & SymbolType.CINT) {
        this.data.push((0xff00 & value) >> 8);
        this.data.push(0xff & value);
        initial.data_len += 2;
      } else throw Error("add initials invalid type " + type.toString());
      this.initials[name].dim += 1;
    }
  }

  get_item_at(name: string, position: number, tag: 0 | ITagSymbol) {
    const sym = this.initials[name];
    if (!sym) throw Error("get_item_at no symbol");
    if (sym.type & SymbolType.CCHAR) {
      return this.data[sym.data_start + position];
    } else if (sym.type & SymbolType.CINT) {
      return (this.data[sym.data_start + position * 2] << 8) + this.data[sym.data_start + position * 2 + 1];
    } else if (sym.type == SymbolType.STRUCT) {
      if (tag == 0) throw Error("get_item_at for sym.type=struct cant be 0");
      let dataOffset = sym.data_start;
      for (let mi = 0; mi < position; mi++) {
        const type = tag.members[mi].type;
        dataOffset += type & SymbolType.CCHAR ? 1 : 2;
      }
      const type = tag.members[position].type;
      if (type & SymbolType.CCHAR) return this.data[dataOffset];
      else return (this.data[dataOffset] << 8) + (this.data[dataOffset + 1] & 0xff);
    }
  }
}
