// Adapted from SmallC code8080.c: 2.2 (84/08/31,10:05:09) */

import { CompilerRegs, ILValue, ISymbol, SymbolIdentity, SymbolStorage, SymbolType } from "./interface";
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

export class AsmGenerator {
  public static readonly uflag = 0; // don't use 8085 undocumented instructions
  public static readonly INTSIZE = 2;
  public linker = new Set<string>();
  private label_count = 0;
  public stkp = 0;
  public fexitlab = -99;
  public litlab = 0;

  constructor() {}

  init() {
    this.linker = new Set();
    this.label_count = 0;
    this.stkp = 0;
    this.litlab = this.get_label();
    // this.gen_comment(`SmallC 8080 v2.4`, 0);
  }

  get_label() {
    return this.label_count++;
  }

  gen_label(label: number) {
    return [`$${label}:`];
  }

  gen_immediate(x: number | string) {
    return [`lxi h, ${x}`];
  }

  gen_call(sname: string) {
    this.linker.add(sname);
    return [`call ${sname}`];
  }

  /**
   * hl=ram[symbol]
   * code: lhld symbol
   */
  gen_get_memory(sym: ISymbol) {
    const lines = [];
    if (sym.identity != SymbolIdentity.POINTER && sym.type == SymbolType.CCHAR) {
      lines.push(`lda ${sym.name}`);
      lines.push(...this.gen_call("ccsxt"));
    } else if (sym.identity != SymbolIdentity.POINTER && sym.type == SymbolType.UCHAR) {
      lines.push(`lda ${sym.name}`);
      lines.push(`mov l,a`);
      lines.push(`mvi h, 0`);
    } else {
      lines.push(`lhld ${sym.name}`); // hl = (sym)
    }
    return lines;
  }

  /**
   * asm - fetch the address of the specified symbol into the primary register
   * @return which register pair contains result
   */
  gen_get_locale(sym: ISymbol) {
    const lines = [];
    if (sym.storage == SymbolStorage.LSTATIC) {
      lines.push(`lxi h, $${sym.offset}`);
      return { reg: CompilerRegs.HL_REG, lines };
    } else {
      if (AsmGenerator.uflag && !(sym.identity == SymbolIdentity.ARRAY)) {
        /* || (sym->identity == VARIABLE && sym->type == STRUCT))) {*/
        lines.push(`ldsi ${sym.offset - this.stkp}`);
        return { reg: CompilerRegs.DE_REG, lines };
      } else {
        // lines.push(`; Retrieve local ${sym.name}`);
        lines.push(`lxi h, ${sym.offset - this.stkp}`); // load h = stack offset
        lines.push(`dad sp`); // hl = hl + sp
        return { reg: CompilerRegs.HL_REG, lines };
      }
    }
  }

  /**
   * asm - store the primary register into the specified static memory cell
   */
  gen_put_memory(sym: ISymbol) {
    const lines = [];
    if (sym.identity != SymbolIdentity.POINTER && sym.type & SymbolType.CCHAR) {
      lines.push(`mov a, l`);
      lines.push(`sta ${sym.name}`);
    } else {
      lines.push(`shld ${sym.name}`);
    }
    return lines;
  }

  /**
   * store the specified object type in the primary register
   * at the address in secondary register (on the top of the stack)
   */
  gen_put_indirect(typeobj: number) {
    const lines = [];
    lines.push(...this.gen_pop());
    if (typeobj & SymbolType.CCHAR) {
      /*gen_call("ccpchar");*/
      lines.push(`mov a, l`);
      lines.push(`stax d`);
    } else {
      if (AsmGenerator.uflag) {
        lines.push(`shlx`);
      } else {
        lines.push(...this.gen_call("ccpint"));
      }
    }
    return lines;
  }

