export const stdlib8080 = `; SmallC v2.4 8080 output
bdos::
  ; CP / M support routine;
  ; bdos(C, DE);
  ; char *DE; int C;
  ; returns H = B, L = A per CPM standard
  pop h; hold return address
  pop d; get DE register argument
  pop b; get bdos function number(C reg)
  push d
  push b
  push h
  call 7
  mov h, b
  mov l, a
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
