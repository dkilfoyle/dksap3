grammar Asm

entry Program: lines+=Line*;

Line: Label | Instruction | Directive | Comment;

Label: name=ID ":";
Comment: comment=COMMENT;

Instruction:
    AddrInstruction |
    R8R8Instruction |
    R8Imm8Instruction |
    R8Instruction |
    R16Instruction |
    R16Imm16Instruction |
    Imm8Instruction |
    NoArgInstruction;

R8R8Instruction infers Instr: op=R8R8Operation arg1=Reg8 "," arg2=Reg8;
R8R8Operation infers Operation: name= "mov";

R8Imm8Instruction infers Instr: op=R8Imm8Operation arg1=Reg8 "," arg2=Imm8;
R8Imm8Operation infers Operation: name= "mvi";

R16Imm16Instruction infers Instr: op=R16Imm16Operation arg1=Reg16 "," arg2=Imm16;
R16Imm16Operation infers Operation: name= "lxi";

R8Instruction infers Instr: op=R8Operation arg1=Reg8;
R8Operation infers Operation: name= ("inr"|"dcr"|"add"|"adc"|"sub"|"sbb"|"ana"|"ora"|"xra"|"cmp");

R16Instruction infers Instr: op=R16Operation arg1=Reg16;
R16Operation infers Operation: name=("inx"|"dcx"|"dad"|"ldax"|"stax"|"push"|"pop");

AddrInstruction infers Instr: op=AddrOperation arg1=AddrArgument;
AddrOperation infers Operation: name= ("jmp"|"jp"|"jm"|"jnz"|"jz"|"jpo"|"jpe"|"jnc"|"jc"|"lda"|"sta"|"call"|"lhld"|"shld"|"cp"|"cm"|"cnz"|"cz"|"cpo"|"cpe"|"cc");

Imm8Instruction infers Instr: op=Imm8Operation arg1=Imm8;
Imm8Operation infers Operation: name= ("adi"|"aci"|"sui"|"sbi"|"ani"|"ori"|"xri"|"cpi"|"out");

NoArgInstruction infers Instr: op=NoArgOperation;
NoArgOperation infers Operation: name= ("rlc"|"ral"|"rar"|"rrc"|"cma"|"stc"|"cmc"|"ret"|"rp"|"rm"|"rnz"|"rz"|"rpo"|"rpe"|"rnc"|"rc"|"nop"|"hlt");

AddrArgument: number=NUMBER | identifier = [Label:ID];
Reg8: register= ("a"|"b"|"c"|"d"|"e"|"h"|"l"|"m");
Reg16: register= ("b"|"d"|"h"|"sp");
Imm8: number=NUMBER;
Imm16: number=NUMBER;

Directive:
    lhs=DirectiveArgument? dir=DirectiveOperation args+=DirectiveArgument ("," args+=DirectiveArgument)*;
DirectiveArgument: number=NUMBER | identifier=ID;
DirectiveOperation: name=("org"|"equ"|"db"|"ds");

terminal COMMENT: /;[^\n\r]*/;
terminal NUMBER returns number: /[0-9a-fA-F]+[h]?/;
terminal ID: /[_a-zA-Z][a-zA-Z0-9._]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /\s+/;