  /**
   * hl=ram[hl|de]  where hl|de=&symbol
   * code: call ccgint
   */
  gen_get_indirect(indirect: number, reg: number) {
    const lines = [];
    if (indirect == SymbolType.CCHAR) {
      if (reg & CompilerRegs.DE_REG) {
        lines.push(`xchg`);
      }
      lines.push(...this.gen_call("ccgchar"));
    } else if (indirect == SymbolType.UCHAR) {
      if (reg & CompilerRegs.DE_REG) {
        lines.push(`xchg`);
      }
      /*gen_call("cguchar");*/
      lines.push(`mov l, m`);
      lines.push(`mvi h, 0`);
    } else {
      /*int*/
      if (AsmGenerator.uflag) {
        if (reg & CompilerRegs.HL_REG) {
          lines.push(`xchg`);
        }
        lines.push(`lhlx`);
      } else {
        lines.push(...this.gen_call("ccgint"));
      }
    }
    return lines;
  }

  /**
   * push the primary register onto the stack
   */
  gen_push(reg: CompilerRegs, helper: ISymbol | string | 0) {
    const isISymbol = (obj: any): obj is ISymbol => {
      return "name" in obj && "identity" in obj;
    };
    const lines = [];

    let comment: string = "";
    if (typeof helper == "string") comment = helper;
    else if (typeof helper == "number") comment = helper.toString();
    else if (isISymbol(helper)) comment = helper.name;

    if (reg & CompilerRegs.DE_REG) {
      this.stkp = this.stkp - AsmGenerator.INTSIZE;
      lines.push(`push d` + (comment.length ? ` ; ${comment}` : ""));
    } else {
      this.stkp = this.stkp - AsmGenerator.INTSIZE;
      lines.push(`push h` + (comment.length ? ` ; ${comment}` : ""));
    }
    return lines;
  }

  /**
   * pop the top of the stack into the secondary register
   */
  gen_pop() {
    const lines = [];
    this.stkp = this.stkp + AsmGenerator.INTSIZE;
    lines.push(`pop d`);
    return lines;
  }

  /**
   * perform subroutine call to value on top of stack
   */
  callstk() {
    const lines = [];
    lines.push(`lxi h, #.+5`);
    lines.push(`xthl`); // swap primary reg and top of stack
    lines.push("pchl");
    this.stkp = this.stkp + AsmGenerator.INTSIZE;
    return lines;
  }

  /**
   * test the primary register and jump if false to label
   * @param label the label
   * @param ft if true jnz is generated, jz otherwise
   */
  gen_test_jump(label: number, ft: number) {
    return [`mov a, h`, `ora l`, ft ? `jnz $${label}` : `jz $${label}`];
  }

  /**
   * modify the stack pointer to the new value indicated
   * @param newstkp new value
   */
  gen_modify_stack(newstkp: number) {
    const lines: string[] = [];
    let k = newstkp - this.stkp;
    if (k == 0) {
      this.stkp = newstkp;
      return lines;
    }
    if (k > 0) {
      if (k < 7) {
        if (k & 1) {
          lines.push(`inx sp`);
          k--;
        }
        while (k) {
          lines.push(`pop b ; stk+=2`);
          k = k - AsmGenerator.INTSIZE;
        }
        this.stkp = newstkp;
        return lines;
      }
    } else {
      if (k > -7) {
        if (k & 1) {
          lines.push(`dcx sp`);
          k++;
        }
        while (k) {
          lines.push(`push b ; stk-=2`);
          k = k + AsmGenerator.INTSIZE;
        }
        this.stkp = newstkp;
        return lines;
      }
    }
    lines.push(`xchg`);
    lines.push(`lxi h, ${k}`);
    lines.push(`dad sp`);
    lines.push(`sphl`);
    lines.push(`xchg`);
    this.stkp = newstkp;
    return lines;
  }

  /**
   * multiply the primary register by INTSIZE
   */
  gen_multiply_by_two() {
    return [`dad h`];
  }

  /**
   * divide the primary register by INTSIZE, never used
   */
  gen_divide_by_two() {
    return [...this.gen_push(CompilerRegs.HL_REG), `lxi h, 1`, ...this.gen_arithm_shift_right()];
  }

