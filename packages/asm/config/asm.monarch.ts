// Monarch syntax highlighting for the asm language.
export default {
    keywords: [
        'A','ACI','ADC','ADD','ADI','ANA','ANI','B','C','CALL','CC','CM','CMA','CMC','CMP','CNC','CNZ','CP','CPE','CPI','CPO','CZ','D','DAD','DB','DCR','DCX','DS','E','EQU','H','HLT','INR','INX','JMP','JNC','JNZ','JP','JPE','JPO','JZ','L','LDA','LDAX','LHLD','LXI','MOV','MVI','NOP','ORA','ORG','ORI','OUT','PC','POP','PUSH','RAL','RAR','RC','RET','RLC','RM','RNC','RNZ','RP','RPE','RPO','RRC','RZ','SBB','SBI','SHLD','SP','STA','STAX','STC','SUB','SUI','XRA','XRI','a','aci','adc','add','adi','ana','ani','b','c','call','cc','cm','cma','cmc','cmp','cnc','cnz','cp','cpe','cpi','cpo','cz','d','dad','db','dcr','dcx','ds','e','equ','h','hlt','inr','inx','jmp','jnc','jnz','jp','jpe','jpo','jz','l','lda','ldax','lhld','lxi','mov','mvi','nop','ora','org','ori','out','pc','pop','push','ral','rar','rc','ret','rlc','rm','rnc','rnz','rp','rpe','rpo','rrc','rz','sbb','sbi','shld','sp','sta','stax','stc','sub','sui','xra','xri'
    ],
    operators: [
        ',',':'
    ],
    symbols: /,|:/,

    tokenizer: {
        initial: [
            { regex: /;[^\n\r]*/, action: {"token":"COMMENT"} },
            { regex: /[0-9a-fA-F]+[h]?/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"number"} }} },
            { regex: /[_a-zA-Z][a-zA-Z0-9._]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /[\r\n]+/, action: {"token":"white"} },
            { regex: /[ \t]/, action: {"token":"white"} },
        ],
        comment: [
        ],
    }
};
