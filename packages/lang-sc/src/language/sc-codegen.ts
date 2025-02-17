// Adapted from SmallC code8080.c: 2.2 (84/08/31,10:05:09) */

/*      Define ASNM and LDNM to the names of the assembler and linker
        respectively */

/*
 *      Some predefinitions:
 *
 *      INTSIZE is the size of an integer in the target machine
 *      BYTEOFF is the offset of an byte within an integer on the
 *              target machine. (ie: 8080,pdp11 = 0, 6809 = 1,
 *              360 = 3)
 *      This compiler assumes that an integer is the SAME length as
 *      a pointer - in fact, the compiler uses INTSIZE for both.
 */

export let asm = "";
export let nxtlab = 0;
export let stkp = 0;
export const uflag = 0; // don't use 8085 undocumented instructions
const INTSIZE = 2;

/**
 * Output the variable symbol at scptr as an extrn or a public
 * @param scptr
 */
// void ppubext(SYMBOL *scptr)  {
//     if (symbol_table[current_symbol_table_idx].storage == STATIC) return;
//     output_with_tab (scptr->storage == EXTERN ? ";extrn\t" : ".globl\t");
//     output_string (scptr->name);
//     newline();
// }

/**
 * Output the function symbol at scptr as an extrn or a public
 * @param scptr
 */
// void fpubext(SYMBOL *scptr) {
//     if (scptr->storage == STATIC) return;
//     output_with_tab (scptr->offset == FUNCTION ? ".globl\t" : ";extrn\t");
//     output_string (scptr->name);
//     newline ();
// }

export interface ISymbol {
  name: string;
  identity: SymbolIdentity;
  type: SymbolType;
  storage: SymbolStorage;
  offset: number;
  tagidx: number;
}

export enum SymbolType {
  UNSIGNED = 1,
  STRUCT = 2,
  CCHAR = 1 << 2,
  UCHAR = (1 << 2) + 1,
  CINT = 2 << 2,
  UINT = (2 << 2) + 1,
}

export enum SymbolIdentity {
  VARIABLE = 1,
  ARRAY,
  POINTER,
  FUNCTION,
}

export enum SymbolStorage {
  PUBLIC = 1,
  AUTO,
  EXTERN,
  STATIC,
  LSTATIC,
  DEFAUTO,
}

export enum CompilerRegs {
  HL_REG = 1 << 1,
  DE_REG = 1 << 2,
}

export interface Ilvalue {
  symbol: ISymbol | 0;
  indirect: number;
  ptr_type: number;
  tagsym: ITagSymbol | 0;
}

export interface ITagSymbol {
  name: string;
  size: number;
  member_idx: number;
  number_of_members: number;
}

const linker = new Set<string>();

function gen_call(sname: string) {
  asm += `call ${sname}\n`;
  linker.add(sname);
}

/**
 * fetch a static memory cell into the primary register
 * @param sym
 */
function gen_get_memory(sym: ISymbol) {
  if (sym.identity != SymbolIdentity.POINTER && sym.type == SymbolType.CCHAR) {
    asm += `lda ${sym.name}\n`;
    gen_call("ccsxt");
  } else if (sym.identity != SymbolIdentity.POINTER && sym.type == SymbolType.UCHAR) {
    asm += `lda ${sym.name}\n`;
    asm += `mov l,a\n`;
    asm += `mvi h, 0\n`;
  } else {
    asm += `lhld ${sym.name}\n`;
  }
}

/**
 * asm - fetch the address of the specified symbol into the primary register
 * @param sym the symbol name
 * @return which register pair contains result
 */
function gen_get_locale(sym: ISymbol) {
  if (sym.storage == SymbolStorage.LSTATIC) {
    asm += `lxi h, $${sym.offset}\n`;
    return CompilerRegs.HL_REG;
  } else {
    if (uflag && !(sym.identity == SymbolIdentity.ARRAY)) {
      /* || (sym->identity == VARIABLE && sym->type == STRUCT))) {*/
      asm += `ldsi ${sym.offset - stkp}\n`;
      return CompilerRegs.DE_REG;
    } else {
      asm += `lxi h, ${sym.offset - stkp}\n`;
      asm += `dad sp\n`;
      return CompilerRegs.HL_REG;
    }
  }
}

/**
 * asm - store the primary register into the specified static memory cell
 * @param sym
 */
function gen_put_memory(sym: ISymbol) {
  if (sym.identity != SymbolIdentity.POINTER && sym.type & SymbolType.CCHAR) {
    asm += `mov a, l\n`;
    asm += `sta ${sym.name}\n`;
  } else {
    asm += `shld ${sym.name}\n`;
  }
}

/**
 * store the specified object type in the primary register
 * at the address in secondary register (on the top of the stack)
 * @param typeobj
 */
function gen_put_indirect(typeobj: number) {
  gen_pop();
  if (typeobj & SymbolType.CCHAR) {
    /*gen_call("ccpchar");*/
    asm += `mov a, l\n`;
    asm += `stax d\n`;
  } else {
    if (uflag) {
      asm += `shlx\n`;
    } else {
      gen_call("ccpint");
    }
  }
}

