lxi sp, 0f0h
mvi a, 1
mvi b, 0    ; hello

loop:
out 0
mov c, a
mov a, b
cpi 1
mov a, c
jz rotate_right
jnz rotate_left
jmp loop

rotate_right:
rar
cpi 01
cz set_left
jmp loop

rotate_left:
ral
cpi 80h
cz set_right
jmp loop

set_left:
mvi  b, 0
ret

set_right:
mvi b, 1
ret

hlt

