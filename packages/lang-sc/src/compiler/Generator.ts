// Adapted from SmallC code8080.c: 2.2 (84/08/31,10:05:09) */

import { CompilerRegs, ILValue } from "./interface";
import { ISymbol, SymbolIdentity, SymbolType, SymbolStorage } from "./SymbolTable";
import { ITagSymbol } from "./TagTable";

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
 * Output the symbol at scptr as an extrn or a public
 * @param scptr
 */
// void fpubext(SYMBOL *scptr) {
//     if (scptr->storage == STATIC) return;
//     output_with_tab (scptr->offset == ? ".globl\t" : ";extrn\t");
//     output_string (scptr->name);
//     newline ();
// }

export class Generator {
  private static _instance: Generator;
  public static readonly uflag = 0; // don't use 8085 undocumented instructions
  public static readonly INTSIZE = 2;
  public linker = new Set<string>();
  public asm = "";
  private label_count = 0;
  public stkp = 0;
  private constructor() {}

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  init() {
    this.asm = "";
    this.linker = new Set();
    this.label_count = 0;
    this.stkp = 0;
    this.gen_comment(`SmallC 8080 v2.4`, 0);
  }

  output_line(line: string, indent = 1) {
    this.asm += "\t".repeat(indent) + line + "\n";
  }

  gen_comment(comment: string, indent = 1) {
    this.output_line(`; ${comment}`, indent);
  }

  get_label() {
    return this.label_count++;
  }

  gen_label(label: number) {
    this.output_line(`$${label}:`, 0);
  }

  gen_immediate(x: number | string) {
    this.output_line(`lxi h, ${x}`);
  }

  gen_call(sname: string) {
    this.output_line(`call ${sname}`);
    this.linker.add(sname);
  }

  /**
   * fetch a static memory cell into the primary register
   */
  gen_get_memory(sym: ISymbol) {
    if (sym.identity != SymbolIdentity.POINTER && sym.type == SymbolType.CCHAR) {
      this.output_line(`lda ${sym.name}`);
      this.gen_call("ccsxt");
    } else if (sym.identity != SymbolIdentity.POINTER && sym.type == SymbolType.UCHAR) {
      this.output_line(`lda ${sym.name}`);
      this.output_line(`mov l,a`);
      this.output_line(`mvi h, 0`);
    } else {
      this.output_line(`lhld ${sym.name}`); // hl = sym
    }
  }

  /**
   * asm - fetch the address of the specified symbol into the primary register
   * @return which register pair contains result
   */
  gen_get_locale(sym: ISymbol) {
    if (sym.storage == SymbolStorage.LSTATIC) {
      this.output_line(`lxi h, $${sym.offset}`);
      return CompilerRegs.HL_REG;
    } else {
      if (Generator.uflag && !(sym.identity == SymbolIdentity.ARRAY)) {
        /* || (sym->identity == VARIABLE && sym->type == STRUCT))) {*/
        this.output_line(`ldsi ${sym.offset - this.stkp}`);
        return CompilerRegs.DE_REG;
      } else {
        this.gen_comment(`Retrieve local ${sym.name}`);
        this.output_line(`lxi h, ${sym.offset - this.stkp}`); // load h = stack offset
        this.output_line(`dad sp`); // hl = hl + sp
        return CompilerRegs.HL_REG;
      }
    }
  }

  /**
   * asm - store the primary register into the specified static memory cell
   */
  gen_put_memory(sym: ISymbol) {
    if (sym.identity != SymbolIdentity.POINTER && sym.type & SymbolType.CCHAR) {
      this.output_line(`mov a, l`);
      this.output_line(`sta ${sym.name}`);
    } else {
      this.output_line(`shld ${sym.name}`);
    }
  }

