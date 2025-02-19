import { Block, isExpression, isStructTypeReference, isVariableDeclaration, Statement, VariableDeclaration } from "../language/generated/ast";
import { symbol_table, SymbolIdentity, SymbolStorage, SymbolType } from "./SymbolTable";
import { generator, Generator } from "./Generator";
import { tag_table } from "./TagTable";
import { compileExpression } from "./expression";

const getVariableType = (v: VariableDeclaration) => {
  if (v.type.type == "struct") {
    return SymbolType.STRUCT;
  } else {
    if (v.type.signed == "unsigned") {
      return v.type.type == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return v.type.type == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

export const compileBlock = (block: Block) => {
  block.statements.forEach((s) => compileStatement(s));
};

export const compileStatement = (statement: Statement) => {
  switch (true) {
    case isVariableDeclaration(statement):
      compileDeclaration(statement);
      break;
    case isExpression(statement):
      compileExpression(statement);
      break;
    default:
      console.error("Unimplemented statement ", statement);
  }
};

export const compileDeclaration = (decl: VariableDeclaration) => {
  if (symbol_table.find_local(decl.name) != -1) throw Error(`${decl.name} is already in local symbol table`);
  const typ = getVariableType(decl);

  let otag = -1;
  if (isStructTypeReference(decl.type)) {
    otag = tag_table.find(decl.type.structName.$refText);
  }

  let j, k;
  j = decl.pointer ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE;
  if (decl.array) {
    k = decl.array.dim || 0;
    if (k) {
      // [dim]
      j = SymbolIdentity.ARRAY;
      if (typ & SymbolType.CINT) {
        k = k * Generator.INTSIZE;
      } else if (typ == SymbolType.STRUCT) {
        k = k * tag_table.tags[otag].size;
      }
    } else {
      // []
      j = SymbolIdentity.POINTER;
      k = Generator.INTSIZE;
    }
  } else {
    // not array
    if (j == SymbolIdentity.POINTER) {
      k = Generator.INTSIZE;
    } else {
      switch (typ) {
        case SymbolType.CCHAR:
        case SymbolType.UCHAR:
          k = 1;
          break;
        case SymbolType.STRUCT:
          k = tag_table.tags[otag].size;
          break;
        default:
          k = Generator.INTSIZE;
      }
    }
  }
  if (decl.type.storage != "static") {
    generator.stkp = generator.gen_modify_stack(generator.stkp - k);
    const current_symbol_table_idx = symbol_table.add_local(decl.name, j, typ, generator.stkp, SymbolStorage.AUTO);
    if (typ == SymbolType.STRUCT) {
      symbol_table.symbols[current_symbol_table_idx].tagidx = otag;
    }
  } else {
    /* local structs need their tagidx set */
    const current_symbol_table_idx = symbol_table.add_local(decl.name, j, typ, k, SymbolStorage.LSTATIC);
    if (typ == SymbolType.STRUCT) {
      symbol_table.symbols[current_symbol_table_idx].tagidx = otag;
    }
  }
};
