main()
{
  struct S
  {
    int x;
    int y;
    int z;
  } s, z;
  s.x = 21;
  s.y = 22;
  s.z = 23;
  z.x = 31;
  z.y = 32;
  z.z = 33;
  if (s.x != 21)
    return 1;
  if (s.y != 22)
    return 2;
  if (s.z != 23)
    return 3;
  return 0;
}
