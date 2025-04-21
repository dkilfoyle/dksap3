main()
{
  int z[8];
  int *r;
  r = z;
  // sizeof only working for struct
  // if (sizeof(z) != 16)
  //   return 1;
  z[0] = 1;
  if (*r != 1)
    return 3;
  return 0;
}
