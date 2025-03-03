import { expandTracedToNode, joinToNode } from "langium/generate";
import { FunctionDeclaration, isStructTypeReference, ParameterDeclaration } from "../language/generated/ast";
import { generator, Generator } from "./Generator";
import { compileBlock } from "./statements";
import { symbol_table, SymbolIdentity, SymbolStorage, SymbolTable, SymbolType } from "./SymbolTable";
import { tag_table } from "./TagTable";

const getParameterType = (param: ParameterDeclaration) => {
  if (isStructTypeReference(param.type)) {
    return SymbolType.STRUCT;
  } else {
    if (param.type.signed == "unsigned") {
      return param.type.type == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return param.type.type == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

export const compileFunctionDeclaration = (fun: FunctionDeclaration) => {
  let argstk = 0;
  generator.fexitlab = generator.get_label();

  const idx = symbol_table.find_global(fun.name);
  if (idx != -1) {
    if (symbol_table.symbols[idx].identity != SymbolIdentity.FUNCTION)
      throw Error(`Symbol ${fun.name} already exists in global symbol table and is not a function`);
    else if (symbol_table.symbols[idx].offset == SymbolIdentity.FUNCTION)
      throw Error(`Function ${fun.name} already exists in global symbol table`);
    else symbol_table.symbols[idx].offset = SymbolIdentity.FUNCTION; // function call before function declaration
  } else symbol_table.add_global(fun.name, SymbolIdentity.FUNCTION, SymbolType.CINT, SymbolIdentity.FUNCTION, SymbolStorage.PUBLIC);

  // generator.output_line(`${fun.name}:`, 0);

  symbol_table.local_table_index = SymbolTable.NUMBER_OF_GLOBALS;

  // do parameters
  // functions expect that the parameters have already been pushed on to the stack
  fun.parameters.forEach((param, i) => {
    // these checks are not actually necessary if the Ast is already valid
    if (symbol_table.find_local(param.name) > -1) throw Error(`parameter ${param.name} already exists in local symbol table`);

    const { index: argptr, lines } = symbol_table.add_local(
      param.name,
      param.pointer || param.array ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE,
      getParameterType(param),
      0,
      SymbolStorage.AUTO
    );
    argstk += Generator.INTSIZE;

    let ptr = symbol_table.local_table_index;
    if (param.type.type == "struct") {
      if (!param.pointer) throw Error(`only struct pointers allowed as function parameter`);
      let otag = tag_table.find(param.type.structName.$refText);
      if (otag == -1) throw Error(`${param.name} is not a declared struct`);
      symbol_table.symbols[argptr].tagidx = otag;
    }

    while (ptr != SymbolTable.NUMBER_OF_GLOBALS) {
      ptr = ptr - 1;
      symbol_table.symbols[ptr].offset += Generator.INTSIZE;
    }
  });

  // compileBlock(fun.body);
  // generator.gen_label(exitLabel);
  // generator.gen_modify_stack(0); // pop all the locals
  // generator.output_line("ret");

  const res = expandTracedToNode(fun)`
    ${fun.name}:
      ${compileBlock(fun.body)}
    $${generator.fexitlab}:
      ${joinToNode(generator.gen_modify_stack(0).lines, { appendNewLineIfNotEmpty: true })}
      ret
  `;

  generator.stkp = 0;
  symbol_table.local_table_index = SymbolTable.NUMBER_OF_GLOBALS; // effectively pop all local symbols

  return res;
};
