export const os8080 = `; DKOS

; OS call list
PRINT_B   equ 1
PRINT_MEM equ 2
READ_B    equ 3
READ_MEM  equ 4
PRINT_STR equ 5
READ_STR  equ 6
GET_RND   equ 7

stack     equ 0140h

    extern main

    org 000h
    lxi sp, stack
    call main
    hlt
    
DK_OS::
    nop ; pc=7
    ret

`;