  /**
   * Case jump instruction
   */
  gen_jump_case() {
    return [`jmp cccase`];
  }

  /**
   * add the primary and secondary registers
   * if lval2 is int pointer and lval is not, scale lval
   * @param lval
   * @param lval2
   */
  gen_add(lval: ILValue, lval2: ILValue) {
    const lines = [];
    lines.push(...this.gen_pop());
    if (this.dbltest(lval2, lval)) {
      lines.push(`xchg`);
      this.gen_multiply_by_two();
      lines.push(`xchg`);
    }
    lines.push(`dad d`);
    return lines;
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
    return [...this.gen_pop(), ...this.gen_call("ccsub")];
  }

  /**
   * multiply the primary and secondary registers (result in primary)
   */
  gen_mult() {
    return [...this.gen_pop(), ...this.gen_call("ccmul")];
  }

  /**
   * divide the secondary register by the primary
   * (quotient in primary, remainder in secondary)
   */
  gen_div() {
    return [...this.gen_pop(), ...this.gen_call("ccdiv")];
  }

  /**
   * unsigned divide the secondary register by the primary
   * (quotient in primary, remainder in secondary)
   */
  gen_udiv() {
    return [...this.gen_pop(), ...this.gen_call("ccudiv")];
  }

  /**
   * compute the remainder (mod) of the secondary register
   * divided by the primary register
   * (remainder in primary, quotient in secondary)
   */
  gen_mod() {
    return [...this.gen_div(), `xchg`];
  }

  /**
   * compute the remainder (mod) of the secondary register
   * divided by the primary register
   * (remainder in primary, quotient in secondary)
   */
  gen_umod() {
    return [...this.gen_udiv(), `xchg`];
  }

  /**
   * inclusive 'or' the primary and secondary registers
   */
  gen_or() {
    return [...this.gen_pop(), ...this.gen_call("ccor")];
  }

  /**
   * exclusive 'or' the primary and secondary registers
   */
  gen_xor() {
    return [...this.gen_pop(), ...this.gen_call("ccxor")];
  }

  /**
   * 'and' the primary and secondary registers
   */
  gen_and() {
    return [...this.gen_pop(), ...this.gen_call("ccand")];
  }

  /**
   * arithmetic shift right the secondary register the number of
   * times in the primary register (results in primary register)
   */
  gen_arithm_shift_right() {
    return [...this.gen_pop(), ...this.gen_call("ccasr")];
  }

  /**
   * logically shift right the secondary register the number of
   * times in the primary register (results in primary register)
   */
  gen_logical_shift_right() {
    return [...this.gen_pop(), ...this.gen_call("cclsr")];
  }

  /**
   * arithmetic shift left the secondary register the number of
   * times in the primary register (results in primary register)
   */
  gen_arithm_shift_left() {
    return [...this.gen_pop(), ...this.gen_call("ccasl")];
  }

  /**
   * two's complement of primary register
   */
  gen_twos_complement() {
    return this.gen_call("ccneg");
  }

  /**
   * logical complement of primary register
   */
  gen_logical_negation() {
    return this.gen_call("cclneg");
  }

  /**
   * one's complement of primary register
   */
  gen_complement() {
    return this.gen_call("cccom");
  }

  /**
   * Convert primary value into logical value (0 if 0, 1 otherwise)
   */
  gen_convert_primary_reg_value_to_bool() {
    return this.gen_call("ccbool");
  }

  /**
   * increment the primary register by 1 if char, INTSIZE if int
   */
  gen_increment_primary_reg(lval: ILValue) {
    const lines = [];
    switch (lval.ptr_type) {
      case SymbolType.STRUCT:
        lines.push(`lxi d, ${(lval.tagsym as ITagSymbol).size}`);
        lines.push(`dad d`);
        break;
      case SymbolType.CINT:
      case SymbolType.UINT:
        lines.push(`inx h`);
      default:
        lines.push(`inx h`);
        break;
    }
    return lines;
  }

