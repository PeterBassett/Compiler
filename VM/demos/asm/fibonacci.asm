.data
    .max word 30    
.text
.global _start:

    ; Use a loop to calculate the fibonacci numbers

    ; function fib
    ; takes one parameter n in r3 and returns the nth fibonacci number in r1
fib:
    mvi r6 2
    cmp r3 r6   ; special-case fib(1) and fib(2)

    jge body:   ; for fib(>= 3)
    mvi r1 1
jne done:       ; fib(1) and fib(0) are 1
    mvi r1 2
    jmp done:

body:
    push r2     ; keep things clean for the caller
    push r3
                ; use an iterative algorithm, rather than a recursive one
                ; (picked up this trick from SICP)

    sub r3 2    ; already handled fib(1) and fib(2), don't do extra loops
    mvi r2 1    ; r2 = fib(n-2)
    mvi r1 2    ; r1 = fib(n-1)

loopfib:
    swap r1 r2
    add r1 r2
    loop r3 loopfib:

    ; r1 is all set and ready to go
    pop r3      ; clean up registers
    pop r2
done:
    ret 

_start:
    mvi r3 1    
    ldr r4 .max ; set it to one more than the desired number of iterations

loop:        
    ; since we start at 8, the fib argument goes 0, 1, 2, 3, ...        
    call fib:
    push r1
    inc r3

loop r4 loop:

    pop r6
    pop r5
    pop r4
    pop r3
    pop r2
    pop r1

    halt