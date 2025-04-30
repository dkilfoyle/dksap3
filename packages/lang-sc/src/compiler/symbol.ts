import {
  GlobalVariableDeclaration,
  GlobalVarName,
  isArraySpecifier,
  isCharExpression,
  isNumberExpression,
  isStringExpression,
  isStructTypeDeclaration,
  isStructTypeSpecifier,
  LiteralExpression,
  LocalVariableDeclaration,
  LocalVarName,
  ParameterDeclaration,
  StructMember,
} from "../language/generated/ast";
import { AsmGenerator } from "./Generator";
import { ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";
import { scCompiler, ScCompiler } from "./sc-compiler";
import { expandTracedToNode, joinTracedToNode, joinToNode } from "langium/generate";
import { ITagSymbol } from "./struct";

export class SymbolTable {
  public static NUMBER_OF_GLOBALS = 100;
  public static NUMBER_OF_LOCALS = 20;
  public symbols: ISymbol[] = [];
  public global_table_index = 0;
  public local_table_index = SymbolTable.NUMBER_OF_GLOBALS;

  // public current_symbol_table_index = 0;

  constructor(public generator: AsmGenerator) {}

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
      lines.push(...this.generator.data_segment_gdata());
      const k = this.generator.get_label();
      lines.push(...this.generator.gen_label(k));
      lines.push(".ds\t${offset}");
      lines.push(...this.generator.code_segment_gtext());
      offset = k;
    }

    this.symbols[this.local_table_index] = {
      name,
      identity,
      type,
      offset,
      storage,
      tagidx: -1,
      struct_size: 0,
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
      tagidx: -1,
      struct_size: 0,
    };
    return this.global_table_index - 1;
  }
}

