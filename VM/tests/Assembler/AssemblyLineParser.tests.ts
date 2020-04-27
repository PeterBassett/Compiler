import { AssemblyLineParser } from "../../Assembler/AssemblyLineParser";
import Instruction, { OpcodeModes, OpcodeMode } from "../../VirtualMachine/CPU/Instruction/Instruction";
import { OpCodes } from "../../VirtualMachine/CPU/Instruction/InstructionSet";
import { AssemblyLineLexer } from "../../Assembler/AssemblyLineLexer";

describe("The AssemblyLineParser class ", () => {
    function test(instruction : string, expected : Instruction)
    {
        let lexer = new AssemblyLineLexer(instruction);
        let parser = new AssemblyLineParser(lexer, true);
        
        const actual = parser.Parse();
        
        expect(actual.opcode).toEqual(expected.opcode);
        expect(actual.opcodeMode).toEqual(expected.opcodeMode);
        expect(actual.sourceRegister).toEqual(expected.sourceRegister);
        expect(actual.destinationRegister).toEqual(expected.destinationRegister);
        expect(actual.destinationMemoryAddress).toEqual(expected.destinationMemoryAddress);
        expect(actual.sourceMemoryAddress).toEqual(expected.sourceMemoryAddress);
    }

    const b1000 = new OpcodeModes(new OpcodeMode(false, false), new OpcodeMode(false, true));
    const b0010 = new OpcodeModes(new OpcodeMode(false, false), new OpcodeMode(true, false));
    const b1100 = new OpcodeModes(new OpcodeMode(false, true), new OpcodeMode(false, true));
    const b1101 = new OpcodeModes(new OpcodeMode(true, true), new OpcodeMode(false, true));
    const b1110 = new OpcodeModes(new OpcodeMode(false, true), new OpcodeMode(true, true));
    const b0100 = new OpcodeModes(new OpcodeMode(false, true), new OpcodeMode(false, false));
    const b0001 = new OpcodeModes(new OpcodeMode(true, false), new OpcodeMode(false, false));
    const b1111 = new OpcodeModes(new OpcodeMode(true, true), new OpcodeMode(true, true));
    const b1010 = new OpcodeModes(new OpcodeMode(false, false), new OpcodeMode(true, true));
    const b1011 = new OpcodeModes(new OpcodeMode(false, true), new OpcodeMode(true, true));
    
    it("parses a line of assembly with lowercase mnemonic", () => {
        test("mvi R0 555", new Instruction(OpCodes.MVI,b1000,0,0,0,555));
    });

    it("parses a line of assembly with lowercase mnemonic", () => {
        test("mvi R2 999", new Instruction(OpCodes.MVI,b1000,0,2,0,999));
    });

    it("parses a line of assembly with lowercase register", () => {
        test("MVI r2 999", new Instruction(OpCodes.MVI,b1000,0,2,0,999));
    });

    it("parses a line of assembly with only a destination register and operand", () => {
        test("MVI R2 999", new Instruction(OpCodes.MVI,b1000,0,2,0,999));
    });

    it("parses a line of assembly with source and destination registers", () => {
        test("ADD R3 R2", new Instruction(OpCodes.ADD,b1100,2,3,0,0));
    });
    
    it("parses a line of assembly with only a memory address", () => {
        test("JMP 31567", new Instruction(OpCodes.JMP,OpcodeModes.Default,0,0,0,31567));
    });

    it("parses a line of assembly with no additional information", () => {
        test("RET", new Instruction(OpCodes.RET,OpcodeModes.Default,0,0,0,0));
    });

    it("parses a line of assembly with a source register and memory address", () => {
        test("STR R4 999", new Instruction(OpCodes.STR,b1000,0,4,0,999));
    });    

    it("parses a line of assembly with only a destination register", () => {
        test("PUSH R4", new Instruction(OpCodes.PUSH,b0100,0,4,0,0));
    });

    it("parses a line of assembly which references a memory location by pointer", () => {
        test("MOV R4 [R1]", new Instruction(OpCodes.MOV,b1101,1,4,0,0));
    });

    it("parses a line of assembly which references a source pointer relative to a register with zero offset", () => {
        test("MOV R4 [R1+0]", new Instruction(OpCodes.MOV,b1101,1,4,0,0));
    });

    it("parses a line of assembly with a source pointer and destination register", () => {
        test("MOV R4 [SP+4]", new Instruction(OpCodes.MOV,b1101,7,4,0,4));
    });

    it("parses a line of assembly with a source pointer relative to the stack pointer register and destination register", () => {
        test("MOV R4 [SP+8]", new Instruction(OpCodes.MOV,b1101,7,4,0,8));
    });

    it("parses a line of assembly with a source register and destination pointer", () => {
        test("MOV [R1+8] R4", new Instruction(OpCodes.MOV,b1110,4,1,8,0));
    });

    it("parses a line of assembly which references a destination memory location by register pointer", () => {
        test("MOV [R4] R1", new Instruction(OpCodes.MOV,b1110,1,4,0,0));
    });

    it("parses a line of assembly which references both source and destination memory locations by register pointer", () => {
        test("MOV [R4] [R1]", new Instruction(OpCodes.MOV, b1111,1,4,0,0));
    });

    it("parses a line of assembly which references a destination via register pointer and source via offset register pointer", () => {
        test("MOV [R4] [R1+8]", new Instruction(OpCodes.MOV,b1111,1,4,0,8));
    });

    it("parses a line of assembly which references both source and destination via offset register pointer", () => {
        test("MOV [R4+16] [R1+8]", new Instruction(OpCodes.MOV,b1111,1,4, 16, 8));
    });

    it("parses a line of assembly with a pointer destination register and literal source", () => {
        test("STR [R4+5] 100", new Instruction(OpCodes.STR, b1010,0,4,5,100));
    }); 

    it("parses a line of assembly with a pointer destination literal and literal source", () => {
        test("STR [5] 100", new Instruction(OpCodes.STR, b0010, 0, 0, 5, 100));
    }); 

    it("parses a line of assembly with floating point number", () => {
        test("mvi R0 3.14159", new Instruction(OpCodes.MVI,b1000,0,0,0,3.14159));
    });

    it("parses a line of assembly with hex integer", () => {
        test("mvi R0 0xf0f0f0", new Instruction(OpCodes.MVI,b1000,0,0,0,0xf0f0f0));
    });

    it("parses a line of assembly with binary integer", () => {
        test("mvi R0 0b101110011", new Instruction(OpCodes.MVI,b1000,0,0,0,0b101110011));
    });

    it("parses a line of assembly with negative integer", () => {
        test("mvi R0, -1", new Instruction(OpCodes.MVI,b1000,0,0,0,-1));
    });

    it("parses a line of assembly with register relative non pointer", () => {
        test("MOV R1 R3-4", new Instruction(OpCodes.MOV,b1100,3,1,0,-4));
    });

    it("parses a line of assembly with register relative non pointer and register relative pointer", () => {
        test("MOVf [R1+0], R2+0", new Instruction(OpCodes.MOVf,b1011,2,1,0,0));
    });    

    it("parses a line of assembly with global data ref", () => {
        test("MOV R1, .s1", new Instruction(OpCodes.MOV,b1000,0,1,0,0));
    });

    it("parses a line of assembly with relative global data ref", () => {
        test("MOV R1, .s1+0", new Instruction(OpCodes.MOV,b1000,0,1,0,0));
    });        
});