  /**
   * store the specified object type in the primary register
   * at the address in secondary register (on the top of the stack)
   */
  gen_put_indirect(typeobj: number) {
    this.gen_pop();
    if (typeobj & SymbolType.CCHAR) {
      /*gen_call("ccpchar");*/
      this.output_line(`mov a, l`);
      this.output_line(`stax d`);
    } else {
      if (Generator.uflag) {
        this.output_line(`shlx`);
      } else {
        this.gen_call("ccpint");
      }
    }
  }

  /**
   * fetch the specified object type indirect through the primary
   * register into the primary register
   */
  gen_get_indirect(typeobj: number, reg: number) {
    if (typeobj == SymbolType.CCHAR) {
      if (reg & CompilerRegs.DE_REG) {
        this.output_line(`xchg`);
      }
      this.gen_call("ccgchar");
    } else if (typeobj == SymbolType.UCHAR) {
      if (reg & CompilerRegs.DE_REG) {
        this.output_line(`xchg`);
      }
      /*gen_call("cguchar");*/
      this.output_line(`mov l, m`);
      this.output_line(`mvi h, 0`);
    } else {
      /*int*/
      if (Generator.uflag) {
        if (reg & CompilerRegs.HL_REG) {
          this.output_line(`xchg`);
        }
        this.output_line(`lhlx`);
      } else {
        this.gen_call("ccgint");
      }
    }
  }

  /**
   * push the primary register onto the stack
   */
  gen_push(reg: CompilerRegs) {
    if (reg & CompilerRegs.DE_REG) {
      this.output_line(`push d`);
      this.stkp = this.stkp - Generator.INTSIZE;
    } else {
      this.output_line(`push h`);
      this.stkp = this.stkp - Generator.INTSIZE;
    }
  }

  /**
   * pop the top of the stack into the secondary register
   */
  gen_pop() {
    this.output_line(`pop d`);
    this.stkp = this.stkp + Generator.INTSIZE;
  }

  /**
   * perform subroutine call to value on top of stack
   */
  callstk() {
    this.output_line(`lxi h, #.+5`);
    this.output_line(`xthl`); // swap primary reg and top of stack
    this.output_line("pchl");
    this.stkp = this.stkp + Generator.INTSIZE;
  }

  /**
   * test the primary register and jump if false to label
   * @param label the label
   * @param ft if true jnz is generated, jz otherwise
   */
  gen_test_jump(label: number, ft: number) {
    this.output_line(`mov a, h`);
    this.output_line(`ora l`);
    if (ft) this.output_line(`jnz $${label}`);
    else this.output_line(`jz $${label}`);
  }

  /**
   * modify the stack pointer to the new value indicated
   * @param newstkp new value
   */
  gen_modify_stack(newstkp: number) {
    let k = newstkp - this.stkp;
    if (k == 0) return newstkp;
    if (k > 0) {
      if (k < 7) {
        if (k & 1) {
          this.output_line(`inx sp`);
          k--;
        }
        while (k) {
          this.output_line(`pop b`);
          k = k - Generator.INTSIZE;
        }
        return newstkp;
      }
    } else {
      if (k > -7) {
        if (k & 1) {
          this.output_line(`dcx sp`);
          k++;
        }
        while (k) {
          this.output_line(`push b`);
          k = k + Generator.INTSIZE;
        }
        return newstkp;
      }
    }
    this.output_line(`xchg`);
    this.output_line(`lxi h, ${k}`);
    this.output_line(`dad sp`);
    this.output_line(`sphl`);
    this.output_line(`xchg`);
    return newstkp;
  }

  /**
   * multiply the primary register by INTSIZE
   */
  gen_multiply_by_two() {
    this.output_line(`dad h`);
  }

  /**
   * divide the primary register by INTSIZE, never used
   */
  gen_divide_by_two() {
    this.gen_push(CompilerRegs.HL_REG); /* push primary in prep for gasr */
    this.output_line(`lxi h, 1`);
    this.gen_arithm_shift_right(); /* divide by two */
  }