  /**
   * decrement the primary register by one if char, INTSIZE if int
   */
  gen_decrement_primary_reg(lval: ILValue) {
    const lines = [];
    lines.push(`dcx h`);
    switch (lval.ptr_type) {
      case SymbolType.CINT:
      case SymbolType.UINT:
        lines.push(`dcx h`);
        break;
      case SymbolType.STRUCT:
        if (lval.tagsym == 0) throw Error();
        lines.push(`lxi d, ${lval.tagsym.size - 1}`);
        /* two's complement */
        lines.push(`mov a, d`);
        lines.push(`cma`);
        lines.push(`mov d, a`);
        lines.push(`mov a, e`);
        lines.push(`cma`);
        lines.push(`mov e, a`);
        lines.push(`inx d`);
        /* subtract */
        lines.push(`dad d`);
        break;
      default:
        break;
    }
    return lines;
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
    return [...this.gen_pop(), ...this.gen_call("cceq")];
  }

  /**
   * not equal
   */
  gen_not_equal() {
    return [...this.gen_pop(), ...this.gen_call("ccne")];
  }

  /**
   * less than (signed)
   */
  gen_less_than() {
    return [...this.gen_pop(), ...this.gen_call("cclt")];
  }

  /**
   * less than or equal (signed)
   */
  gen_less_or_equal() {
    return [...this.gen_pop(), ...this.gen_call("ccle")];
  }

  /**
   * greater than (signed)
   */
  gen_greater_than() {
    return [...this.gen_pop(), ...this.gen_call("ccgt")];
  }

  /**
   * greater than or equal (signed)
   */
  gen_greater_or_equal() {
    return [...this.gen_pop(), ...this.gen_call("ccge")];
  }

  /**
   * less than (unsigned)
   */
  gen_unsigned_less_than() {
    return [...this.gen_pop(), ...this.gen_call("ccult")];
  }

  /**
   * less than or equal (unsigned)
   */
  gen_unsigned_less_or_equal() {
    return [...this.gen_pop(), ...this.gen_call("ccule")];
  }

  /**
   * greater than (unsigned)
   */
  gen_usigned_greater_than() {
    return [...this.gen_pop(), ...this.gen_call("ccugt")];
  }

  /**
   * greater than or equal (unsigned)
   */
  gen_unsigned_greater_or_equal() {
    return [...this.gen_pop(), ...this.gen_call("ccuge")];
  }

  inclib() {
    return ["; inclib not implemented"];
  }

  /**
   * Squirrel away argument count in a register that modstk doesn't touch.
   * @param d
   */
  gnargs(d: number) {
    return [`mvi a, ${d}`];
  }

  /**
   * add offset to primary register
   * @param val the value
   */
  add_offset(val: number) {
    return [`lxi d, ${val}`, `dad d`];
  }

  /**
   * multiply the primary register by the length of some variable
   * @param type
   * @param size
   */
  gen_multiply(type: number, size: number) {
    const lines = [];
    switch (type) {
      case SymbolType.CINT:
      case SymbolType.UINT:
        this.gen_multiply_by_two();
        break;
      case SymbolType.STRUCT:
        lines.push(`lxi d, ${size}`);
        lines.push(...this.gen_call("ccmul"));
        break;
      default:
        break;
    }
    return lines;
  }

  // /**
  //  * print pseudo-op  to define a byte
  //  */
  // gen_def_byte() {
  //   return [".db\t"];
  // }

  // /**
  //  * print pseudo-op to define storage
  //  */
  // gen_def_storage() {
  //   this.asm += ".ds\t";
  // }

  // /**
  //  * print pseudo-op to define a word
  //  */
  // gen_def_word() {
  //   this.asm += ".dw\t";
  // }

  /**
   * text (code) segment
   */
  code_segment_gtext() {
    return ["\t.area  SMALLC_GENERATED  (REL,CON,CSEG)"];
  }

  /**
   * data segment
   */
  data_segment_gdata() {
    return ["\t.area  SMALLC_GENERATED_DATA  (REL,CON,DSEG)"];
  }
}
