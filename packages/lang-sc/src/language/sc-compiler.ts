import { AstNode, AstUtils } from "langium";
import { FunctionDeclaration, isFunctionDeclaration, isProgram, isStructTypeReference, Parameter } from "./generated/ast";
import { INTSIZE, ISymbol, SymbolIdentity, SymbolStorage, SymbolType, asm, gen_header, gen_line, gen_modify_stack } from "./sc-codegen";

let labelCount = 0;
const getLabel = () => {
  return "$" + labelCount++;
};

let argstk = 0;
const symbolTable: Record<string, ISymbol> = {};

const typeLookup = {
  "signed char": SymbolType.CCHAR,
  "unsigned char": SymbolType.UCHAR,
  char: SymbolType.CCHAR,
  "signed int": SymbolType.CINT,
  "unsigned int": SymbolType.UINT,
  int: SymbolType.CINT,
};

const getParameterType = (param: Parameter) => {
  if (isStructTypeReference(param.type)) {
    return SymbolType.STRUCT;
  } else {
    if (param.type.signed == "unsigned") {
      return param.type.type == "char" ? SymbolType.UCHAR : SymbolType.UINT;
    } else return param.type.type == "char" ? SymbolType.CCHAR : SymbolType.CINT;
  }
};

const compileFunctionDeclaration = (fun: FunctionDeclaration) => {
  argstk = 0;
  const exitLabel = getLabel();

  symbolTable[fun.name] = {
    name: fun.name,
    identity: SymbolIdentity.FUNCTION,
    type: SymbolType.CINT,
    offset: SymbolIdentity.FUNCTION,
    storage: SymbolStorage.PUBLIC,
  };

  gen_line(`${fun.name}:`);

  // do parameters
  fun.parameters.forEach((param, i) => {
    symbolTable[param.name] = {
      name: param.name,
      identity: param.pointer || param.array ? SymbolIdentity.POINTER : SymbolIdentity.VARIABLE,
      type: getParameterType(param),
      offset: i * INTSIZE, // TODO is this right
      storage: SymbolStorage.AUTO,
      structName: isStructTypeReference(param.type) ? param.type.structName.$refText : undefined,
    };
    argstk += INTSIZE;
  });

  // asm += compileBlock(fun.body);
  gen_line(`${exitLabel}:`);
  gen_modify_stack(0);
  gen_line("ret");
};

export const compiler = (root: AstNode) => {
  gen_header();
  if (!isProgram(root)) throw Error("Compiler expects Program root node");
  root.definitions.forEach((def) => {
    if (isFunctionDeclaration(def)) {
      compileFunctionDeclaration(def);
    }
  });
  return asm;
};
