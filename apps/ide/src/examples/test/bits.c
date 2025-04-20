// adapted from https://github.com/EtchedPixels/Fuzix-Compiler-Kit/blob/main/test/tests/0504-bit.c

int cntbits(unsigned int x)
{
  unsigned int i;
  int n;
  int c;

  n = 0;
  i = 1;

  for (c = 0; c < 16; c++)
  {
    if (x & i)
      n++;
    i <<= 1;
  }
  return n;
}

int main()
{
  if (cntbits(0x5555) != 8)
    return 1;
  if (cntbits(0x0000) != 0)
    return 2;
  if (cntbits(0x00FF) != 8)
    return 3;
  if (cntbits(0xFF00) != 8)
    return 4;
  if (cntbits(0xFFFF) != 16)
    return 5;
  return 0;
}