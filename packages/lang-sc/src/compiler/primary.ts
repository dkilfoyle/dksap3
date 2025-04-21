import {
  CharExpression,
  Expression,
  FunctionDeclaration,
  GlobalVarName,
  isFunctionDeclaration,
  isGlobalVarName,
  isLocalVarName,
  isParameterDeclaration,
  isPrimitiveTypeReference,
  isSizeofSymbol,
  isStructTypeReference,
  LocalVarName,
  NumberExpression,
  ParameterDeclaration,
  SizeofExpression,
  StringExpression,
  SymbolExpression,
} from "../language/generated/ast";

import { AsmGenerator } from "./Generator";
import { CompilerRegs, ILValue, ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";
import { expandToNode, expandTracedToNode, joinToNode, joinTracedToNode } from "langium/generate";
import { ScCompiler } from "./sc-compiler";
import { ExpressionResult, leafNode, AstNodeError, rvalue, compileExpression, FETCH, NL } from "./expression";
import { compilePostfix } from "./unary";

export function compileNumberExpression(scc: ScCompiler, numexp: NumberExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const lines = scc.generator.gen_immediate(numexp.value);
  return { reg: 0, lval, node: leafNode(numexp, lines) };
}

export function compileStringExpression(scc: ScCompiler, strexp: StringExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const pos = scc.litq.length;
  scc.litq.push(...strexp.value.split("").map((x) => x.charCodeAt(0)));
  scc.litq.push(0); // 0 terminated
  // load h with the address of str[0]
  const lines = [`lxi h, $${scc.litlab}+${pos}`];
  return { reg: 0, lval, node: leafNode(strexp, lines) };
}

export function compileCharExpression(scc: ScCompiler, charexp: CharExpression): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  const lines = [`lxi h, ${charexp.value.charCodeAt(1)}`];
  return { reg: 0, lval, node: leafNode(charexp, lines) };
}

export function compileSymbolExpression(scc: ScCompiler, symbolExpression: SymbolExpression): ExpressionResult {
  const ref = symbolExpression.element.ref;
  let res: ExpressionResult;
  switch (true) {
    case isFunctionDeclaration(ref):
      res = compileFunctionReference(scc, symbolExpression);
      break;
    case isLocalVarName(ref):
    case isParameterDeclaration(ref):
      res = compileLocalVariableReference(scc, ref);
      if (symbolExpression.indexExpression) res = compileArrayIndex(scc, res, symbolExpression.indexExpression);
      if (symbolExpression.postfix) res = compilePostfix(scc, res, symbolExpression);

      break;
    case isGlobalVarName(ref):
      res = compileGlobalVariableReference(scc, ref);
      if (symbolExpression.indexExpression) res = compileArrayIndex(scc, res, symbolExpression.indexExpression);
      if (symbolExpression.postfix) res = compilePostfix(scc, res, symbolExpression);

      break;
    // case isStructReference(symbolExpression):
    //   return compileStructReference(symbolExpression);
    // case isStructMemberReference(symbolExpression):
    //   return compileStructMemberReference(symbolExpression);
    default:
      throw new AstNodeError(symbolExpression, "Trying to compile unknown symbol expression");
  }
  if (symbolExpression.functionCall) return compileFunctionCall(scc, res, symbolExpression);
  return res;
}

export function compileArrayIndex(scc: ScCompiler, symbolRes: ExpressionResult, indexExpression: Expression): ExpressionResult {
  let ptr = symbolRes.lval.symbol;
  if (ptr == 0) throw Error("Can't index non-symbol");
  if (!(ptr.identity == SymbolIdentity.POINTER || ptr.identity == SymbolIdentity.ARRAY)) throw Error("Can only index a pointer or array");
  const node = expandTracedToNode(indexExpression)`
    ${symbolRes.node}
    ; [${indexExpression.$cstNode!.text}]
    ${ptr.identity == SymbolIdentity.POINTER ? joinToNode(rvalue(scc, symbolRes), NL) : undefined}
    ${joinToNode(scc.generator.gen_push(symbolRes.reg, (symbolRes.lval.symbol as ISymbol).name))}
    ${compileExpression(scc, indexExpression).node}
    ${joinToNode(scc.generator.gen_multiply(ptr.type, ptr.type == SymbolType.STRUCT ? scc.tag_table.tags[ptr.tagidx!].size : 1), NL)}
    ${joinToNode(scc.generator.gen_add(), NL)}
  `;
  symbolRes.lval.indirect = ptr.type;
  symbolRes.lval.ptr_type = 0;
  return { lval: symbolRes.lval, reg: CompilerRegs.HL_REG | FETCH, node };
}

