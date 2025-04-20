// TODO: Test me

main()
{
  int arr[2];
  int x, y;

  if ((2 + 2) * 2 - 8 != 0)
    return 1;

  arr[0] = 1;
  arr[1] = 2;
  if (arr[0] + arr[1] - 3 != 0)
    return 2;

  x = 7;
  y = 11;
  if (x != 7 && y != 11)
    return 3;

  if (!(x == 7 || y == 12))
    return 4;

  x = 1;
  if (x | 4 != 5)
    return 5;
  if (x & 3 != 1)
    return 6;
  if (x ^ 3 != 2)
    return 7;
}