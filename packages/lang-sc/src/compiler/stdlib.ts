export const stdlibsrc = `// stdio.c
bdos(int c, int de)
{
#asm
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
  call 6
  mov h, b
  mov l, a
#endasm
}

putchar(char c) {
  bdos(2, c);
  return c;
}
`;