export function compileFunctionCall(scc: ScCompiler, symbolRes: ExpressionResult, symbolExpression: SymbolExpression): ExpressionResult {
  let ptr = symbolRes.lval.symbol;
  // const node = symbolRes.node;
  const functionCall = symbolExpression.functionCall!;

  if (!isFunctionDeclaration(symbolExpression.element.ref)) throw Error("function call expression element.ref is not function declaration");

  const node = expandToNode`
    ; ${symbolExpression.$cstNode?.text}
    ${symbolRes.node}
    ${
      ptr != 0 && ptr.identity != SymbolIdentity.FUNCTION
        ? joinToNode(
            (() => {
              const lines = rvalue(scc, symbolRes);
              ptr = 0;
              lines.unshift("; function symbol is a pointer to a function ");
              return lines;
            })(),
            NL
          )
        : undefined
    }
    ${ptr == 0 ? joinToNode(scc.generator.gen_push(CompilerRegs.HL_REG, "retaddr"), NL) : undefined}
    ${joinTracedToNode(
      functionCall,
      "arguments"
    )(
      functionCall.arguments.map((arg, i) => {
        const funcdecl = symbolExpression.element.ref as FunctionDeclaration;
        const param = funcdecl.parameters[i].name;
        const argexpr = compileExpression(scc, arg);
        return argexpr.node
          .appendIf(ptr == 0, "xthl")
          .appendNewLineIfNotEmpty()
          .append(joinToNode(scc.generator.gen_push(CompilerRegs.HL_REG, `par ${param}`), NL));
      })
    )}
    ${
      ptr != 0
        ? joinToNode(scc.generator.gen_call((symbolRes.lval.symbol as ISymbol).name), NL)
        : joinToNode(["; callstk", ...scc.generator.callstk()], NL)
    }
    ${joinToNode(scc.generator.gen_modify_stack(scc.generator.stkp + functionCall.arguments.length * AsmGenerator.INTSIZE), NL)}
  `;

  return { reg: 0, lval: { ...symbolRes.lval, symbol: 0 }, node };
}

export function compileFunctionReference(scc: ScCompiler, funcCall: SymbolExpression): ExpressionResult {
  // add to global symbol table if not already there
  // Use offset 0 so that if function call occurs before function declaration this can be detected in function declaration
  const sym_idx = scc.symbol_table.add_global(funcCall.element.ref!.name, SymbolIdentity.FUNCTION, SymbolType.CINT, 0, SymbolStorage.PUBLIC);
  if (sym_idx < 0) throw Error();
  const symbol = scc.symbol_table.symbols[sym_idx];
  const lval: ILValue = { symbol: symbol, indirect: 0, ptr_type: 0, tagsym: 0 };
  return { reg: 0, lval, node: expandTracedToNode(funcCall)`` };

  // const args = funcCall.arguments.map((e) => compileExpression(e));
}

