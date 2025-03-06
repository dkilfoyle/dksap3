export const runtime8080 = `; RUNTIME
; fetch char from (HL) and sign extend into HL
ccgchar: mov     a,m
ccsxt:  mov     l,a
        rlc
        sbb     a
        mov     h,a
        ret
; fetch int from (HL)
ccgint: mov     a,m
        inx     h
        mov     h,m
        mov     l,a
        ret
; store char from HL into (DE)
ccpchar: mov     a,l
        stax    d
        ret
; store int from HL into (DE)
ccpint: mov     a,l
        stax    d
        inx     d
        mov     a,h
        stax    d
        ret
`;
