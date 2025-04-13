main()
{
  char buf[32];
  char *bp;

  bp = buf;
  if (++bp != buf + 1)
    return 1;
  bp = buf;
  if (bp++ != buf)
    return 2;
  bp = buf;
  if ((bp += 4) != buf + 4)
    return 3;
  return 0;
}