export function compileLocalVariableReference(scc: ScCompiler, localVar: LocalVarName | ParameterDeclaration): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };
  let sym_idx;
  if ((sym_idx = scc.symbol_table.find_local(localVar.name)) > -1) {
    const symbol = scc.symbol_table.symbols[sym_idx];

    const { reg, lines } = scc.generator.gen_get_locale(symbol); // hl = &local
    // lxi h, stack offset of symbol
    // dap sp ; hl = &symbol

    const node = expandTracedToNode(localVar)`
      ; ${localVar.name}
      ${joinToNode(lines, { appendNewLineIfNotEmpty: true })}
    `;

    lval.symbol = symbol;
    lval.indirect = symbol.type;
    // memberCall returns &symbol

    if (symbol.type == SymbolType.STRUCT) {
      lval.tagsym = scc.tag_table.tags[symbol.tagidx!];
    }
    if (symbol.identity == SymbolIdentity.ARRAY || (symbol.identity == SymbolIdentity.VARIABLE && symbol.type == SymbolType.STRUCT)) {
      lval.ptr_type = symbol.type;
      return { reg, lval, node };
    }
    if (symbol.identity == SymbolIdentity.POINTER) {
      lval.indirect = SymbolType.CINT;
      lval.ptr_type = symbol.type;
    }

    return { reg: 1 | reg, lval, node };
  } else throw new AstNodeError(localVar, `${localVar.name} not in local symbol table`);
}

export function compileGlobalVariableReference(scc: ScCompiler, globalVar: GlobalVarName): ExpressionResult {
  const lval: ILValue = { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 };

  let sym_idx;
  if ((sym_idx = scc.symbol_table.find_global(globalVar.name)) > -1) {
    const symbol = scc.symbol_table.symbols[sym_idx];
    if (symbol.identity != SymbolIdentity.FUNCTION) {
      lval.symbol = symbol;
      lval.indirect = 0;
      if (symbol.type == SymbolType.STRUCT) {
        lval.tagsym = scc.tag_table.tags[symbol.tagidx!];
      }
      if (symbol.identity != SymbolIdentity.ARRAY && (symbol.identity != SymbolIdentity.VARIABLE || symbol.type != SymbolType.STRUCT)) {
        if (symbol.identity == SymbolIdentity.POINTER) {
          lval.ptr_type = symbol.type;
        }
        const node = expandTracedToNode(globalVar)``;
        return { reg: 1 | CompilerRegs.HL_REG, lval, node };
      }
      const node = expandTracedToNode(globalVar)`
          ${joinToNode(scc.generator.gen_immediate(symbol.name))}
        `;

      lval.indirect = symbol.type;
      lval.ptr_type = symbol.type;
      return { reg: 0, lval, node };
    }
  }
  throw new AstNodeError(globalVar, `${globalVar.name} not in global symbol table`);
}

export function compileSizeofExpression(scc: ScCompiler, sizeexp: SizeofExpression): ExpressionResult {
  let size: number = 0;
  if (isSizeofSymbol(sizeexp.arg)) {
    const symbol_table_idx = isGlobalVarName(sizeexp.arg)
      ? scc.symbol_table.find_global(sizeexp.arg.name)
      : scc.symbol_table.find_local(sizeexp.arg.name);
    if (symbol_table_idx == -1) throw Error("sizeof unable to find symbol");
    const sym = scc.symbol_table.symbols[symbol_table_idx];
    if (sym.storage == SymbolStorage.LSTATIC) throw Error("sizeof local static");
    size = sym.offset; // FIXME: This is bug? offset for nonstatics is stk offset not size, should ISymbol have a precomputed size?
    if (sym.type & SymbolType.CINT || sym.identity == SymbolIdentity.POINTER) size *= AsmGenerator.INTSIZE;
    else if (sym.type == SymbolType.STRUCT) size *= scc.tag_table.tags[sym.tagidx!].size;
  } else {
    if (sizeexp.arg.pointer) {
      size = AsmGenerator.INTSIZE;
    } else {
      if (isPrimitiveTypeReference(sizeexp.arg)) {
        size = sizeexp.arg.type == "int" ? AsmGenerator.INTSIZE : 1;
      } else if (isStructTypeReference(sizeexp.arg)) {
        const otag = scc.tag_table.find(sizeexp.arg.structName.$refText);
        if (!otag) throw Error("sizeof unable to find struct in table");
        size = scc.tag_table.tags[otag].size;
      }
    }
  }
  const node = expandTracedToNode(sizeexp)`
    ; ${sizeexp.$cstNode?.text}
    ${joinToNode(scc.generator.gen_immediate(size), NL)}

  `;
  return { lval: { symbol: 0, indirect: 0, ptr_type: 0, tagsym: 0 }, reg: 0, node };
}
