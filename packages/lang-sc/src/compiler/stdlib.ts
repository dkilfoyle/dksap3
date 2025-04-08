export const stdlibsrc = `// stdio.c

// To make a bdos call
// ld de, parameter
// ld c, function
// call 5

bdos(int c, int de)
{
  #asm
    ; bdos(C, DE);
    ; stack will be retaddr, de, c
    ; returns H = B, L = A per CPM standard
    pop h       ; hold return address
    pop d       ; equivalent ld de, parameter
    pop b       ; equivalent ld c, function
    push b      ; restore stack
    push d      
    push h
    call DK_OS  ; defined in os
    mov h, b    ; returns hl = b, a
    mov l, a
  #endasm
}

extern putchar(char c) {
  bdos(2, c);
}

/**
 * Reverse a character string, reference CPL p 59
 * @param s pointer to string
 */
reverse(char *s) {
    int i, j;
    char c;
    i = 0;
    j = strlen(s) - 1;
    while (i < j) {
        c = s[i];
        s[i] = s[j];
        s[j] = c;
        i++;
        j--;
    }
    return (s);
}

/**
 * integer to ascii representation
 * @param n the integer number
 * @param s string buffer
 * @return 
 */
// itoa(int n, char s[]) {
//     int i, sign;

//     if ((sign = n) < 0) {
//         n = -n;
//     }
//     i = 0;
//     do {
//         s[i++] = n % 10 + '0';
//     } while ((n = n / 10) > 0);
//     if (sign < 0) {
//         s[i++] = '-';
//     }
//     s[i] = 0;
//     reverse(s);
// }

/**
 * return length of string, reference CPL p 36
 * @param s pointer to string
 */
strlen(char *s) {
    int i;
    i = 0;
    while (*s++) {
        i++;
    }
    return i;
}


`;
