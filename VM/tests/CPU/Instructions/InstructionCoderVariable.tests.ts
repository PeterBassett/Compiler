import Instruction from "../../../VirtualMachine/CPU/Instruction/Instruction";
import RAM from "../../../VirtualMachine/Memory/RAM";
import InstructionCoderVariable from "../../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { OpCodes } from "../../../VirtualMachine/CPU/Instruction/InstructionSet";

describe("The variable length instruction encoder", () => {

    const coder = new InstructionCoderVariable();

    function instruction(opcode : number, 
        opcodeMode : number, 
        sourceRegister : number,
        destinationRegister : number, 
        memoryAddress : number) : void
    {
        let encodedInstruction = coder.encodeInstruction(opcode, opcodeMode, sourceRegister, destinationRegister, memoryAddress);

        let ram = new RAM(encodedInstruction.length);
        ram.blitStoreBytes(0, encodedInstruction);
        let { instruction, length } = coder.decodeInstruction(ram, 0);
        
        expect(encodedInstruction.length).toEqual(length);
        expect(opcode).toEqual(instruction.opcode);
        expect(opcodeMode).toEqual(instruction.opcodeMode);
        expect(sourceRegister).toEqual(instruction.sourceRegister);
        expect(destinationRegister).toEqual(instruction.destinationRegister);
        expect(memoryAddress).toEqual(instruction.memoryAddress);        
    }

    describe("takes a 6 bit opcode", () => {    
        it(" which is encoded in the first 6 bits, 1", () => {
            instruction(OpCodes.MVI, 15, 4, 2, 0);
        });

        it(" which is encoded in the first 6 bits, 1", () => {
            instruction(OpCodes.MVI, 8, 0, 5, 20);
        });
    });

    describe("takes a 6 bit opcode", () => {    
        it("which is encoded in the first 6 bits, all 1s", () => {
            instruction(0b111111, 0, 0, 0, 0);
        });

        it("which is encoded in the first 6 bits, 101010", () => {
            instruction(0b101010, 0, 0, 0, 0);
        });

        it("which is encoded in the first 6 bits, 111111", () => {
            instruction(0b111111, 0, 0, 0, 0);
        });
    });

    describe("takes a 4 bit opcode mode", () => {        
        it("mode which is encoded in the second 4 bits, 1", () => {
            instruction(0, 1, 0, 0, 0);
        });

        it("which is encoded in the second 4 bits, all 1s", () => {
            instruction(0, 0b1111, 0, 0, 0);
        });

        it("which is encoded in the second 4 bits, 1111", () => {
            instruction(0, 0b1111, 0, 0, 0);
        });
    });

    describe("takes a 3 bit source register", () => {        
        it("mode which is encoded in the 11th to 14th bits, 1", () => {
            instruction(0, 0, 1, 0, 0);
        });

        it("mode which is encoded in the 11th to 14th bits, all 1s", () => {
            instruction(0, 0, 0b111, 0, 0);
        });

        it("mode which is encoded in the 11th to 14th bits, 101", () => {
            instruction(0, 0, 0b101, 0, 0);
        });
    });

    describe("takes a 3 bit destination register", () => {        
        it("mode which is encoded in the 14th to 16th bits, 1", () => {
            instruction(0, 0, 0, 1, 0);
        });

        it("mode which is encoded in the 14th to 16th bits, all 1s", () => {
            instruction(0, 0, 0, 0b111, 0);
        });

        it("mode which is encoded in the 14th to 16th bits, 101", () => {
            instruction(0, 0, 0, 0b101, 0);
        });
    });

    describe("takes a 16 bit memory address", () => {        
        it("mode which is encoded in the 17th to 32nd bits, 1", () => {
            instruction(0, 0, 0, 0, 1);
        });

        it("mode which is encoded in the 17th to 32nd bits, all 1s", () => {
            instruction(0, 0, 0, 0, 0b1111111111111111);
        });

        it("mode which is encoded in the 17th to 32nd bits, 101", () => {
            instruction(0, 0, 0, 0, 0b101);
        });

        it("mode which is encoded in the 17th to 32nd bits, 1010101010101010", () => {
            instruction(0, 0, 0, 0, 0b1010101010101010);
        });
    });
/*
    describe("validates its inputs", () => {    
        it("opcode cannot be negative", () => {        
            expect(() => {
                encodeInstruction(-1, 0, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part OpCode can not be negative (-1)"));
        });

        it("opcode cannot be greater than 63", () => {                
            expect(() => {
                encodeInstruction(64, 0, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part OpCode is outside range (64). Max is 63"));
        });

        it("opcodeMode cannot be negative", () => {        
            expect(() => {
                encodeInstruction(0, -1, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part OpcodeMode can not be negative (-1)"));
        });

        it("opcodeMode cannot be greater than 15", () => {
            expect(() => {
                encodeInstruction(0, 16, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part OpcodeMode is outside range (16). Max is 15"));
        });

        it("sourceRegister cannot be negative", () => {        
            expect(() => {
                encodeInstruction(0, 0, -1, 0, 0);
            }).toThrow(new RangeError("Instruction part SourceRegister can not be negative (-1)"));
        });
        it("sourceRegister cannot be greater than 7", () => {
            expect(() => {
                encodeInstruction(0, 0, 8, 0, 0);
            }).toThrow(new RangeError("Instruction part SourceRegister is outside range (8). Max is 7"));
        });

        it("destinationRegister cannot be negative", () => {        
            expect(() => {
                encodeInstruction(0, 0, 0, -1, 0);
            }).toThrow(new RangeError("Instruction part DestinationRegister can not be negative (-1)"));
        });
        it("destinationRegister cannot be greater than 7", () => {
            expect(() => {
                encodeInstruction(0, 0, 0, 8, 0);
            }).toThrow(new RangeError("Instruction part DestinationRegister is outside range (8). Max is 7"));
        });

        it("memory address cannot be negative", () => {        
            expect(() => {
                encodeInstruction(0, 0, 0, 0, -1);
            }).toThrow(new RangeError("Instruction part MemoryAddress can not be negative (-1)"));
        });
        it("memory address cannot be greater than 2^16", () => {
            expect(() => {
                encodeInstruction(0, 0, 0, 0, 65536);
            }).toThrow(new RangeError("Instruction part MemoryAddress is outside range (65536). Max is 65535"));
        });
    });
*/    
});