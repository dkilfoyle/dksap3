import {
  Block,
  BreakStatement,
  IfStatement,
  InlineAssembly,
  isBinaryExpression,
  isBreakStatement,
  isDoStatement,
  isExpression,
  isForStatement,
  isIfStatement,
  isInlineAssembly,
  isLocalVariableDeclaration,
  isReturnStatement,
  isStructTypeReference,
  isWhileStatement,
  LocalVariableDeclaration,
  LocalVarName,
  ReturnStatement,
  Statement,
} from "../language/generated/ast";
import { AsmGenerator } from "./Generator";
import { compileExpression, ExpressionResult } from "./expression";
import { CompositeGeneratorNode, expandTracedToNode, expandTracedToNodeIf, JoinOptions, joinToNode, joinTracedToNode } from "langium/generate";
import { userPreferences } from "../language/sc-userpreferences";
import { ScCompiler } from "./sc-compiler";
import { compileDo, compileFor, compileWhile } from "./while";
import { SymbolIdentity, SymbolStorage, SymbolType } from "./interface";

const getVariableType = (v: LocalVariableDeclaration) => {
  if (v.type.type == "struct") {
    return SymbolType.STRUCT;
  } else {
    if (v.type.signed == "unsigned") {
      return v.type.type == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return v.type.type == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

const NL: JoinOptions<string> = { appendNewLineIfNotEmpty: true };

export const compileBlock = (scc: ScCompiler, block: Block) => {
  // return expandTracedToNode(block)`
  //   ${joinTracedToNode(block, "statements")(
  //     block.statements.map((s) => compileStatement(s)),
  //     { appendNewLineIfNotEmpty: true }
  //   )}
  // `;
  return expandTracedToNode(block)`${joinToNode(block.statements.map((s) => compileStatement(scc, s)))}`;
};

export const compileStatement = (scc: ScCompiler, statement: Statement): CompositeGeneratorNode => {
  switch (true) {
    case isLocalVariableDeclaration(statement):
      return compileLocalDeclaration(scc, statement);
    case isExpression(statement):
      return compileExpression(scc, statement, !isBinaryExpression(statement)).node!;
    case isReturnStatement(statement):
      return compileReturn(scc, statement);
    case isInlineAssembly(statement):
      return compileAssembly(scc, statement);
    case isWhileStatement(statement):
      return compileWhile(scc, statement);
    case isDoStatement(statement):
      return compileDo(scc, statement);
    case isForStatement(statement):
      return compileFor(scc, statement);
    case isBreakStatement(statement):
      return compileBreak(scc, statement);
    case isIfStatement(statement):
      return compileIf(scc, statement);
    default:
      console.error("Unimplemented statement ", statement);
  }
  throw Error();
};

const compileBreak = (scc: ScCompiler, stmt: BreakStatement) => {
  const ptr = scc.while_table.readWhile();
  return expandTracedToNode(stmt)`  ; break
  ${joinToNode(scc.generator.gen_modify_stack(ptr.stack_pointer), NL)}
  jmp ${ptr.exit_label}
  `;
};

const compileAssembly = (scc: ScCompiler, asm: InlineAssembly) => {
  return expandTracedToNode(asm)` ; inline asm start
  ${asm.asm.slice(6, -7).trimStart().trimEnd()}
  ; inline asm end`;
};

const compileLocalDeclaration = (scc: ScCompiler, decl: LocalVariableDeclaration) => {
  // ${userPreferences.compiler.commentStatements ? `; ${decl.$cstNode!.text}` : undefined}
  return expandTracedToNode(decl)`  ; ${decl.$cstNode!.text}
  ${joinTracedToNode(decl, "varNames")(
    decl.varNames.map((vn) => compileLocalVarName(scc, vn as LocalVarName, decl)),
    { appendNewLineIfNotEmpty: true }
  )}`;
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
    const nonstaticLines = scc.generator.gen_modify_stack(scc.generator.stkp - k, `${localVar.name}`);
    lines = nonstaticLines;
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

const compileReturn = (scc: ScCompiler, ret: ReturnStatement) => {
  const exprNode = ret.value ? compileExpression(scc, ret.value).node : null;
  return expandTracedToNode(ret)`  ; return ${ret.value?.$cstNode?.text}
  ${exprNode}
  jmp $${scc.generator.fexitlab}`;
};

const compileIf = (scc: ScCompiler, ifstat: IfStatement) => {
  const fstkp = scc.generator.stkp;
  const flex = scc.symbol_table.local_table_index;
  const flab = scc.generator.get_label();

  const block = (b: Block) => {
    return expandTracedToNode(b)`
      ${compileBlock(scc, b)}
      ${joinToNode(scc.generator.gen_modify_stack(fstkp), NL)}
      ${(function () {
        scc.symbol_table.local_table_index = flex;
        return undefined;
      })()}
    `;
  };

  if (!ifstat.elseBlock) {
    // if only
    return expandTracedToNode(ifstat)`
        ; i${flab} ${ifstat.condition.$cstNode?.text}
        ${compileExpression(scc, ifstat.condition).node}
        ; if false jump to end
        ${joinToNode(scc.generator.gen_test_jump(`$i${flab}_end`, 0), NL)}
        ; if true block
      ${block(ifstat.block)}
      $i${flab}_end:
    `.appendNewLine();
  } else {
    // if else
    return expandTracedToNode(ifstat)`
        ; i${flab} ${ifstat.condition.$cstNode?.text}
        ${compileExpression(scc, ifstat.condition).node}
        ; if false jump to else
        ${joinToNode(scc.generator.gen_test_jump(`$i${flab}_else`, 0), NL)}
        ; if true block
      ${block(ifstat.block)}
        jmp $i${flab}_end
      $i${flab}_else:
      ${block(ifstat.elseBlock)}
      $i${flab}_end:
  `.appendNewLine();
  }
};
