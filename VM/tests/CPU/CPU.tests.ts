import CPU from "../../VirtualMachine/CPU/CPU";
import * as helpers from "../helpers";
import RAM from "../../VirtualMachine/Memory/RAM";
import RegisterBank from "../../VirtualMachine/CPU/RegisterBank";
import InstructionCoder32Bit from "../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import { OpCodes as Op, Registers as Reg } from "../../VirtualMachine/CPU/Instruction/InstructionSet";
import { encodeInstructionOperand, opCodeMode } from "../../Assembler/AssemblyLineParser";
import Flags from "../../VirtualMachine/CPU/Flags";

describe("A CPU", () => {
    let ram : RAM;
    let registers : RegisterBank;
    let flags : Flags;
    let instructionCoder : InstructionCoder32Bit;
    let ramSize = 1 << 16;
    let cpu : CPU;
    let ip : number;
    
    beforeEach(() => {
        ram = new RAM(ramSize);
        registers = new RegisterBank(ramSize);
        flags = new Flags();
        instructionCoder = new InstructionCoder32Bit();
        ip = 0;

        cpu = new CPU(ram, registers, flags, instructionCoder);
    });

    function instruction(opcode : number,
        sourceRegister : number,
        destinationRegister : number, 
        memoryAddress : number): number
    {
        return rinstruction(opcode, sourceRegister, 0, destinationRegister, 0, memoryAddress);
    }

    function rinstruction(opcode : number,
        sourceRegister : number,
        sourceOffset : number,
        destinationRegister : number, 
        destinationOffset : number,
        memoryAddress : number = 0): number
    {
        //var opcodeMode = opCodeMode(destinationOffset > 0, !!sourceRegister, 1);
        //opcodeMode |= opCodeMode(sourceOffset > 0, !!destinationRegister, 0);        

        var opcodeMode = opCodeMode(sourceOffset != 0, !!sourceRegister, 0);
        opcodeMode |= opCodeMode(destinationOffset != 0, !!destinationRegister, 1);        

        let operand = encodeInstructionOperand(destinationOffset, sourceOffset, destinationOffset != 0 && sourceOffset != 0);

        let instruction = instructionCoder.encodeInstruction(opcode,
            opcodeMode, 
            sourceRegister,
            destinationRegister, 
            operand | memoryAddress);

        ram.blitStoreBytes(ip, instruction); 
        
        ip += instruction.length;

        return ip;
    }

    it("has a resonable number of opcodes", () => {
        let keys = Object.keys(Op)
                        .map(k => Op[k as any] as unknown)
                        .filter(v => typeof v === "number") as number[];
        
        let maxOpcode = Math.max(...keys);

        expect(maxOpcode).toBeLessThanOrEqual(0b111111);
    });

    it("has an MVI instruction which stores a value in a register (R1)", () => {
        instruction(Op.MVI, 0, Reg.R1, 123);

        cpu.step();

        expect(registers.R1).toEqual(123);
    });

    it("has an MVI instruction which stores a value in a register (R2)", () => {
        instruction(Op.MVI, 0, Reg.R2, 234);

        cpu.step();

        expect(registers.R2).toEqual(234);
    });

    it("has an MVI instruction which stores a value in a register (R3)", () => {
        instruction(Op.MVI, 0, Reg.R3, 5);

        cpu.step();

        expect(registers.R3).toEqual(5);
    });
    
    it("has an STR instruction which stores a value in a memory address (1000) from a register (R2)", () => {
        instruction(Op.MVI, 0, Reg.R2, 234);
        instruction(Op.STR, 0, Reg.R2, 1000);

        cpu.step();

        expect(ram.readByte(1000)).toEqual(0);
                
        cpu.step();

        expect(ram.readByte(1000)).toEqual(234);
    });

    it("has an LDR instruction which loads a value from a memory address (1000) into a register (R3)", () => {
        instruction(Op.MVI, 0, Reg.R2, 234);
        instruction(Op.STR, 0, Reg.R2, 1000);
        instruction(Op.MVI, 0, Reg.R2, 0);
        instruction(Op.LDR, 0, Reg.R3, 1000);

        cpu.step();

        expect(registers.R2).toEqual(234);
        expect(ram.readByte(1000)).toEqual(0);
                
        cpu.step();

        expect(ram.readByte(1000)).toEqual(234);

        cpu.step();

        expect(registers.R2).toEqual(0);

        cpu.step();

        expect(registers.R3).toEqual(234);
    });

    it("has an MOV instruction which moves a value from the source register R1 to the destination register R2", () => {
        instruction(Op.MVI, 0, Reg.R1, 234);
        instruction(Op.MOV, Reg.R1, Reg.R2, 0);
    
        cpu.step();

        expect(registers.R1).toEqual(234);
        expect(registers.R2).toEqual(0);
                
        cpu.step();

        expect(registers.R1).toEqual(234);
        expect(registers.R2).toEqual(234);
    });

    it("has a PUSH instruction which moves a value from the destination register (R1) to the top of the stack (SP) and decrements the stack", () => {
        instruction(Op.MVI, 0, Reg.R1, 234);
        instruction(Op.PUSH, 0, Reg.R1, 0);

        const oldSP = registers.SP;

        cpu.step();
        
        expect(registers.R1).toEqual(234);        
        
        cpu.step();

        expect(ram.readByte(registers.SP)).toEqual(234);
        expect(registers.SP).toBeLessThan(oldSP);
        expect(registers.R1).toEqual(234);
    });

    it("has a POP instruction which moves a value from the top of the stack (SP) to a register (R4) and increments the stack", () => {
        instruction(Op.MVI, 0, Reg.R1, 234);
        instruction(Op.PUSH, 0, Reg.R1, 0);
        instruction(Op.POP, 0, Reg.R4, 0);

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(234);        

        const oldSP = registers.SP;

        cpu.step();

        expect(registers.R4).toEqual(234);

        expect(oldSP + 4).toEqual(registers.SP);
    });

    it("has a JMP instruction which move the IP to a specific location", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.JMP, 0, 0, 20); // memory address of the below marked instruction
        instruction(Op.MVI, 0, Reg.R1, 4);
        instruction(Op.MVI, 0, Reg.R1, 6);
        instruction(Op.MVI, 0, Reg.R1, 8);
        instruction(Op.MVI, 0, Reg.R1, 10); // this one here!
        
        // only three instructions. we are skipping the middle ones
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);        
    });

    it("has a JMR instruction which move the IP to a specific location", () => {
        instruction(Op.MVI, 0, Reg.R1, 20);
        instruction(Op.JMR, 0, Reg.R1, 0); // memory address of the below marked instruction
        instruction(Op.MVI, 0, Reg.R1, 4);
        instruction(Op.MVI, 0, Reg.R1, 6);
        instruction(Op.MVI, 0, Reg.R1, 8);
        instruction(Op.MVI, 0, Reg.R1, 11); // this one here!
        
        // only three instructions. we are skipping the middle ones
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);        
    });

    it("has a JLT instruction which moves the IP to an address if " +
       "the destination register (R2) is less than a source register. True", () => {
        instruction(Op.MVI, 0, Reg.R1, 1);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.JLT, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // false value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) true value
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(0);
        expect(registers.R5).toEqual(1000);
    });

    it("has a JLT instruction which moves the IP to a label if the zero and negative flags are set. False", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R1, Reg.R2, 0);
        instruction(Op.JLT, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // false value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) true value. We will hit the one above however
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(10);
        expect(registers.R5).toEqual(0);
    });

    it("has a JEQ instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is equal to than R1 (always R1). false", () => {
        instruction(Op.MVI, 0, Reg.R1, 1);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R1, Reg.R2, 0);
        instruction(Op.JEQ, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) false value
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(10);
        expect(registers.R5).toEqual(0);
    });

    it("has a JEQ instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is equal to than R1 (always R1). true", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R1, Reg.R2, 0);
        instruction(Op.JEQ, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value. We will hit the one below however
        instruction(Op.MVI, 0, Reg.R5, 1000); // false value. 
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(0);
        expect(registers.R5).toEqual(1000);
    });

    it("has a JNE instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is not equal to than R1 (always R1). false", () => {
        instruction(Op.MVI, 0, Reg.R1, 1);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.JNE, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) false value
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(0);
        expect(registers.R5).toEqual(1000);
    });

    it("has a JNE instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is equal to than R1 (always R1). true", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.JNE, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value.
        instruction(Op.MVI, 0, Reg.R5, 1000); // false value. 
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(10);
        expect(registers.R5).toEqual(0);
    });

    it("has a JGE instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is greater than or equal to R1 (always R1). less than", () => {
        instruction(Op.MVI, 0, Reg.R1, 1);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.JGE, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) false value
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(10);
        expect(registers.R5).toEqual(0);
    });

    it("has a JGE instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is greater than or equal to R1 (always R1). equal", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.JGE, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) false value
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(0);
        expect(registers.R5).toEqual(1000);
    });

    it("has a JGE instruction which moves the IP to the source register (R3) if " +
       "the destination register (R2) is greater than or equal to R1 (always R1). greater", () => {
        instruction(Op.MVI, 0, Reg.R1, 3);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.JGE, 0, 0, 20); 
        instruction(Op.MVI, 0, Reg.R4, 10);   // true value
        instruction(Op.MVI, 0, Reg.R5, 1000); // (THIS ONE) false value
        
        // only 5 instructions. only executing one last one
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R4).toEqual(0);
        expect(registers.R5).toEqual(1000);
    });

    it("has an ADD instruction which adds a source register (R1) to a destination register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 3);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.ADD, Reg.R1, Reg.R2, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(3);
        expect(registers.R2).toEqual(5);
    });

    it("has an SUB instruction which subtracts a source register (R1) from a destination register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 13);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.SUB, Reg.R2, Reg.R1, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(2);
    });

    it("has an MUL instruction which multiplies a destination register (R1) by a source register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 13);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.MUL, Reg.R2, Reg.R1, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(26);
        expect(registers.R2).toEqual(2);
    });

    it("has an DIV instruction which divides a destination register (R1) by a source register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 30);
        instruction(Op.MVI, 0, Reg.R2, 2);
        instruction(Op.DIV, Reg.R2, Reg.R1, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(15);
        expect(registers.R2).toEqual(2);
    });

    it("has a DIVf instruction which divides a source register (R1) by a destination register (R2) " +
       "and stores the result in the destination register. Floating Point Test", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.MVI, 0, Reg.R2, 13);
        instruction(Op.DIVf, Reg.R1, Reg.R2, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(2);
        expect(registers.R2).toEqual(6.5); // NOTE THE DECIMAL NUMBER HERE IN THE REGISTER
        // TODO FLOATING POINT MATH OPS
    });

    it("has an DIV instruction which divides a source register (R1) by a destination register (R2) " +
        "and stores the result in the destination register. Floating Point Test", () => {
        instruction(Op.MVI, 0, Reg.R1, 2);
        instruction(Op.MVI, 0, Reg.R2, 13);
        instruction(Op.DIV, Reg.R1, Reg.R2, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(2);
        expect(registers.R2).toEqual(6); // NOTE THE RESULT IS NOT 6.5. INTEGER MATH.
    });

    it("has an NEG instruction which numerically negates the destination register (R1) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 13);
        instruction(Op.NEG, 0, Reg.R1, 0); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(-13);
    });

    it("has an INC instruction which adds 1 to the destination register (R1) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 13);
        instruction(Op.INC, 0, Reg.R1, 0); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(14);
    });

    it("has an DEC instruction which subtracts 1 from the destination register (R1) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 13);
        instruction(Op.DEC, 0, Reg.R1, 0); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(12);
    });

    it("has an DEC instruction which subtracts 1 from the destination register (R1) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 0);
        instruction(Op.DEC, 0, Reg.R1, 0); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(-1);
    });

    it("has an DEC instruction which subtracts 1 from the destination register (R1) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 0);
        instruction(Op.DEC, 0, Reg.R1, 0); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(-1);
    });

    it("has an LSH instruction which left shifts a destination register (R1) by a value", () => {
        instruction(Op.MVI, 0, Reg.R1, 256);
        instruction(Op.LSH, 0, Reg.R1, 2); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(1024);
    });

    it("has an LSH instruction which left shifts a destination register (R1) by a value", () => {
        instruction(Op.MVI, 0, Reg.R1, 18);
        instruction(Op.LSH, 0, Reg.R1, 1); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(36);
    });

    it("has an RSH instruction which right shifts a destination register (R1) by a value", () => {
        instruction(Op.MVI, 0, Reg.R1, 256);
        instruction(Op.RSH, 0, Reg.R1, 2); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(64);
    });

    it("has an LSH instruction which left shifts a destination register (R1) by a value", () => {
        instruction(Op.MVI, 0, Reg.R1, 18);
        instruction(Op.RSH, 0, Reg.R1, 1); 

        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(9);
    });

    it("has an AND instruction which bitwise ands a source register (R1) with a destination register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 6);
        instruction(Op.MVI, 0, Reg.R2, 13);
        instruction(Op.AND, Reg.R1, Reg.R2, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R2).toEqual(4);
    });

    it("has an OR instruction which binary ors a source register (R1) with a destination register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 6);
        instruction(Op.MVI, 0, Reg.R2, 13);
        instruction(Op.OR, Reg.R1, Reg.R2, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R2).toEqual(15);
    });

    it("has an XOR instruction which binary xors a source register (R1) with a destination register (R2) " +
       "and stores the result in the destination register", () => {
        instruction(Op.MVI, 0, Reg.R1, 6);
        instruction(Op.MVI, 0, Reg.R2, 13);
        instruction(Op.XOR, Reg.R1, Reg.R2, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R2).toEqual(11);
    });

    it("has an NOT instruction which binary nots a destination register (R2) " +
       "and stores the result in the destination register", () => {        
        instruction(Op.MVI, 0, Reg.R2, 13);
        instruction(Op.NOT, 0, Reg.R2, 0); 

        cpu.step();
        cpu.step();

        expect(registers.R2).toEqual(-14);
    });    

    it("has an SWAP instruction which transposes the values held in two registers", () => {        
        instruction(Op.MVI, 0, Reg.R5, 13);
        instruction(Op.MVI, 0, Reg.R6, 213);
        instruction(Op.SWAP, Reg.R5, Reg.R6, 0); 

        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R5).toEqual(213);
        expect(registers.R6).toEqual(13);        
    });    

    it("MOV with relative addressed destination", () => {        
        instruction(Op.MVI, 0, Reg.R1, 20);
        instruction(Op.MVI, 0, Reg.R2, 123);
        rinstruction(Op.MOV, Reg.R2, 0, Reg.R1, 30);
        instruction(Op.LDR, 0, Reg.R3, 50);
        
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R3).toEqual(123);       
    });    

    it("MOV with negative relative addressed destination", () => {        
        instruction(Op.MVI, 0, Reg.R1, 60);
        instruction(Op.MVI, 0, Reg.R2, 123);
        rinstruction(Op.MOV, Reg.R2, 0, Reg.R1, -10);
        instruction(Op.LDR, 0, Reg.R3, 50);
        
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R3).toEqual(123);       
    });    

    it("MOV with relative addressed source", () => {        
        instruction(Op.MVI, 0, Reg.R1, 20);
        instruction(Op.MVI, 0, Reg.R2, 123);
        rinstruction(Op.MOV, Reg.R2, 0, Reg.R1, 30);
        rinstruction(Op.MOV, Reg.R1, 30, Reg.R3, 0);
        
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R3).toEqual(123);
    }); 

