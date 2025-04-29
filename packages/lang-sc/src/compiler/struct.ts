import { MemberAccess, StructTypeDeclaration, StructTypeSpecifier } from "src/language/generated/ast";
import { CompilerRegs, ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";
import { getSymbolStorage, getSymbolType } from "./symbol";
import { ScCompiler } from "./sc-compiler";
import { compileSubExpression, FETCH, NL, rvalue } from "./expression";
import { joinToNode } from "langium/generate";

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
  find_member(tagName: string, memberName: string) {
    const tag = this.tags[this.find(tagName)];
    return tag.members.find((m) => m.name == memberName);
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

export function compileMemberExpression(scc: ScCompiler, memberExpr: MemberAccess) {
  const receiverRes = compileSubExpression(scc, memberExpr.receiver);
  if (receiverRes.lval.tagsym == 0) throw Error(`${memberExpr.receiver.$type} can't take member`);

  const member = scc.tag_table.find_member(receiverRes.lval.tagsym.name, memberExpr.memberName.$refText);
  if (!member) throw Error(`Cant find member ${memberExpr.memberName.$refText}`);

  if (receiverRes.reg & FETCH && memberExpr.operator == ".") {
    receiverRes.node = receiverRes.node.append(joinToNode(rvalue(scc, receiverRes), NL));
  }
  if (receiverRes.reg == CompilerRegs.DE_REG) {
    receiverRes.node = receiverRes.node.append(joinToNode(["xchg"], NL));
  }

  receiverRes.node = receiverRes.node.append(joinToNode(scc.generator.add_offset(member.offset), NL));

  const lval = receiverRes.lval;
  lval.symbol = member;
  lval.indirect = member.type; // lval is a *type
  lval.ptr_type = 0;
  lval.tagsym = 0;
  if (member.type == SymbolType.STRUCT) {
    lval.tagsym = scc.tag_table.tags[member.tagidx];
  }
  if (member.identity == SymbolIdentity.POINTER) {
    // int *x;
    lval.indirect = SymbolType.CINT;
    lval.ptr_type = member.type;
  }
  if (member.identity == SymbolIdentity.ARRAY || (member.type == SymbolType.STRUCT && member.identity == SymbolIdentity.VARIABLE)) {
    // int x[2];
    // struct S s;
    lval.ptr_type = member.type;
    receiverRes.reg = 0;
  } else {
    receiverRes.reg = CompilerRegs.HL_REG | FETCH;
  }

  return receiverRes;
}
