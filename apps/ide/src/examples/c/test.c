
main()
{
  int x, y;
  x = 23;
  switch (x)
  {
  case 23:
    y = 10;
    break;
  case 37:
    y = 11;
    break;
  default:
    y = 12;
  }
  if (y != 10)
    return 1;
  return 0;
}