interface ISymbolInitial {
  name: string;
  type: number;
  dim: number;
  data_len: number;
  data_start: number;
}

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
    }
    this.initials[name].dim += 1;
  }

  get_item_at(name: string, position: number, tag: 0 | ITagSymbol) {
    const sym = this.initials[name];
    if (!sym) throw Error("get_item_at no symbol");
    if (sym.type & SymbolType.CCHAR) {
      return this.data[sym.data_start + position];
    } else if (sym.type & SymbolType.CINT) {
      return (this.data[sym.data_start + position * 2] << 8) + this.data[sym.data_start + position * 2 + 1];
    } else if (sym.type == SymbolType.STRUCT) {
      throw Error("get_item_at not implemened for structs yet");
    }
  }
}
export const getSymbolType = (v: LocalVariableDeclaration | GlobalVariableDeclaration | ParameterDeclaration | StructMember) => {
  if (isStructTypeSpecifier(v.typeSpecifier)) {
    return SymbolType.STRUCT;
  } else {
    if (v.typeSpecifier.signed == "unsigned") {
      return v.typeSpecifier.atomicType == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return v.typeSpecifier.atomicType == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

export const getSymbolStorage = (v: LocalVariableDeclaration | GlobalVariableDeclaration) => {
  switch (v.storage) {
    case "auto":
      return SymbolStorage.AUTO;
    case "extern":
      return SymbolStorage.EXTERN;
    case "register":
      return SymbolStorage.AUTO;
    case "static":
      return SymbolStorage.STATIC;
    default:
      return SymbolStorage.AUTO;
  }
};

export const compileGlobalVariableDeclaration = (scc: ScCompiler, decl: GlobalVariableDeclaration) => {
  const atomicType = getSymbolType(decl);

  const initials = (gvn: GlobalVarName, identity: SymbolIdentity, dim: number, otag: number) => {
    const initLiteral = (name: string, lit: LiteralExpression, otag: ITagSymbol | 0, member_index?: number) => {
      if (isNumberExpression(lit)) {
        scc.initials_table.add_initial(name, SymbolType.CINT, lit.value, otag, member_index);
      } else if (isCharExpression(lit)) {
        scc.initials_table.add_initial(name, SymbolType.CCHAR, lit.value.charCodeAt(0), otag, member_index);
      } else if (isStringExpression(lit)) {
        if (identity == SymbolIdentity.VARIABLE || !(atomicType & SymbolType.CCHAR)) throw Error("must assign to char pointer or char array"); // TODO: add validation check - maybe typir
        lit.value.split("").forEach((x) => {
          const xcode = x.charCodeAt(0);
          scc.litq.push(xcode);
          scc.initials_table.add_initial(name, SymbolType.CCHAR, xcode, otag, member_index);
        });
        scc.litq.push(0); // 0 terminated
        scc.initials_table.add_initial(name, SymbolType.CCHAR, 0, otag, member_index);
      }
    };

    if (gvn.initials) {
      // int x = 1;
      // int x[] = {1,2,3}
      // int x[3] = {1,2,3}
      // struct S s = {1,"c"}

      if ((identity == SymbolIdentity.POINTER || identity == SymbolIdentity.VARIABLE) && atomicType == SymbolType.STRUCT) {
        const dim = 0;
        const tag = scc.tag_table.tags[otag];
        tag.members.forEach((member, i) => {
          initLiteral(tag.name, gvn.initials!.values[i], tag, i);
        });

        // struct init
        throw Error("Not implemented");
      } else {
        // there is an initial assignment
        // eg int x[] = {1,2,3}
        // eg int x[3] = {1,2,3}
        // eg int x[5] = {1,2,3} = pads to {1,2,3,0,0}
        // marked as invalid:
        // int x[];
        // int x[0];
        // int x[2] = {1,2,3};
        gvn.initials.values.forEach((i) => {
          initLiteral(gvn.name, i, 0);
        });
      }
    }
    return identity;
  };

  const storage = getSymbolStorage(decl);
  let otag = -1;
  if (isStructTypeSpecifier(decl.typeSpecifier)) {
    if (isStructTypeDeclaration(decl.typeSpecifier)) otag = scc.tag_table.define_struct(decl.typeSpecifier, storage);
    else {
      otag = scc.tag_table.find(decl.typeSpecifier.structTypeName.$refText);
      if (otag == -1) throw Error("otag not found"); // this shouldn't happen
    }
  }

  decl.varNames.forEach((vn) => {
    const gvn = vn as GlobalVarName;
    let dim = 1;
    let identity = gvn.pointer ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE;
    if (isArraySpecifier(gvn.arraySpecifier)) {
      identity = SymbolIdentity.ARRAY;
      dim = gvn.arraySpecifier.dim || -1;
    }

    // int x;
    // int x = 10;
    // int x[3] = {1,2,3};
    // extern int x;
    identity = initials(gvn, identity, dim, otag);
    const glbl = scc.symbol_table.add_global(gvn.name, identity, atomicType, dim, storage);
    if (decl.typeSpecifier.atomicType == "struct") {
      scc.symbol_table.symbols[glbl].tagidx = otag;
    }
  });
};

export const compileLocalDeclaration = (scc: ScCompiler, decl: LocalVariableDeclaration) => {
  // ${userPreferences.compiler.commentStatements ? `; ${decl.$cstNode!.text}` : undefined}
  return expandTracedToNode(decl)`  ; ${decl.$cstNode!.text.split("\n")[0]}
  ${joinTracedToNode(decl, "varNames")(
    decl.varNames.map((vn) => compileLocalVarName(scc, vn as LocalVarName, decl)),
    { appendNewLineIfNotEmpty: true }
  )}`;
};

const compileLocalVarName = (scc: ScCompiler, localVar: LocalVarName, decl: LocalVariableDeclaration) => {
  if (scc.symbol_table.find_local(localVar.name) != -1) throw Error(`${localVar.name} is already in local symbol table`);
  const typ = getSymbolType(decl);
  const storage = getSymbolStorage(decl);

  let otag = -1;
  if (isStructTypeSpecifier(decl.typeSpecifier)) {
    otag = isStructTypeDeclaration(decl.typeSpecifier)
      ? scc.tag_table.define_struct(decl.typeSpecifier, storage)
      : scc.tag_table.find(decl.typeSpecifier.structTypeName.$refText);
  }

  let j, k;
  j = localVar.pointer ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE;
  if (localVar.arraySpecifier) {
    k = localVar.arraySpecifier.dim || 0;
    if (k) {
      // [dim]
      j = SymbolIdentity.ARRAY;
      if (typ & SymbolType.CINT) {
        k = k * AsmGenerator.INTSIZE;
      } else if (typ == SymbolType.STRUCT) {
        k = k * scc.tag_table.tags[otag].size;
      }
    } else {
      // []
      j = SymbolIdentity.POINTER;
      k = AsmGenerator.INTSIZE;
    }
  } else {
    // not array
    if (j == SymbolIdentity.POINTER) {
      k = AsmGenerator.INTSIZE;
    } else {
      switch (typ) {
        case SymbolType.CCHAR:
        case SymbolType.UCHAR:
          k = 1;
          break;
        case SymbolType.STRUCT:
          k = scc.tag_table.tags[otag].size;
          break;
        default:
          k = AsmGenerator.INTSIZE;
      }
    }
  }
  let lines: string[] = [];

  if (decl.storage != "static") {
    if (isStructTypeDeclaration(decl.typeSpecifier)) {
      const names = decl.typeSpecifier.members.map((m) => `${localVar.name}.${m.name}`).reverse();
      lines.push(...scc.generator.gen_modify_stack(scc.generator.stkp - k, names));
    } else lines.push(...scc.generator.gen_modify_stack(scc.generator.stkp - k, `${localVar.name}`));
    // lines[0] += `\t\t\t\t${decl.type.type} ${localVar.name}`;
    const { index: current_symbol_table_idx } = scc.symbol_table.add_local(localVar.name, j, typ, scc.generator.stkp, SymbolStorage.AUTO);
    if (typ == SymbolType.STRUCT) {
      scc.symbol_table.symbols[current_symbol_table_idx].tagidx = otag;
    }
  } else {
    /* local structs need their tagidx set */
    const { index: current_symbol_table_idx, lines: staticLines } = scc.symbol_table.add_local(localVar.name, j, typ, k, SymbolStorage.LSTATIC);
    lines = staticLines;
    if (typ == SymbolType.STRUCT) {
      scc.symbol_table.symbols[current_symbol_table_idx].tagidx = otag;
    }
  }
  return expandTracedToNode(localVar)`
    ${joinToNode(lines, { appendNewLineIfNotEmpty: true })}
  `;
};
