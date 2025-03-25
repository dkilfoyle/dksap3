export const stdlibsrc = `// stdio.c

// To make a bdos call
// ld de, parameter
// ld c, function
// call 5

bdos(int c, int de)
{
  #asm
    ; bdos(C, DE);
    ; stack will be retaddr, de, c
    ; returns H = B, L = A per CPM standard
    pop h       ; hold return address
    pop d       ; equivalent ld de, parameter
    pop b       ; equivalent ld c, function
    push b      ; restore stack
    push d      
    push h
    call DK_OS  ; defined in os
    mov h, b    ; returns hl = b, a
    mov l, a
  #endasm
}

extern putchar(char c) {
  bdos(2, c);
}
`;