/**
 * fetch the specified object type indirect through the primary
 * register into the primary register
 * @param typeobj object type
 */
function gen_get_indirect(typeobj: number, reg: number) {
  if (typeobj == SymbolType.CCHAR) {
    if (reg & CompilerRegs.DE_REG) {
      asm += `xchg\n`;
    }
    gen_call("ccgchar");
  } else if (typeobj == SymbolType.UCHAR) {
    if (reg & CompilerRegs.DE_REG) {
      asm += `xchg\n`;
    }
    /*gen_call("cguchar");*/
    asm += `mov l, m\n`;
    asm += `mvi h, 0\n`;
  } else {
    /*int*/
    if (uflag) {
      if (reg & CompilerRegs.HL_REG) {
        asm += `xchg\n`;
      }
      asm += `lhlx\n`;
    } else {
      gen_call("ccgint");
    }
  }
}

/**
 * push the primary register onto the stack
 */
function gen_push(reg: CompilerRegs) {
  if (reg & CompilerRegs.DE_REG) {
    asm += `push d\n`;
    stkp = stkp - INTSIZE;
  } else {
    asm += `push h\n`;
    stkp = stkp - INTSIZE;
  }
}

/**
 * pop the top of the stack into the secondary register
 */
function gen_pop() {
  asm += `pop d\n`;
  stkp = stkp + INTSIZE;
}

/**
 * perform subroutine call to value on top of stack
 */
function callstk() {
  asm += `lxi h, #.+5\n`;
  asm += `xthl\n`; // swap primary reg and top of stack
  asm += "pchl\n";
  stkp = stkp + INTSIZE;
}

/**
 * test the primary register and jump if false to label
 * @param label the label
 * @param ft if true jnz is generated, jz otherwise
 */
function gen_test_jump(label: number, ft: number) {
  asm += `mov a, h\n`;
  asm += `ora l`;
  if (ft) asm += `jnz $${label}\n`;
  else asm += `jz $${label}\n`;
}

/**
 * modify the stack pointer to the new value indicated
 * @param newstkp new value
 */
function gen_modify_stack(newstkp: number) {
  let k = newstkp - stkp;
  if (k == 0) return newstkp;
  if (k > 0) {
    if (k < 7) {
      if (k & 1) {
        asm += `inx sp\n`;
        k--;
      }
      while (k) {
        asm += `pop b\n`;
        k = k - INTSIZE;
      }
      return newstkp;
    }
  } else {
    if (k > -7) {
      if (k & 1) {
        asm += `dcx sp\n`;
        k++;
      }
      while (k) {
        asm += `push b\n`;
        k = k + INTSIZE;
      }
      return newstkp;
    }
  }
  asm += `xchg\n`;
  asm += `lxi h, ${k}\n`;
  asm += `dad sp\n`;
  asm += `sphl`;
  asm += `xchg\n`;
  return newstkp;
}

/**
 * multiply the primary register by INTSIZE
 */
function gen_multiply_by_two() {
  asm += `dad h\n`;
}

/**
 * divide the primary register by INTSIZE, never used
 */
function gen_divide_by_two() {
  gen_push(CompilerRegs.HL_REG); /* push primary in prep for gasr */
  asm += `lxi h, 1\n`;
  gen_arithm_shift_right(); /* divide by two */
}

/**
 * Case jump instruction
 */
function gen_jump_case() {
  asm += `jmp cccase\n`;
}

/**
 * add the primary and secondary registers
 * if lval2 is int pointer and lval is not, scale lval
 * @param lval
 * @param lval2
 */
function gen_add(lval: Ilvalue, lval2: Ilvalue) {
  gen_pop();
  if (dbltest(lval2, lval)) {
    asm += `xchg\n`;
    gen_multiply_by_two();
    asm += `xchg\n`;
  }
  asm += `dad d\n`;
}

function dbltest(val1: Ilvalue, val2: Ilvalue) {
  if (val1.ptr_type) {
    if (val1.ptr_type & SymbolType.CCHAR) return false;
    if (val2.ptr_type) return false;
    return true;
  }
  return false;
}

/**
 * subtract the primary register from the secondary
 */
function gen_sub() {
  gen_pop();
  gen_call("ccsub");
}

/**
 * multiply the primary and secondary registers (result in primary)
 */
function gen_mult() {
  gen_pop();
  gen_call("ccmul");
}

/**
 * divide the secondary register by the primary
 * (quotient in primary, remainder in secondary)
 */
function gen_div() {
  gen_pop();
  gen_call("ccdiv");
}

/**
 * unsigned divide the secondary register by the primary
 * (quotient in primary, remainder in secondary)
 */
function gen_udiv() {
  gen_pop();
  gen_call("ccudiv");
}

/**
 * compute the remainder (mod) of the secondary register
 * divided by the primary register
 * (remainder in primary, quotient in secondary)
 */
function gen_mod() {
  gen_div();
  asm += `xchg\n`;
}

/**
 * compute the remainder (mod) of the secondary register
 * divided by the primary register
 * (remainder in primary, quotient in secondary)
 */
function gen_umod() {
  gen_udiv();
  asm += `xchg\n`;
}

