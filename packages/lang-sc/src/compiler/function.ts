import { expandToNode, expandTracedToNode, joinToNode } from "langium/generate";
import { FunctionDeclaration, GlobalVariableDeclaration } from "../language/generated/ast";
import { compileBlock } from "./statements";
import { getSymbolType, SymbolTable } from "./symbol";
import { ScCompiler } from "./sc-compiler";
import { AsmGenerator } from "./Generator";
import { SymbolType, SymbolIdentity, SymbolStorage } from "./interface";

export const compileFunctionDeclaration = (scc: ScCompiler, fun: FunctionDeclaration) => {
  let argstk = 0;
  scc.generator.fexitlab = scc.generator.get_label();

  const idx = scc.symbol_table.find_global(fun.name);
  if (idx != -1) {
    if (scc.symbol_table.symbols[idx].identity != SymbolIdentity.FUNCTION)
      throw Error(`Symbol ${fun.name} already exists in global symbol table and is not a function`);
    else if (scc.symbol_table.symbols[idx].offset == SymbolIdentity.FUNCTION)
      throw Error(`Function ${fun.name} already exists in global symbol table`);
    else scc.symbol_table.symbols[idx].offset = SymbolIdentity.FUNCTION; // function call before function declaration
  } else scc.symbol_table.add_global(fun.name, SymbolIdentity.FUNCTION, SymbolType.CINT, SymbolIdentity.FUNCTION, SymbolStorage.PUBLIC);

  // compiler.generator.output_line(`${fun.name}:`, 0);

  scc.symbol_table.local_table_index = SymbolTable.NUMBER_OF_GLOBALS;

  // do parameters
  // functions expect that the parameters have already been pushed on to the stack
  fun.parameters.forEach((param, i) => {
    // these checks are not actually necessary if the Ast is already valid
    if (scc.symbol_table.find_local(param.name) > -1) throw Error(`parameter ${param.name} already exists in local symbol table`);

    const { index: argptr, lines } = scc.symbol_table.add_local(
      param.name,
      param.pointer || param.array ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE,
      getSymbolType(param),
      0,
      SymbolStorage.AUTO
    );
    argstk += AsmGenerator.INTSIZE;

    let ptr = scc.symbol_table.local_table_index;
    if (param.typeSpecifier.atomicType == "struct") {
      if (!param.pointer) throw Error(`only struct pointers allowed as function parameter`);
      let otag = scc.tag_table.find(param.typeSpecifier.structName.$refText);
      if (otag == -1) throw Error(`${param.name} is not a declared struct`);
      scc.symbol_table.symbols[argptr].tagidx = otag;
    }

    while (ptr != SymbolTable.NUMBER_OF_GLOBALS) {
      ptr = ptr - 1;
      scc.symbol_table.symbols[ptr].offset += AsmGenerator.INTSIZE;
    }
  });

  // compileBlock(fun.body);
  // compiler.generator.gen_label(exitLabel);
  // compiler.generator.gen_modify_stack(0); // pop all the locals
  // compiler.generator.output_line("ret");

  const res = expandTracedToNode(fun)`
    ${expandToNode`${fun.name}:${fun.extern ? ":" : ""}`}
    ${compileBlock(scc, fun.body)}
    $${scc.generator.fexitlab}:
      ${joinToNode(scc.generator.gen_modify_stack(0), { appendNewLineIfNotEmpty: true })}
      ret
  `;

  scc.generator.stkp = 0;
  scc.symbol_table.local_table_index = SymbolTable.NUMBER_OF_GLOBALS; // effectively pop all local symbols

  return res;
};
