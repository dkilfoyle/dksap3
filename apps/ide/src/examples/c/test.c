main()
{
  int arr[2];
  int *p;

  arr[0] = 2;
  arr[1] = 3;
  p = &arr[0];

  if (*(p++) != 2)
    return 1;
  if (*(p++) != 3)
    return 2;
  return 0;
}
