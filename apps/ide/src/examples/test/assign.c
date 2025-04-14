main()
{
  int x, y;
  x = 1;
  if (x != 1)
    return 1;
  x += 4;
  if (x != 5)
    return 2;
  x -= 1;
  if (x != 4)
    return 3;
  x *= 2;
  if (x != 8)
    return 4;
  x /= 4;
  if (x != 2)
    return 5;
  x %= 2;
  if (x != 0)
    return 6;
  return 0;
}