// TODO: test me

// int strlen(char *);

strlen(char *s)
{
  int i;
  i = 0;
  while (*s++)
  {
    i++;
  }
  return i;
}

main()
{
  char *p;
  p = "hello";

  if (strlen(p) != 5)
    return 1;

  if (p[0] != 104)
    return 2;
}