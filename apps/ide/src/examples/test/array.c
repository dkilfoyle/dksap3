main()
{
  int z[8];
  int *r;
  r = z;
  if (sizeof(z) != 16)
    return 1;
  z[5] = 12;
  if (z[5] != 12)
    return 1;
  if (r != &z[0])
    return 2;
  z[0] = 1;
  if (*r != 1)
    return 3;
  z[0]++;
  if (*r != 2)
    return 4;
  z[5] = 123;
  if (z[5] != 123)
    return 5;
  return 0;
}
