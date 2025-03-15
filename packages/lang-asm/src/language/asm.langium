grammar Asm

entry Program:
    EOL* (lines+=Line)*;

Line:
    label=Label (instr=Instruction | dir=Directive)? comment=Comment? EOL?
    | (instr=Instruction | dir=Directive) comment=Comment? EOL?
    | comment=Comment EOL?
    | EOL
;

Label:
    name=ID ":" glob?=":"?;

Comment:
    comment=COMMENT;

Instruction:
    AddrInstruction |
    R8R8Instruction |
    R8Imm8Instruction |
    R8Instruction |
    R16Instruction |
    R16Imm16Instruction |
    Imm8Instruction |
    NoArgInstruction;

R8R8Instruction infers Instr:
    op=R8R8Operation arg1=Reg8 "," arg2=Reg8;
R8R8Operation infers Operation:
    opname="mov";

R8Imm8Instruction infers Instr:
    op=R8Imm8Operation arg1=Reg8 "," arg2=Imm8;
R8Imm8Operation infers Operation:
    opname="mvi";

R16Imm16Instruction infers Instr:
    op=R16Imm16Operation arg1=Reg16 "," arg2=Imm16;
R16Imm16Operation infers Operation:
    opname="lxi";

R8Instruction infers Instr:
    op=R8Operation arg1=Reg8;
R8Operation infers Operation:
    opname=("inr"|"dcr"|"add"|"adc"|"sub"|"sbb"|"ana"|"ora"|"xra"|"cmp");

R16Instruction infers Instr:
    op=R16Operation arg1=Reg16;
R16Operation infers Operation:
    opname=("inx"|"dcx"|"dad"|"ldax"|"stax"|"push"|"pop");

AddrInstruction infers Instr:
    op=AddrOperation arg1=AddrArgument;
AddrOperation infers Operation:
    opname=("jmp"|"jp"|"jm"|"jnz"|"jz"|"jpo"|"jpe"|"jnc"|"jc"|"lda"|"sta"|"call"|"lhld"|"shld"|"cp"|"cm"|"cnz"|"cnc"|"cz"|"cpo"|"cpe"|"cc");

Imm8Instruction infers Instr:
    op=Imm8Operation arg1=Imm8;
Imm8Operation infers Operation:
    opname=("adi"|"aci"|"sui"|"sbi"|"ani"|"ori"|"xri"|"cpi"|"out");

NoArgInstruction infers Instr:
    op=NoArgOperation;
NoArgOperation infers Operation:
    opname=("rlc"|"ral"|"rar"|"rrc"|"cma"|"stc"|"cmc"|"ret"|"rp"|"rm"|"rnz"|"rz"|"rpo"|"rpe"|"rnc"|"rc"|"nop"|"hlt"|"xchg"|"pchl"|"xthl");

AddrArgument:
    number=NUMBER | identifier=[Identifier:ID];

type Identifier = Label | SymbolDirective | LinkageDirective;

terminal ID: /[_a-zA-Z$][a-zA-Z0-9._]*/;
Reg8:
    register=("a"|"b"|"c"|"d"|"e"|"h"|"l"|"m");
Reg16:
    register=("b"|"d"|"h"|"sp"|"psw");
Imm8:
    number=NUMBER | char=CHARACTER;
Imm16:
    number=NUMBER | identifier=[Identifier:ID];

Directive:
    SymbolDirective | DataDirective | LocationDirective | LinkageDirective | MemoryDirective;

SymbolDirective:
    name=ID dirname="equ" number=NUMBER;

DataDirective:
    dirname=("db"|"dw")  args+=DirectiveArgument ("," args+=DirectiveArgument)*;

MemoryDirective:
    dirname="ds"  number=NUMBER;

LocationDirective:
    dirname="org" number=NUMBER;

LinkageDirective:
    dirname="extern" name=ID;

DirectiveArgument:
    number=NUMBER | identifier=[Identifier:ID] | string=STRING;

terminal EOL: /[\r\n]+/;
terminal COMMENT: /;[^\n\r]*/;
terminal NUMBER returns number: /[0-9][0-9a-fA-F]*[h]?/;
terminal CHARACTER: /'[ -~]'/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /[ \t]/;