grammar Asm

entry Program:
    EOL* (lines+=Line)*;

Line
    : label=Label? (instruction=(Instruction|Instruction2) | directive=Directive) comment=Comment? EOL
    | label=Label comment=Comment? EOL
    | comment=Comment EOL;

Label: name=ID ":";
Comment returns string: COMMENT;

Instruction2: op=AddrOperation args+=AddrArgument;
Instruction: op=Operation (args+=Argument? ("," args+=Argument)?)?;

Operation: name=OpCode;
AddrOperation: name=AddrOpCode;

Argument: number=NUMBER | register=Register | identifier=ID;
AddrArgument: number=NUMBER | identifier = [Label:ID];

Register returns string: 
    "a"|"A"|
    "b"|"B"|
    "c"|"C"|
    "d"|"D"|
    "e"|"E"|
    "h"|"H"|
    "l"|"L"|
    "pc"|"PC"|
    "sp"|"SP";

Directive:
    lhs=Argument? op=DirectiveOperation args+=Argument ("," args+=Argument)*;

DirectiveOperation: name=DirectiveOpCode;

DirectiveOpCode returns string:
    "org"|"ORG"|
    "equ"|"EQU"|
    "db"|"DB"|
    "ds"|"DS";

AddrOpCode returns string:
"jmp"|"JMP"|"sta"|"STA"|"lda"|"LDA";

OpCode returns string: "INR"|"inr"|
"DCR"|"dcr"|
"INX"|"inx"|
"DCX"|"dcx"|
"DAD"|"dad"|
"ADD"|"add"|
"ADI"|"adi"|
"ADC"|"adc"|
"ACI"|"aci"|
"SUB"|"sub"|
"SUI"|"sui"|
"SBB"|"sbb"|
"SBI"|"sbi"|
"ANA"|"ana"|
"ANI"|"ani"|
"ORA"|"ora"|
"ORI"|"ori"|
"XRA"|"xra"|
"XRI"|"xri"|
"RLC"|"rlc"|
"RAL"|"ral"|
"RAR"|"rar"|
"RRC"|"rrc"|
"CMA"|"cma"|
"STC"|"stc"|
"CMC"|"cmc"|
"CMP"|"cmp"|
"CPI"|"cpi"|
"LDAX"|"ldax"|
"LXI"|"lxi"|
"STAX"|"stax"|
"LHLD"|"lhld"|
"SHLD"|"shld"|
"MOV"|"mov"|
"MVI"|"mvi"|
"PUSH"|"push"|
"POP"|"pop"|
"CALL"|"call"|
"CP"|"cp"|
"CM"|"cm"|
"CNZ"|"cnz"|
"CZ"|"cz"|
"CPO"|"cpo"|
"CPE"|"cpe"|
"CNC"|"cnc"|
"CC"|"cc"|
"RET"|"ret"|
"RP"|"rp"|
"RM"|"rm"|
"RNZ"|"rnz"|
"RZ"|"rz"|
"RPO"|"rpo"|
"RPE"|"rpe"|
"RNC"|"rnc"|
"RC"|"rc"|
"JP"|"jp"|
"JNZ"|"jnz"|
"JZ"|"jz"|
"JPO"|"jpo"|
"JPE"|"jpe"|
"JNC"|"jnc"|
"NOP"|"nop"|
"HLT"|"hlt"|
"OUT"|"out";

terminal EOL: /[\r\n]+/;
terminal COMMENT: /;[^\n\r]*/;
terminal NUMBER returns number: /[0-9a-fA-F]+[h]?/;
terminal ID: /[_a-zA-Z][a-zA-Z0-9._]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /[ \t]/;