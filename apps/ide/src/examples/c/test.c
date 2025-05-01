struct S
{
  int x;
  int y;
  int z;
} s = {7, 8, 9};
main()
{
  struct S *p;
  int sx, px;
  p = &s;

  sx = s.x;
  px = p->x;

  if (p->x != 7)
    return 1;
  if (p->y != 8)
    return 1;
  if (p->z != 9)
    return 1;
}