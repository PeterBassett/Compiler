import CPU from "../../VirtualMachine/CPU/CPU";
import * as helpers from "../helpers";
import RAM from "../../VirtualMachine/Memory/RAM";
import RegisterBank from "../../VirtualMachine/CPU/RegisterBank";
import Assembler from "../../Assembler/Assembler";
import { OpCodes as Op, Registers as Reg } from "../../VirtualMachine/CPU/Instruction/InstructionSet";
import InstructionCoder from "../../VirtualMachine/CPU/Instruction/InstructionCoder";
import InstructionCoder32Bit from "../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
//import InstructionCoderVariable from "../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { Logger } from "../../Assembler/interfaces/Logger";
import Parser from "../../Assembler/Parser";
import defaultPreprocessor from "../../Assembler/Preprocessors/DefaultPreprocessor";
import validator from "../../Assembler/Preprocessors/DefaultPreprocessor";
import Flags from "../../VirtualMachine/CPU/Flags";
import InstructionCoderVariable from "../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";

describe("Assemble and execute with Variable Length Instructions", () => {
    let assembler : Assembler;
    let ram : RAM;
    let flags : Flags;
    let registers : RegisterBank;
    let instructionCoder : InstructionCoder;
    let ramSize = 1 << 10;
    let cpu : CPU;
    let ip : number;

    let loggerCallCount : number;
    let loggerMessages : string [];

    const logger : Logger = (lineNumber : number, characterNumber : number, message : string) => {
        loggerCallCount++;
        loggerMessages.push(message);
    }

    function execute(assemblyCode : string, maximumSteps:number = 50, setup?:(cpu : CPU, ram:RAM, registers : RegisterBank, flags:Flags)=>void) : void
    {
        if(maximumSteps == null)
            maximumSteps = 50;
        loggerCallCount = 0;
        loggerMessages = [];    
        
        ram = new RAM(ramSize);
        registers = new RegisterBank(ramSize);
        flags = new Flags();
        
        instructionCoder = new InstructionCoderVariable();
        assembler = new Assembler(logger, Parser, defaultPreprocessor, instructionCoder, 0);

        const instructions = assembler.assemble(assemblyCode)

        ram.blitStoreBytes(0, instructions);

        cpu = new CPU(ram, registers, flags, instructionCoder);

        if(setup)
            setup(cpu, ram, registers, flags);

        let stepCount = 0;
        try
        {
            while(true)   
            {                  
                cpu.step();

                stepCount++;

                if(stepCount > maximumSteps)
                    break;
            }
        }
        catch(e)
        {
            if(e.message != "HALT EXECUTION") 
                throw e;
        }
    }

    it("a move immediate instruction", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r5 20
        halt`);

        expect(registers.R5).toEqual(20);
    });

    it("a ldrf instruction", () => {
        execute(`
    .data
        .takesUpSpace float 123.456
    .text
    .global start:
        start:
        ldrf r5 .takesUpSpace
        halt`);

        expect(registers.R5).toEqual(123.456);
    });


    it("just lots of halt instructions", () => {
        execute(`
    .data
    .text
    .global start:
        start:        
        halt
        halt
        halt
        halt
        halt
        halt
        halt
        halt
        halt
        halt`);

        expect(registers.R5).toEqual(0);
    });

    it("a move instruction with a relative source", () => {
        execute(`
    .data
    .text
    .global start:
        start:               
        mov r3 [r2]
        halt`, undefined, (cpu:CPU, ram : RAM, registers : RegisterBank, flags:Flags) =>
        {
            registers.R2 = ram.capacity - 100;
            ram.storeWord(registers.R2, 123);
        });

        expect(registers.R3).toEqual(123);
    });

    it("a verified move instruction with a relative source", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 123
        str r1 900
        mvi r2 900       
        mov r3 [r2]
        halt`);

        expect(registers.R3).toEqual(123);
    });

    it("a verified move instruction with a relative source and zero offset", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 123
        str r1 900
        mvi r2 900       
        mov r3 [r2+0]
        halt`);

        expect(registers.R3).toEqual(123);
    });

    it("a CMP instruction with a literal comparator", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 123       
        CMP r1 0
        halt`);

        expect(flags.Zero).toEqual(false);
        expect(flags.Negative).toEqual(false);        
    });

    it("a CMP instruction with a literal comparator", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0
        dec r1       
        CMP r1 0
        halt`);

        expect(flags.Zero).toEqual(false);
        expect(flags.Negative).toEqual(true);        
    });

    it("a CMP instruction with a literal comparator", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0     
        CMP r1 0
        halt`);

        expect(flags.Zero).toEqual(true);
        expect(flags.Negative).toEqual(false);        
    });

    ////////////////////////////////////////////////////////////////////
    it("a SETE instruction with equal comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 123   
        mvi r2 123
        cmp r1 r2    
        SETE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    it("a SETE instruction with less than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 122   
        mvi r2 123
        cmp r1 r2    
        SETE r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    it("a SETE instruction with greater than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 124
        mvi r2 123
        cmp r1 r2    
        SETE r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    ////////////////////////////////////////////////////////////////////
    it("a SETNE instruction with equal comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 123   
        mvi r2 123
        cmp r1 r2    
        SETNE r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    it("a SETNE instruction with less than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 122   
        mvi r2 123
        cmp r1 r2    
        SETNE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    it("a SETNE instruction with greater than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 124
        mvi r2 123
        cmp r1 r2    
        SETNE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    ////////////////////////////////////////////////////////////////////
    it("a SETLT instruction with equal comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 123   
        mvi r2 123
        cmp r1 r2    
        SETLT r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    it("a SETLT instruction with less than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 122   
        mvi r2 123
        cmp r1 r2    
        SETLT r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    it("a SETLT instruction with greater than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 124
        mvi r2 123
        cmp r1 r2    
        SETLT r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });
    
    ////////////////////////////////////////////////////////////////////
    it("a SETLTE instruction with equal comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 123   
        mvi r2 123
        cmp r1 r2    
        SETLTE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    it("a SETLTE instruction with less than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 122   
        mvi r2 123
        cmp r1 r2    
        SETLTE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    it("a SETLTE instruction with greater than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 124
        mvi r2 123
        cmp r1 r2    
        SETLTE r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });    
    ////////////////////////////////////////////////////////////////////
    it("a SETGT instruction with equal comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 123   
        mvi r2 123
        cmp r1 r2    
        SETGT r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    it("a SETGT instruction with less than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 122   
        mvi r2 123
        cmp r1 r2    
        SETGT r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    it("a SETGT instruction with greater than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 124
        mvi r2 123
        cmp r1 r2    
        SETGT r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });        

    ////////////////////////////////////////////////////////////////////
    it("a SETGTE instruction with equal comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 123   
        mvi r2 123
        cmp r1 r2    
        SETGTE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });

    it("a SETGTE instruction with less than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 122   
        mvi r2 123
        cmp r1 r2    
        SETGTE r3
        halt`);

        expect(registers.R3).toEqual(0);        
    });

    it("a SETGTE instruction with greater than comparison", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r3 3
        mvi r1 124
        mvi r2 123
        cmp r1 r2    
        SETGTE r3
        halt`);

        expect(registers.R3).toEqual(1);        
    });        
    
    it("increment a number", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 1
        inc r1
        halt`);

        expect(registers.R1).toEqual(2);
    });

    it("decrement a number", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 1
        dec r1
        halt`);

        expect(registers.R1).toEqual(0);
    });

    it("store the stack pointer", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mov r1 sp
        halt`);

        expect(registers.R1).toEqual(registers.SP);
    });

    it("MOV with relative addressed source", () => {        
        execute(`
        .data
        .text
        .global start:
            start:
            mvi r1 20
            mvi r2 123

            mov [r1+130] r2
            mov r3 [r1+130]
            
            halt`);
    
            expect(registers.R3).toEqual(123);
    });

    it("MOV with negative relative addresses", () => {        
        execute(`
        .data
        .text
        .global start:
            start:
            mvi r1 120
            mvi r2 153

            mov [r1-30] r2
            mov r3 [r1-30]
            
            halt`);
    
            expect(registers.R3).toEqual(153);
    });

    it("read relative to the stack register", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mov r1 sp
        
        mvi r2 5
        push r2
        
        mvi r2 10
        push r2

        mvi r2 15
        push r2

        mov R3 [sp]
        mov R4 [sp+4]
        mov R5 [sp+8]
        
        halt`);

        expect(registers.R3).toEqual(15);
        expect(registers.R4).toEqual(10);
        expect(registers.R5).toEqual(5);
    });

    it("a simple addition program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        mvi r2 10
        add r1 r2
        halt`);

        expect(registers.R1).toEqual(30);
    });

    it("a simple subtraction program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        mvi r2 10
        sub r1 r2
        halt`);

        expect(registers.R1).toEqual(10);
    });

    it("a simple JNE greater program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        mvi r2 10
        cmp r1 r2
        jne label2:
    label1:
        mvi r1 1
        halt
    label2:
        mvi r1 2
        halt`);

        expect(registers.R1).toEqual(2);
    });

    it("a simple JNE less program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 10
        mvi r2 20
        cmp r1 r2
        jne label2:
    label1:
        mvi r1 1
        halt
    label2:
        mvi r1 2
        halt`);

        expect(registers.R1).toEqual(2);
    });

    it("a simple JNE equal program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 10
        mvi r2 10
        cmp r1 r2
        jne label2:
    label1:
        mvi r1 1
        halt
    label2:
        mvi r1 2
        halt`);

        expect(registers.R1).toEqual(1);
    });


    it("a simple subtraction with negative result", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 10
        mvi r2 20
        sub r1 r2
        halt`);

        expect(registers.R1).toEqual(-10);
    });

    it("a subtraction with literal op", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        sub r1 10
        halt`);

        expect(registers.R1).toEqual(10);
    });

    it("an and op", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0b10110101
        mvi r2 0b01111000

        mvi r3 0b00110000

        and r2 r1

        halt`);

        expect(registers.R2).toEqual(0b00110000);
        expect(registers.R2).toEqual(registers.R3);
    });

    it("an or op", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0b10110101
        mvi r2 0b01111000

        mvi r3 0b11111101

        or r2 r1

        halt`);

        expect(registers.R2).toEqual(0b11111101);
        expect(registers.R2).toEqual(registers.R3);
    });

    it("a not op", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0b10110101
        not r1

        halt`);

        expect(registers.R1).toEqual(~0b10110101);
    });

    it("an xor op", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0b10110101
        mvi r2 0b01111000
        mvi r3 0b11001101

        xor r2 r1

        halt`);

        expect(registers.R2).toEqual(0b11001101);
        expect(registers.R2).toEqual(registers.R3);
    });

    it("an xor op to zero a register", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        xor r1 r1
        halt`);

        expect(registers.R1).toEqual(0);
    });

    it("a move immediate with a zero literal", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 0
        halt`);

        expect(registers.R1).toEqual(0);
    });

    it("a subtraction with literal op and negative result", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        sub r1 30
        halt`);

        expect(registers.R1).toEqual(-10);
    });

    it("a simple loop program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 5
        mvi r2 0
        mvi r3 1

        start_loop:

        add r2 r3

        loop r1 start_loop:
        
        halt`);

        expect(registers.R2).toEqual(5);
    });

    it("a jnz loop program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 5
        mvi r2 0
        mvi r3 1

        start_loop:

        add r2 1
        dec r1        

        jnz start_loop:
        
        halt`);

        expect(registers.R2).toEqual(5);
    });

    it("a simple multiplication program", () => {
        execute(`
    .data
    .text
    .global start:
        mvi r1 123
        mvi r2 234
        start:
        mvi r3 20
        mvi r4 10
        mul r3 r4
        halt`);

        expect(registers.R3).toEqual(200);
    });

    it("a simple division program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 10
        mvi r2 2
        div r1 r2
        halt`);

        expect(registers.R1).toEqual(5);
    });

    it("a simple division program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 20
        mvi r2 10
        div r1 r2
        halt`);

        expect(registers.R1).toEqual(2);
    });

    it("an integer division program", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 5
        mvi r2 2
        div r1 r2
        halt`);

        expect(registers.R1).toEqual(2);
    });

    it("a simple division with floating point result", () => {
        execute(`
    .data
    .text
    .global start:
        start:
        mvi r1 10
        mvi r2 3
        divf r1 r2
        halt`);

        expect(registers.R1).toEqual(10/3);
    });

    it("a simple division with floating point operands", () => {
        execute(`
    .data
        .a float 31.14
        .b float 2.1
    .text
    .global start:
        start:
        ldrf r1 .a
        ldrf r2 .b
        divf r1 r2
        halt`);

        expect(registers.R1).toEqual(31.14/2.1);
    });

    it("a multiplication program using byte values in data section", () => {
        execute(`
    .data
        .x byte 10
        .y byte 6        
        .expected byte 60
    .text
    .global intro:
    intro:

        ldrb r3 .x
        ldrb r4 .y
        ldrb r6 .expected
        mul r4 r3

        halt`);

        expect(registers.R4).toEqual(registers.R6);
        expect(registers.R4).toEqual(60);
    });

    it("a multiplication program using word values in the data section", () => {
        execute(`
    .data
        .x word 10
        .y word 6        
        .expected word 60
    .text
    .global intro:
    intro:

        ldrw r3 .x
        ldrw r4 .y
        ldrw r6 .expected
        mul r4 r3

        halt`);

        expect(registers.R4).toEqual(registers.R6);
        expect(registers.R4).toEqual(60);
    });

    it("a multiplication program using long values in the data section", () => {
        execute(`
    .data
        .x long 10
        .y long 6        
        .expected long 60
    .text
    .global intro:
    intro:

        ldr r3 .x
        ldr r4 .y
        ldr r6 .expected
        mul r4 r3

        halt`);

        expect(registers.R4).toEqual(registers.R6);
        expect(registers.R4).toEqual(60);
    });

    it("a multiplication program using round float values in the data section", () => {
        execute(`
    .data
        .x float 10
        .y float 6        
        .expected float 60
    .text
    .global intro:
    intro:

        ldrf r3 .x
        ldrf r4 .y
        ldrf r6 .expected
        mul r4 r3

        halt`);

        expect(registers.R4).toEqual(registers.R6);
        expect(registers.R4).toEqual(60);
    });

    it("a multiplication program using float values in the data section", () => {
        execute(`
    .data
        .x float 10.5
        .y float 6.1        
        .expected float 64.05
    .text
    .global intro:
    intro:

        ldrf r3 .x
        ldrf r4 .y
        ldrf r6 .expected
        mulf r4 r3

        halt`);

        expect(registers.R4).toEqual(registers.R6);
        expect(registers.R4).toEqual(64.05);
    });


    it("a rudamentary function call and return program", () => {
        execute(`
    .data
    .text
    .global intro:
    intro:
        mvi r1 1
        call test:
        add r1 r2            
        halt

    test:
        mvi r2 2
        ret
    
        halt`);

        expect(registers.R1).toEqual(3);
    });

    it("a multi step function call and return program", () => {
        execute(`
    .data
    .text
    .global intro:
    intro:
        mvi r1 1
        call a:
        add r1 r2
        add r1 r3
        add r1 r4
        add r1 r5
        mov r6 r1            
        halt

    a:
        mvi r2 2
        call b:
        ret

    b:
        mvi r3 3
        call c:
        ret
        
    c:
        mvi r4 4
        call d:
        ret
        
    d:
        mvi r5 5
        ret        
    
        halt`);

        expect(registers.R6).toEqual(1+2+3+4+5);
    });

    it("mov byte from long value", () => {
        execute(`
    .data
        .a long 0b11110000101010100000111100000111
    .text
    .global intro:
    intro:
        
        ldr r1 .a
        ldrw r2 .a
        ldrb r3 .a
        ldrf r4 .a
        pushf r4
        pop r5

        halt`);

        expect(registers.R1).toEqual(0b11110000101010100000111100000111);
        expect(registers.R2).toEqual(0b0000111100000111);
        expect(registers.R3).toEqual(0b00000111);        
        expect(registers.R5).toEqual(0b11110000101010100000111100000111);
    });

    it("push long and pop bytes", () => {
        execute(`
    .data
        .a long 0b11110000101010100000111100000111
    .text
    .global intro:
    intro:
        
        ldr r1 .a
        push r1
        popb r2
        popb r3
        popb r4
        popb r5

        halt`);

        expect(registers.R1).toEqual(0b11110000101010100000111100000111);        
        expect(registers.R2).toEqual(0b00000111);        
        expect(registers.R3).toEqual(0b00001111);        
        expect(registers.R4).toEqual(0b10101010);        
        expect(registers.R5).toEqual(0b11110000);
    });

    it("push long and shift to take bytes", () => {
        execute(`
    .data
        .a long 0b11110000101010100000111100000111
    .text
    .global intro:
    intro:
        
        ldr r1 .a

        movb r2 r1
        rsh r1 8

        movb r3 r1
        rsh r1 8

        movb r4 r1
        rsh r1 8

        movb r5 r1
        rsh r1 8

        halt`);
        
        expect(registers.R2).toEqual(0b00000111);        
        expect(registers.R3).toEqual(0b00001111);        
        expect(registers.R4).toEqual(0b10101010);        
        expect(registers.R5).toEqual(0b11110000);
    });

    it("an example function with a variety parameter types", () => {
        execute(`
    .data
    .text
    .global __entrypoint:
    __entrypoint:
        MOV R6 SP				; Initialise Base Pointer
        CALL main:
        HALT
    
    main:
        PUSH R6				; save old value of stack pointer
        MOV R6 SP				; R6 is bottom of stack. Make current top of stack the bottom of the new stack frame
    ; declare variable a
    ; calculate initialisation value for variable a
        MVI R1 5				; Loading literal int
    ; reserve space on stack for variable a
        PUSH R1				; reserve space for a long variable a
    ; declare variable b
    ; calculate initialisation value for variable b
        MVIb R1 1				; Loading literal boolean
    ; reserve space on stack for variable b
        PUSHb R1				; reserve space for a byte variable b
    ; declare variable c
    ; calculate initialisation value for variable c
        MVI R1 15				; Loading literal int
    ; reserve space on stack for variable c
        PUSH R1				; reserve space for a long variable c
    ; declare variable d
    ; calculate initialisation value for variable d
        MVIb R1 0				; Loading literal boolean
    ; reserve space on stack for variable d
        PUSHb R1				; reserve space for a byte variable d
    ; Preparing to call test
    ; Pushing 4 arguments onto the stack
        MOVb R1 [R6-10]				; read variable d from the stack
        PUSHb R1
        MOV R1 [R6-9]				; read variable c from the stack
        PUSH R1
        MOVb R1 [R6-5]				; read variable b from the stack
        PUSHb R1
        MOV R1 [R6-4]				; read variable a from the stack
        PUSH R1
    ; Calling test
        CALL test:				; call function
    ; Removing arguments from stack
        POPb R3
        POP R3
        POPb R3
        POP R3
        MOV SP R6				; restore SP; now it points to old R6
        POP R6				; restore old R6; now SP is where it was before prologue
        RET
    
    test:
        PUSH R6				; save old value of stack pointer
        MOV R6 SP				; R6 is bottom of stack. Make current top of stack the bottom of the new stack frame
        MOV R1 [R6+13]				; read parameter c from the stack
        MOV SP R6				; restore SP; now it points to old R6
        POP R6				; restore old R6; now SP is where it was before prologue
        RET`, 500);

        expect(registers.R1).toEqual(15);
    });

    it("a fibonaci calculator", () => {
        execute(`
    .data
        .max long 11
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

        halt`, 500);

        expect(registers.R1).toEqual(13);
        expect(registers.R2).toEqual(21);
        expect(registers.R3).toEqual(34);
        expect(registers.R4).toEqual(55);
        expect(registers.R5).toEqual(89);
        expect(registers.R6).toEqual(144);
    });
});