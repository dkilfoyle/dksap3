main()
{
  struct S
  {
    int x;
    int y;
  } s;
  struct S *p;

  s.x = 3;
  s.y = 5;
  if (s.y - s.x != 2)
    return 1;

  p = &s;
  s.x = 1;
  p->y = 2;
  if (p->y + p->x != 3)
    return 2;
}