  /**
   * Case jump instruction
   */
  gen_jump_case() {
    this.output_line(`jmp cccase`);
  }

  /**
   * add the primary and secondary registers
   * if lval2 is int pointer and lval is not, scale lval
   * @param lval
   * @param lval2
   */
  gen_add(lval: ILValue, lval2: ILValue) {
    this.gen_pop();
    if (this.dbltest(lval2, lval)) {
      this.output_line(`xchg`);
      this.gen_multiply_by_two();
      this.output_line(`xchg`);
    }
    this.output_line(`dad d`);
  }

  dbltest(val1: ILValue, val2: ILValue) {
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
  gen_sub() {
    this.gen_pop();
    this.gen_call("ccsub");
  }

  /**
   * multiply the primary and secondary registers (result in primary)
   */
  gen_mult() {
    this.gen_pop();
    this.gen_call("ccmul");
  }

  /**
   * divide the secondary register by the primary
   * (quotient in primary, remainder in secondary)
   */
  gen_div() {
    this.gen_pop();
    this.gen_call("ccdiv");
  }

  /**
   * unsigned divide the secondary register by the primary
   * (quotient in primary, remainder in secondary)
   */
  gen_udiv() {
    this.gen_pop();
    this.gen_call("ccudiv");
  }

  /**
   * compute the remainder (mod) of the secondary register
   * divided by the primary register
   * (remainder in primary, quotient in secondary)
   */
  gen_mod() {
    this.gen_div();
    this.output_line(`xchg`);
  }

  /**
   * compute the remainder (mod) of the secondary register
   * divided by the primary register
   * (remainder in primary, quotient in secondary)
   */
  gen_umod() {
    this.gen_udiv();
    this.output_line(`xchg`);
  }

  /**
   * inclusive 'or' the primary and secondary registers
   */
  gen_or() {
    this.gen_pop();
    this.gen_call("ccor");
  }

  /**
   * exclusive 'or' the primary and secondary registers
   */
  gen_xor() {
    this.gen_pop();
    this.gen_call("ccxor");
  }

  /**
   * 'and' the primary and secondary registers
   */
  gen_and() {
    this.gen_pop();
    this.gen_call("ccand");
  }

  /**
   * arithmetic shift right the secondary register the number of
   * times in the primary register (results in primary register)
   */
  gen_arithm_shift_right() {
    this.gen_pop();
    this.gen_call("ccasr");
  }

  /**
   * logically shift right the secondary register the number of
   * times in the primary register (results in primary register)
   */
  gen_logical_shift_right() {
    this.gen_pop();
    this.gen_call("cclsr");
  }

  /**
   * arithmetic shift left the secondary register the number of
   * times in the primary register (results in primary register)
   */
  gen_arithm_shift_left() {
    this.gen_pop();
    this.gen_call("ccasl");
  }

  /**
   * two's complement of primary register
   */
  gen_twos_complement() {
    this.gen_call("ccneg");
  }

  /**
   * logical complement of primary register
   */
  gen_logical_negation() {
    this.gen_call("cclneg");
  }

  /**
   * one's complement of primary register
   */
  gen_complement() {
    this.gen_call("cccom");
  }

  /**
   * Convert primary value into logical value (0 if 0, 1 otherwise)
   */
  gen_convert_primary_reg_value_to_bool() {
    this.gen_call("ccbool");
  }

  /**
   * increment the primary register by 1 if char, INTSIZE if int
   */
  gen_increment_primary_reg(lval: ILValue) {
    switch (lval.ptr_type) {
      case SymbolType.STRUCT:
        this.output_line(`lxi d, ${(lval.tagsym as ITagSymbol).size}`);
        this.output_line(`dad d`);
        break;
      case SymbolType.CINT:
      case SymbolType.UINT:
        this.output_line(`inx h`);
      default:
        this.output_line(`inx h`);
        break;
    }
  }

  /**
   * decrement the primary register by one if char, INTSIZE if int
   */
  gen_decrement_primary_reg(lval: ILValue) {
    this.output_line(`dcx h`);
    switch (lval.ptr_type) {
      case SymbolType.CINT:
      case SymbolType.UINT:
        this.output_line(`dcx h`);
        break;
      case SymbolType.STRUCT:
        if (lval.tagsym == 0) throw Error();
        this.output_line(`lxi d, ${lval.tagsym.size - 1}`);
        /* two's complement */
        this.output_line(`mov a, d`);
        this.output_line(`cma`);
        this.output_line(`mov d, a`);
        this.output_line(`mov a, e`);
        this.output_line(`cma`);
        this.output_line(`mov e, a`);
        this.output_line(`inx d`);
        /* subtract */
        this.output_line(`dad d`);
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
  gen_equal() {
    this.gen_pop();
    this.gen_call("cceq");
  }

  /**
   * not equal
   */
  gen_not_equal() {
    this.gen_pop();
    this.gen_call("ccne");
  }

  /**
   * less than (signed)
   */
  gen_less_than() {
    this.gen_pop();
    this.gen_call("cclt");
  }

  /**
   * less than or equal (signed)
   */
  gen_less_or_equal() {
    this.gen_pop();
    this.gen_call("ccle");
  }

  /**
   * greater than (signed)
   */
  gen_greater_than() {
    this.gen_pop();
    this.gen_call("ccgt");
  }

  /**
   * greater than or equal (signed)
   */
  gen_greater_or_equal() {
    this.gen_pop();
    this.gen_call("ccge");
  }

  /**
   * less than (unsigned)
   */
  gen_unsigned_less_than() {
    this.gen_pop();
    this.gen_call("ccult");
  }

  /**
   * less than or equal (unsigned)
   */
  gen_unsigned_less_or_equal() {
    this.gen_pop();
    this.gen_call("ccule");
  }

  /**
   * greater than (unsigned)
   */
  gen_usigned_greater_than() {
    this.gen_pop();
    this.gen_call("ccugt");
  }

  /**
   * greater than or equal (unsigned)
   */
  gen_unsigned_greater_or_equal() {
    this.gen_pop();
    this.gen_call("ccuge");
  }

  inclib() {
    return "";
  }

  /**
   * Squirrel away argument count in a register that modstk doesn't touch.
   * @param d
   */
  gnargs(d: number) {
    this.output_line(`mvi a, ${d}`);
  }

  /**
   * add offset to primary register
   * @param val the value
   */
  add_offset(val: number) {
    this.output_line(`lxi d, ${val}`);
    this.output_line(`dad d`);
  }

  /**
   * multiply the primary register by the length of some variable
   * @param type
   * @param size
   */
  gen_multiply(type: number, size: number) {
    switch (type) {
      case SymbolType.CINT:
      case SymbolType.UINT:
        this.gen_multiply_by_two();
        break;
      case SymbolType.STRUCT:
        this.output_line(`lxi d, ${size}`);
        this.gen_call("ccmul");
        break;
      default:
        break;
    }
  }

  /**
   * print pseudo-op  to define a byte
   */
  gen_def_byte() {
    this.output_line(".db\t");
  }

  /**
   * print pseudo-op to define storage
   */
  gen_def_storage() {
    this.asm += ".ds\t";
  }

  /**
   * print pseudo-op to define a word
   */
  gen_def_word() {
    this.asm += ".dw\t";
  }

  /**
   * text (code) segment
   */
  code_segment_gtext() {
    this.output_line("\t.area  SMALLC_GENERATED  (REL,CON,CSEG)");
  }

  /**
   * data segment
   */
  data_segment_gdata() {
    this.output_line("\t.area  SMALLC_GENERATED_DATA  (REL,CON,DSEG)");
  }
}

export const generator = Generator.Instance;
