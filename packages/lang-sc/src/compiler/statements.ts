import {
  Block,
  InlineAssembly,
  isExpression,
  isInlineAssembly,
  isLocalVariableDeclaration,
  isReturnStatement,
  isStructTypeReference,
  LocalVariableDeclaration,
  LocalVarName,
  ReturnStatement,
  Statement,
} from "../language/generated/ast";
import { SymbolIdentity, SymbolStorage, SymbolType } from "./SymbolTable";
import { AsmGenerator } from "./Generator";
import { compileExpression, ExpressionResult } from "./expression";
import { CompositeGeneratorNode, expandTracedToNode, joinToNode, joinTracedToNode } from "langium/generate";
import { userPreferences } from "../language/sc-userpreferences";
import { ScCompiler } from "./sc-compiler";

const getVariableType = (v: LocalVariableDeclaration) => {
  if (v.type.type == "struct") {
    return SymbolType.STRUCT;
  } else {
    if (v.type.signed == "unsigned") {
      return v.type.type == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return v.type.type == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

export const compileBlock = (scc: ScCompiler, block: Block) => {
  // return expandTracedToNode(block)`
  //   ${joinTracedToNode(block, "statements")(
  //     block.statements.map((s) => compileStatement(s)),
  //     { appendNewLineIfNotEmpty: true }
  //   )}
  // `;
  return expandTracedToNode(block)`
    ${joinToNode(block.statements.map((s) => compileStatement(scc, s)))}
  `;
};

export const compileStatement = (scc: ScCompiler, statement: Statement): CompositeGeneratorNode => {
  switch (true) {
    case isLocalVariableDeclaration(statement):
      return compileLocalDeclaration(scc, statement);
    case isExpression(statement):
      return compileExpression(scc, statement).node!;
    case isReturnStatement(statement):
      return compileReturn(scc, statement);
    case isInlineAssembly(statement):
      return compileAssembly(scc, statement);
    default:
      console.error("Unimplemented statement ", statement);
  }
  throw Error();
};

const compileAssembly = (scc: ScCompiler, asm: InlineAssembly) => {
  return expandTracedToNode(asm)`
    ${asm.asm.slice(6, -7).trimStart()}
  `;
};

const compileLocalDeclaration = (scc: ScCompiler, decl: LocalVariableDeclaration) => {
  return expandTracedToNode(decl)`
    ${userPreferences.compiler.commentStatements ? `; ${decl.$cstNode!.text}` : undefined}
    ${joinTracedToNode(decl, "varNames")(
      decl.varNames.map((vn) => compileLocalVarName(scc, vn as LocalVarName, decl)),
      { appendNewLineIfNotEmpty: true }
    )}
  `;
};

const compileLocalVarName = (scc: ScCompiler, localVar: LocalVarName, decl: LocalVariableDeclaration) => {
  if (scc.symbol_table.find_local(localVar.name) != -1) throw Error(`${localVar.name} is already in local symbol table`);
  const typ = getVariableType(decl);

  let otag = -1;
  if (isStructTypeReference(decl.type)) {
    otag = scc.tag_table.find(decl.type.structName.$refText);
  }

  let j, k;
  j = localVar.pointer ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE;
  if (localVar.array) {
    k = localVar.dim || 0;
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
  let lines: string[];

  if (decl.type.storage != "static") {
    const { newstkp, lines: nonstaticLines } = scc.generator.gen_modify_stack(scc.generator.stkp - k);
    lines = nonstaticLines;
    // lines[0] += `\t\t\t\t${decl.type.type} ${localVar.name}`;
    scc.generator.stkp = newstkp;
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

const compileReturn = (scc: ScCompiler, ret: ReturnStatement) => {
  const exprNode = ret.value ? compileExpression(scc, ret.value).node : null;
  return expandTracedToNode(ret)`
    ${exprNode}
    jmp $${scc.generator.fexitlab}
  `;
};
