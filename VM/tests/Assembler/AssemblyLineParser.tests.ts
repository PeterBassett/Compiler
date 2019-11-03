import { AssemblyLineParser } from "../../Assembler/AssemblyLineParser";
import Instruction from "../../VirtualMachine/CPU/Instruction/Instruction";
import { OpCodes } from "../../VirtualMachine/CPU/Instruction/InstructionSet";
import { AssemblyLineLexer } from "../../Assembler/AssemblyLineLexer";

describe("The AssemblyLineParser class ", () => {
    function test(instruction : string, expected : Instruction)
    {
        let lexer = new AssemblyLineLexer(instruction);
        let parser = new AssemblyLineParser(lexer);
        
        const actual = parser.Parse();
        
        expect(actual.opcode).toEqual(expected.opcode);
        expect(actual.opcodeMode).toEqual(expected.opcodeMode);
        expect(actual.sourceRegister).toEqual(expected.sourceRegister);
        expect(actual.destinationRegister).toEqual(expected.destinationRegister);
        expect(actual.memoryAddress).toEqual(expected.memoryAddress);
    }
    
    it("parses a line of assembly with lowercase mnemonic", () => {
        test("mvi R0 555", new Instruction(OpCodes.MVI,0b1000,0,0,555));
    });

    it("parses a line of assembly with lowercase mnemonic", () => {
        test("mvi R2 999", new Instruction(OpCodes.MVI,0b1000,0,2,999));
    });

    it("parses a line of assembly with lowercase register", () => {
        test("MVI r2 999", new Instruction(OpCodes.MVI,0b1000,0,2,999));
    });

    it("parses a line of assembly with only a destination register and operand", () => {
        test("MVI R2 999", new Instruction(OpCodes.MVI,0b1000,0,2,999));
    });

    it("parses a line of assembly with source and destination registers", () => {
        test("ADD R3 R2", new Instruction(OpCodes.ADD,0b1100,2,3,0));
    });
    
    it("parses a line of assembly with only a memory address", () => {
        test("JMP 31567", new Instruction(OpCodes.JMP,0,0,0,31567));
    });

    it("parses a line of assembly with no additional information", () => {
        test("RET", new Instruction(OpCodes.RET,0,0,0,0));
    });

    it("parses a line of assembly with a source register and memory address", () => {
        test("STR R4 999", new Instruction(OpCodes.STR,0b1000,0,4,999));
    });    

    it("parses a line of assembly with only a destination register", () => {
        test("PUSH R4", new Instruction(OpCodes.PUSH,0b0100,0,4,0));
    });

    it("parses a line of assembly which references a memory location by pointer", () => {
        test("MOV R4 [R1]", new Instruction(OpCodes.MOV,0b1101,1,4,0));
    });

    it("parses a line of assembly which references a source pointer relative to a register with zero offset", () => {
        test("MOV R4 [R1+0]", new Instruction(OpCodes.MOV,0b1101,1,4,0));
    });

    it("parses a line of assembly with a source pointer and destination register", () => {
        test("MOV R4 [SP+4]", new Instruction(OpCodes.MOV,0b1101,7,4,4));
    });

    it("parses a line of assembly with a source pointer relative to the stack pointer register and destination register", () => {
        test("MOV R4 [SP+8]", new Instruction(OpCodes.MOV,0b1101,7,4,8));
    });

    it("parses a line of assembly with a source register and destination pointer", () => {
        test("MOV [R1+8] R4", new Instruction(OpCodes.MOV,0b1110,4,1, 8<<8));
    });

    it("parses a line of assembly which references a destination memory location by register pointer", () => {
        test("MOV [R4] R1", new Instruction(OpCodes.MOV,0b1110,1,4,0));
    });

    it("parses a line of assembly which references both source and destination memory locations by register pointer", () => {
        test("MOV [R4] [R1]", new Instruction(OpCodes.MOV,0b1111,1,4,0));
    });

    it("parses a line of assembly which references a destination via register pointer and source via offset register pointer", () => {
        test("MOV [R4] [R1+8]", new Instruction(OpCodes.MOV,0b1111,1,4,8));
    });

    it("parses a line of assembly which references both source and destination via offset register pointer", () => {
        test("MOV [R4+16] [R1+8]", new Instruction(OpCodes.MOV,0b1111,1,4, (16<<8)+8));
    });

    it("parses a line of assembly with a pointer destination register and literal source", () => {
        test("STR [R4+5] 100", new Instruction(OpCodes.STR,0b1010,0,4,(5<<8)+100));
    }); 
});