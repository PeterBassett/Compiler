import Instruction, { OpcodeMode, OpcodeModes } from "../../../VirtualMachine/CPU/Instruction/Instruction";
import RAM from "../../../VirtualMachine/Memory/RAM";
import InstructionCoderVariable from "../../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { OpCodes } from "../../../VirtualMachine/CPU/Instruction/InstructionSet";

const b1111 = new OpcodeModes(new OpcodeMode(true, true), new OpcodeMode(true, true));
const b1010 = new OpcodeModes(new OpcodeMode(false, false), OpcodeMode.RegisterWithOffset);
const b0001 = new OpcodeModes(new OpcodeMode(true, false), new OpcodeMode(false, false));
const b0000 = new OpcodeModes(new OpcodeMode(false, false), new OpcodeMode(false, false));

/*
describe("The variable length instruction encoder", () => {
    const coder = new InstructionCoderVariable();

    function instruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number,
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number) : void
    {
        let encodedInstruction = coder.encodeInstruction(opcode, opcodeMode, sourceRegister, destinationRegister, destinationMemoryAddress, sourceMemoryAddress);

        let ram = new RAM(encodedInstruction.length);
        ram.blitStoreBytes(0, encodedInstruction);
        let { instruction, length } = coder.decodeInstruction(ram, 0);
        
        expect(encodedInstruction.length).toEqual(length);
        expect(opcode).toEqual(instruction.opcode);
        
        expect(instruction.opcodeMode.source.isPointer).toEqual(opcodeMode.source.isPointer, "source is pointer");
        expect(instruction.opcodeMode.source.isRegister).toEqual(opcodeMode.source.isRegister, "source is register");
        expect(instruction.opcodeMode.destination.isPointer).toEqual(opcodeMode.destination.isPointer, "destination is pointer");
        expect(instruction.opcodeMode.destination.isRegister).toEqual(opcodeMode.destination.isRegister, "destination is register");        

        expect(sourceRegister).toEqual(instruction.sourceRegister);
        expect(destinationRegister).toEqual(instruction.destinationRegister);
        expect(destinationMemoryAddress).toEqual(instruction.destinationMemoryAddress);    
        expect(sourceMemoryAddress).toEqual(instruction.sourceMemoryAddress);        
    }

    describe("takes a 6 bit opcode", () => {    
        it(" which is encoded in the first 6 bits, 1", () => {
            instruction(OpCodes.MVI, b1111, 0, 4, 0, 2);
        });

        it(" which is encoded in the first 6 bits, 1", () => {
            instruction(OpCodes.MVI, b1010, 0, 5, 20, 0);
        });
    });

    describe("takes a 6 bit opcode", () => {    
        it("which is encoded in the first 6 bits, all 1s", () => {
            instruction(0b111111, b0000, 0, 0, 0, 0);
        });

        it("which is encoded in the first 6 bits, 101010", () => {
            instruction(0b101010, b0000, 0, 0, 0, 0);
        });

        it("which is encoded in the first 6 bits, 111111", () => {
            instruction(0b111111, b0000, 0, 0, 0, 0);
        });
    });

    describe("takes a 4 bit opcode mode", () => {        
        it("mode which is encoded in the second 4 bits, 1", () => {
            instruction(0, b0001, 0, 0, 0, 0);
        });

        it("which is encoded in the second 4 bits, all 1s", () => {
            instruction(0, b1010, 0, 0, 0, 0);
        });

        it("which is encoded in the second 4 bits, 1111", () => {
            instruction(0, b1111, 0, 0, 0, 0);
        });
    });

    describe("takes a 3 bit source register", () => {        
        it("mode which is encoded in the 11th to 14th bits, 1", () => {
            instruction(0, b0000, 1, 0, 0, 0);
        });

        it("mode which is encoded in the 11th to 14th bits, all 1s", () => {
            instruction(0, b0000, 0b111, 0, 0, 0);
        });

        it("mode which is encoded in the 11th to 14th bits, 101", () => {
            instruction(0, b0000, 0b101, 0, 0, 0);
        });
    });

    describe("takes a 3 bit destination register", () => {        
        it("mode which is encoded in the 14th to 16th bits, 1", () => {
            instruction(0, b0000, 0, 1, 0,0 );
        });

        it("mode which is encoded in the 14th to 16th bits, all 1s", () => {
            instruction(0, b0000, 0, 0b111, 0, 0);
        });

        it("mode which is encoded in the 14th to 16th bits, 101", () => {
            instruction(0, b0000, 0, 0b101, 0, 0);
        });
    });

    describe("takes a 16 bit memory address", () => {        
        it("mode which is encoded in the 17th to 32nd bits, 1", () => {
            instruction(0, b0000, 0, 0, 0, 1);
        });

        it("mode which is encoded in the 17th to 32nd bits, all 1s", () => {
            instruction(0, b0000, 0, 0, 0, 0b1111111111111111);
        });

        it("mode which is encoded in the 17th to 32nd bits, 101", () => {
            instruction(0, b0000, 0, 0, 0, 0b101);
        });

        it("mode which is encoded in the 17th to 32nd bits, 1010101010101010", () => {
            instruction(0, b0000, 0, 0, 0, 0b1010101010101010);
        });
    });   
});*/