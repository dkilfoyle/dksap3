import { StructTypeDeclaration, StructTypeSpecifier } from "src/language/generated/ast";
import { ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";
import { getSymbolStorage, getSymbolType } from "./symbol";
import { ScCompiler } from "./sc-compiler";

export interface ITagSymbol {
  name: string;
  size: number;
  members: ISymbol[];
}

export class TagTable {
  tags: ITagSymbol[] = [];
  public constructor() {}
  init() {
    this.tags = [];
  }
  find(name: string) {
    return this.tags.findIndex((t) => t.name == name);
  }
  define_struct(decl: StructTypeDeclaration, storage: SymbolStorage) {
    const existing = this.find(decl.name);
    if (existing != -1) return existing;

    const tag: ITagSymbol = {
      name: decl.name,
      size: 0,
      members: [],
    };

    const scaleSize = (type: SymbolType, dim: number) => {
      switch (type) {
        case SymbolType.CINT:
        case SymbolType.UINT:
          return dim * 2;
        case SymbolType.STRUCT:
          return dim * tag.size;
        default:
          return dim;
      }
    };

    decl.members.forEach((member) => {
      let type = getSymbolType(member);
      const identity = member.pointer ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE;
      const dim = member.dim || 1;
      const size = type & SymbolType.CINT ? dim * 2 : dim;
      tag.members.push({
        name: member.name,
        identity,
        type,
        offset: tag.size,
        storage,
        struct_size: size,
        tagidx: -1,
      });
      if (identity == SymbolIdentity.POINTER) type = SymbolType.CINT;
      if (decl.atomicType == "struct") {
        tag.size += scaleSize(type, dim);
      } else {
        tag.size = Math.max(tag.size, scaleSize(type, dim));
      }
    });

    console.log("declare_struct", tag);

    this.tags.push(tag);
    return this.tags.length - 1;
  }
}
