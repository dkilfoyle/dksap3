int x = 23;
struct S
{
  int a;
  int b;
  int c;
} s = {1, 2, 3};

int main()
{
  if (x != 23)
    return 1;
  x = 56;
  if (x != 56)
    return 2;

  if (s.a != 1)
    return 3;
  if (s.b != 2)
    return 4;
  if (s.c != 3)
    return 5;

  s.a = 78;
  if (s.a != 78)
    return 6;

  return 0;
}