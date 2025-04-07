// Test comparisons
// Any failing test returns it's number
// Returns 0 if passes all tests

main()
{
  int i;
  i = 12;
  if (i < 12)
    return 1;
  if (i > 12)
    return 2;
  if (i <= 11)
    return 3;
  if (i >= 13)
    return 4;
  if (i == 13)
    return 5;
  if (i != 12)
    return 6;
  return 0;
}