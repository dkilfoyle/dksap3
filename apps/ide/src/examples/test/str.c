// TODO: test me

// int strlen(char *);

main()
{
  char *p;
  p = "hello";

  if (strlen(p) != 5)
    return 1;

  if (p[0] != 104)
    return 2;
}