// TODO: test me

int main()
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

  p = &arr[1];
  if (*(p--) != 3)
    return 3;
  if (*(p--) != 2)
    return 4;

  p = &arr[0];
  if (*(++p) != 3)
    return 5;

  p = &arr[1];
  if (*(--p) != 2)
    return 6;

  arr[1] = 7;
  p = &arr[0];
  p = p + 1;

  if (*p != 7)
    return 7;
  if (&arr[1] - &arr[0] != 1)
    return 8;

  return 0;
}