/**
 * inclusive 'or' the primary and secondary registers
 */
function gen_or() {
  gen_pop();
  gen_call("ccor");
}

/**
 * exclusive 'or' the primary and secondary registers
 */
function gen_xor() {
  gen_pop();
  gen_call("ccxor");
}

/**
 * 'and' the primary and secondary registers
 */
function gen_and() {
  gen_pop();
  gen_call("ccand");
}

/**
 * arithmetic shift right the secondary register the number of
 * times in the primary register (results in primary register)
 */
function gen_arithm_shift_right() {
  gen_pop();
  gen_call("ccasr");
}

/**
 * logically shift right the secondary register the number of
 * times in the primary register (results in primary register)
 */
function gen_logical_shift_right() {
  gen_pop();
  gen_call("cclsr");
}

/**
 * arithmetic shift left the secondary register the number of
 * times in the primary register (results in primary register)
 */
function gen_arithm_shift_left() {
  gen_pop();
  gen_call("ccasl");
}

/**
 * two's complement of primary register
 */
function gen_twos_complement() {
  gen_call("ccneg");
}

/**
 * logical complement of primary register
 */
function gen_logical_negation() {
  gen_call("cclneg");
}

/**
 * one's complement of primary register
 */
function gen_complement() {
  gen_call("cccom");
}

/**
 * Convert primary value into logical value (0 if 0, 1 otherwise)
 */
function gen_convert_primary_reg_value_to_bool() {
  gen_call("ccbool");
}

/**
 * increment the primary register by 1 if char, INTSIZE if int
 */
function gen_increment_primary_reg(lval: Ilvalue) {
  switch (lval.ptr_type) {
    case SymbolType.STRUCT:
      asm += `lxi d, ${(lval.tagsym as ITagSymbol).size}\n`;
      asm += `dad d\n`;
      break;
    case SymbolType.CINT:
    case SymbolType.UINT:
      asm += `inx h\n`;
    default:
      asm += `inx h\n`;
      break;
  }
}

/**
 * decrement the primary register by one if char, INTSIZE if int
 */
function gen_decrement_primary_reg(lval: Ilvalue) {
  asm += `dcx h\n`;
  switch (lval.ptr_type) {
    case SymbolType.CINT:
    case SymbolType.UINT:
      asm += `dcx h\n`;
      break;
    case SymbolType.STRUCT:
      if (lval.tagsym == 0) throw Error();
      asm += `lxi d, ${lval.tagsym.size - 1}\n`;
      /* two's complement */
      asm += `mov a, d\n`;
      asm += `cma\n`;
      asm += `mov d, a\n`;
      asm += `mov a, e\n`;
      asm += `cma\n`;
      asm += `mov e, a\n`;
      asm += `inx d\n`;
      /* subtract */
      asm += `dad d`;
      break;
    default:
      break;
  }
}

/**
 * following are the conditional operators.
 * they compare the secondary register against the primary register
 * and put a literal 1 in the primary if the condition is true,
 * otherwise they clear the primary register
 */

/**
 * equal
 */
function gen_equal() {
  gen_pop();
  gen_call("cceq");
}

/**
 * not equal
 */
function gen_not_equal() {
  gen_pop();
  gen_call("ccne");
}

/**
 * less than (signed)
 */
function gen_less_than() {
  gen_pop();
  gen_call("cclt");
}

/**
 * less than or equal (signed)
 */
function gen_less_or_equal() {
  gen_pop();
  gen_call("ccle");
}

/**
 * greater than (signed)
 */
function gen_greater_than() {
  gen_pop();
  gen_call("ccgt");
}

/**
 * greater than or equal (signed)
 */
function gen_greater_or_equal() {
  gen_pop();
  gen_call("ccge");
}

/**
 * less than (unsigned)
 */
function gen_unsigned_less_than() {
  gen_pop();
  gen_call("ccult");
}

/**
 * less than or equal (unsigned)
 */
function gen_unsigned_less_or_equal() {
  gen_pop();
  gen_call("ccule");
}

/**
 * greater than (unsigned)
 */
function gen_usigned_greater_than() {
  gen_pop();
  gen_call("ccugt");
}

/**
 * greater than or equal (unsigned)
 */
function gen_unsigned_greater_or_equal() {
  gen_pop();
  gen_call("ccuge");
}

function inclib() {
  return "";
}

/**
 * Squirrel away argument count in a register that modstk doesn't touch.
 * @param d
 */
function gnargs(d: number) {
  asm += `mvi a, ${d}\n`;
}

/**
 * add offset to primary register
 * @param val the value
 */
function add_offset(val: number) {
  asm += `lxi d, ${val}\n`;
  asm += `dad d\n`;
}

/**
 * multiply the primary register by the length of some variable
 * @param type
 * @param size
 */
function gen_multiply(type: number, size: number) {
  switch (type) {
    case SymbolType.CINT:
    case SymbolType.UINT:
      gen_multiply_by_two();
      break;
    case SymbolType.STRUCT:
      asm += `lxi d, ${size}\n`;
      gen_call("ccmul");
      break;
    default:
      break;
  }
}
