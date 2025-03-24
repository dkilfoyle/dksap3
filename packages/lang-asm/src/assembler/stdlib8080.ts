export const stdlib8080 = `; SmallC v2.4 8080 output
bdos:
  ; inline asm start
    ; bdos(C, DE);
    ; stack will be retaddr, c, de
    ; returns H = B, L = A per CPM standard
    pop h       ; hold return address
    pop b       ; equivalent ld c, function
    pop d       ; equivalent ld de, parameter
    push d      ; restore stack
    push b      
    push h
    call DK_OS  ; defined in os
    mov h, b    ; returns hl = b, a
    mov l, a
  ; inline asm end
$1:
  ret
putchar::
  ; bdos(2, c);
  lxi h, 2
  push h
  lxi h, 4
  dad sp
  call ccgchar
  push h
  call bdos
  pop b
  pop b
$2:
  ret
`;
