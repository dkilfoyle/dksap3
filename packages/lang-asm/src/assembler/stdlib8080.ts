export const stdlib8080 = `; SmallC v2.4 8080 output
bdos:
  ; inline asm start
    ; bdos(C, DE);
    ; stack will be retaddr, de, c
    ; char *DE; int C;
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
  ; inline asm end
$1:
  ret
putchar::
  ; bdos(2, c);
  lxi h, 2
  push h
  call bdos
  pop b
  pop b
  lxi h, 2
  dad sp
  jmp $2
$2:
  ret
`;
