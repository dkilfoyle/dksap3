import {
  Block,
  isExpression,
  isLocalVariableDeclaration,
  isStructTypeReference,
  LocalVariableDeclaration,
  LocalVarName,
  Statement,
} from "../language/generated/ast";
import { symbol_table, SymbolIdentity, SymbolStorage, SymbolType } from "./SymbolTable";
import { generator, Generator } from "./Generator";
import { tag_table } from "./TagTable";
import { compileExpression } from "./expression";
import { expandTracedToNode, joinToNode, joinTracedToNode } from "langium/generate";

const getVariableType = (v: LocalVariableDeclaration) => {
  if (v.type.type == "struct") {
    return SymbolType.STRUCT;
  } else {
    if (v.type.signed == "unsigned") {
      return v.type.type == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return v.type.type == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

export const compileBlock = (block: Block) => {
  return expandTracedToNode(block)`
    ${joinTracedToNode(block, "statements")(
      block.statements.map((s) => compileStatement(s)),
      { appendNewLineIfNotEmpty: true }
    )}
  `;
};

export const compileStatement = (statement: Statement) => {
  switch (true) {
    case isLocalVariableDeclaration(statement):
      return compileLocalDeclaration(statement);
    case isExpression(statement):
    // return compileExpression(statement);
    default:
      console.error("Unimplemented statement ", statement);
  }
};

const compileLocalDeclaration = (decl: LocalVariableDeclaration) => {
  return expandTracedToNode(decl)`
    ${joinTracedToNode(decl, "varNames")(
      decl.varNames.map((vn) => compileLocalVarName(vn as LocalVarName, decl)),
      { appendNewLineIfNotEmpty: true }
    )}
  `;
};

const compileLocalVarName = (localVar: LocalVarName, decl: LocalVariableDeclaration) => {
  if (symbol_table.find_local(localVar.name) != -1) throw Error(`${localVar.name} is already in local symbol table`);
  const typ = getVariableType(decl);

  let otag = -1;
  if (isStructTypeReference(decl.type)) {
    otag = tag_table.find(decl.type.structName.$refText);
  }

  let j, k;
  j = localVar.pointer ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE;
  if (localVar.array) {
    k = localVar.dim || 0;
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
  let lines: string[];

  if (decl.type.storage != "static") {
    const { newstkp, lines: nonstaticLines } = generator.gen_modify_stack(generator.stkp - k);
    lines = nonstaticLines;
    generator.stkp = newstkp;
    const { index: current_symbol_table_idx } = symbol_table.add_local(localVar.name, j, typ, generator.stkp, SymbolStorage.AUTO);
    if (typ == SymbolType.STRUCT) {
      symbol_table.symbols[current_symbol_table_idx].tagidx = otag;
    }
  } else {
    /* local structs need their tagidx set */
    const { index: current_symbol_table_idx, lines: staticLines } = symbol_table.add_local(localVar.name, j, typ, k, SymbolStorage.LSTATIC);
    lines = staticLines;
    if (typ == SymbolType.STRUCT) {
      symbol_table.symbols[current_symbol_table_idx].tagidx = otag;
    }
  }
  return expandTracedToNode(localVar)`
    ; declare local ${decl.type.$cstNode!.text} ${localVar.name}
    ${joinToNode(lines, { appendNewLineIfNotEmpty: true })}
  `;
};