///////////////////////////////////////////////////////////////////////////////    
    it("CMP and SETE with equal operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    }); 

    it("CMP and SETE with different operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    ///////////////////////////////////////////////////////////////////////////////    
    it("CMP and SETNE with equal operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETNE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    it("CMP and SETNE with different operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETNE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    });    
    
///////////////////////////////////////////////////////////////////////////////    
    it("CMP and SETLT with > operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETLT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    it("CMP and SETLT with < operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 9);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETLT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(9);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    }); 

    it("CMP and SETLT with = operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETLT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    });     
/////////////////////////////////////////////////////////////////////////
    it("CMP and SETLTE with > operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETLT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    it("CMP and SETLTE with < operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 9);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETLTE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(9);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    }); 

    it("CMP and SETLTE with = operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETLTE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    });     

    /////////////////////////////////////////////////////////////////////////
    it("CMP and SETGT with > operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    }); 

    it("CMP and SETGT with < operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 9);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(9);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    it("CMP and SETGT with = operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    });     

    /////////////////////////////////////////////////////////////////////////
    it("CMP and SETGTE with > operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGTE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    }); 

    it("CMP and SETGTE with < operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 9);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGTE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(9);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    it("CMP and SETGTE with = operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGTE, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    });     

    /////////////////////////////////////////////////////////////////////////
    it("CMP and SETGT with > operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 11);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(11);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(1);
    }); 

    it("CMP and SETGT with < operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 9);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(9);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    }); 

    it("CMP and SETGT with = operands", () => {        
        instruction(Op.MVI, 0, Reg.R1, 10);
        instruction(Op.MVI, 0, Reg.R2, 10);
        instruction(Op.MVI, 0, Reg.R3, 5);
        instruction(Op.CMP, Reg.R2, Reg.R1, 0);
        instruction(Op.SETGT, 0, Reg.R3, 0);

        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();
        cpu.step();

        expect(registers.R1).toEqual(10);
        expect(registers.R2).toEqual(10);
        expect(registers.R3).toEqual(0);
    });     

    function testFlagsOnMathOp(op : number, operand1:number, operand2:number, expectedZero : boolean, expectedNeg : boolean)
    {
        let op1Negative = operand1 < 0;
        instruction(Op.MVI, 0, Reg.R1, Math.abs(operand1));
        if(op1Negative)
            instruction(Op.NEG, 0, Reg.R1, 0);

        let op2Negative = operand2 < 0;
        instruction(Op.MVI, 0, Reg.R2, Math.abs(operand2));
        if(op2Negative)
            instruction(Op.NEG, 0, Reg.R2, 0);

        instruction(op, Reg.R2, Reg.R1, 0);
        
        instruction(Op.HALT, 0, 0, 0);
        
        try{
            while(true)
                cpu.step();        
        }
        catch(e){
        }

        expect(flags.Negative).toEqual(expectedNeg);
        expect(flags.Zero).toEqual(expectedZero);        
    }

    it("ADD sets flags on positive result", () => {        
        testFlagsOnMathOp(Op.ADD, 1, 2, false, false);
    }); 

    it("ADD sets flags on zero result", () => {        
        testFlagsOnMathOp(Op.ADD, 2, 2, false, false);
    }); 

    it("ADD sets flags on zero result", () => {        
        testFlagsOnMathOp(Op.ADD, 2, -2, true, false);
    }); 

    it("ADD sets flags on negative result", () => {        
        testFlagsOnMathOp(Op.ADD, 2, -3, false, true);
    });

    it("SUB sets flags on positive result", () => {        
        testFlagsOnMathOp(Op.SUB, 2, 1, false, false);
    }); 

    it("SUB sets flags on zero result", () => {        
        testFlagsOnMathOp(Op.SUB, 2, 2, true, false);
    }); 

    it("SUB sets flags on negative result", () => {        
        testFlagsOnMathOp(Op.SUB, 2, 3, false, true);
    });
    
    it("CMP sets flags on greater than result", () => {        
        testFlagsOnMathOp(Op.CMP, 2, 1, false, false);
    }); 

    it("CMP sets flags on equal result", () => {        
        testFlagsOnMathOp(Op.CMP, 2, 2, true, false);
    }); 

    it("CMP sets flags on less than result", () => {        
        testFlagsOnMathOp(Op.CMP, 2, 3, false, true);
    });

    function testFlagsOnMathOpWithLiteralSecondOperand(op : number, operand1:number, operand2:number, expectedValue:number, expectedZero : boolean, expectedNeg : boolean)
    {
        let op1Negative = operand1 < 0;
        instruction(Op.MVI, 0, Reg.R1, Math.abs(operand1));
        if(op1Negative)
            instruction(Op.NEG, 0, Reg.R1, 0);

        rinstruction(op, 0, 0, Reg.R1, 0, operand2);
        
        instruction(Op.HALT, 0, 0, 0);

        try{
            while(true)
                cpu.step();
        }
        catch(e){
        }

        expect(registers.R1).toEqual(expectedValue);
        expect(flags.Negative).toEqual(expectedNeg);
        expect(flags.Zero).toEqual(expectedZero);        
    }

    it("SUB sets flags on positive result with literal operand", () => {        
        testFlagsOnMathOpWithLiteralSecondOperand(Op.SUB, 3, 2, 1, false, false);
    });

    it("SUB sets flags on negative result with literal operand", () => {        
        testFlagsOnMathOpWithLiteralSecondOperand(Op.SUB, 1, 2, -1, false, true);
    });

    it("SUB sets flags on zero result with literal operand", () => {        
        testFlagsOnMathOpWithLiteralSecondOperand(Op.SUB, 2, 2, 0, true, false);
    });
    
    it("ADD sets flags on positive result with literal operand", () => {        
        testFlagsOnMathOpWithLiteralSecondOperand(Op.ADD, 1, 2, 3, false, false);
    });

    it("ADD sets flags on zero result with literal operand", () => {        
        testFlagsOnMathOpWithLiteralSecondOperand(Op.ADD, 0, 0, 0, true, false);
    });
});