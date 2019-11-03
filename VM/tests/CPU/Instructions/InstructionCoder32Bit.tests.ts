import InstructionCoder32Bit from "../../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import Instruction from "../../../VirtualMachine/CPU/Instruction/Instruction";
import RAM from "../../../VirtualMachine/Memory/RAM";

describe("The 32-bit instruction encoder", () => {

    const coder = new InstructionCoder32Bit();

    function encodeInstruction(opcode : number, 
        opcodeMode : number, 
        sourceRegister : number,
        destinationRegister : number, 
        memoryAddress : number) : number
    {
        let actual = coder.encodeInstruction(opcode, opcodeMode, sourceRegister, destinationRegister, memoryAddress);

        let instruction = 0;

        instruction |= actual[0] << 0;
        instruction |= actual[1] << 8;
        instruction |= actual[2] << 16;
        instruction |= actual[3] << 24;

        return instruction;
    }

    describe("takes a 6 bit opcode", () => {    
        it(" which is encoded in the first 6 bits, 1", () => {
            let actual = encodeInstruction(1, 0, 0, 0, 0);

            expect(actual).toEqual(1);
        });

        it("which is encoded in the first 6 bits, all 1s", () => {
            let actual = encodeInstruction(0b111111, 0, 0, 0, 0);

            expect(actual).toEqual(0b111111);
        });

        it("which is encoded in the first 6 bits, 101010", () => {
            let actual = encodeInstruction(0b101010, 0, 0, 0, 0);

            expect(actual).toEqual(0b101010);
        });

        it("which is encoded in the first 6 bits, 111111", () => {
            let actual = encodeInstruction(0b111111, 0, 0, 0, 0);

            expect(actual).toEqual(0b111111);
        });
    });

    describe("takes a 4 bit opcode mode", () => {        
        it("mode which is encoded in the second 4 bits, 1", () => {
            let actual = encodeInstruction(0, 1, 0, 0, 0);

            expect(actual).toEqual(0b1000000);
        });

        it("which is encoded in the second 4 bits, all 1s", () => {
            let actual = encodeInstruction(0, 0b1111, 0, 0, 0);

            expect(actual).toEqual(0b1111000000);
        });

        it("which is encoded in the second 4 bits, 1111", () => {
            let actual = encodeInstruction(0, 0b1111, 0, 0, 0);

            expect(actual).toEqual(0b1111000000);
        });
    });

    describe("takes a 3 bit source register", () => {        
        it("mode which is encoded in the 11th to 14th bits, 1", () => {
            let actual = encodeInstruction(0, 0, 1, 0, 0);

            expect(actual).toEqual(0b10000000000);
        });

        it("mode which is encoded in the 11th to 14th bits, all 1s", () => {
            let actual = encodeInstruction(0, 0, 0b111, 0, 0);

            expect(actual).toEqual(0b1110000000000);
        });

        it("mode which is encoded in the 11th to 14th bits, 101", () => {
            let actual = encodeInstruction(0, 0, 0b101, 0, 0);

            expect(actual).toEqual(0b1010000000000);
        });
    });

    describe("takes a 3 bit destination register", () => {        
        it("mode which is encoded in the 14th to 16th bits, 1", () => {
            let actual = encodeInstruction(0, 0, 0, 1, 0);

            expect(actual).toEqual(0b10000000000000);
        });

        it("mode which is encoded in the 14th to 16th bits, all 1s", () => {
            let actual = encodeInstruction(0, 0, 0, 0b111, 0);

            expect(actual).toEqual(0b1110000000000000);
        });

        it("mode which is encoded in the 14th to 16th bits, 101", () => {
            let actual = encodeInstruction(0, 0, 0, 0b101, 0);

            expect(actual).toEqual(0b1010000000000000);
        });
    });

    describe("takes a 16 bit memory address", () => {        
        it("mode which is encoded in the 17th to 32nd bits, 1", () => {
            let actual = encodeInstruction(0, 0, 0, 0, 1);

            expect(actual).toEqual(0b10000000000000000);
        });

        it("mode which is encoded in the 17th to 32nd bits, all 1s", () => {
            let actual = encodeInstruction(0, 0, 0, 0, 0b1111111111111111);

            // have to use shift here because 
            // 0b11111111111111110000000000000000 would be interpreted at two complement -65536
            // 0b00000000000000001111111111111111 !!!
            expect(actual).toEqual(0b1111111111111111 << 16);
        });

        it("mode which is encoded in the 17th to 32nd bits, 101", () => {
            let actual = encodeInstruction(0, 0, 0, 0, 0b101);

            expect(actual).toEqual(0b101 << 16);
        });

        it("mode which is encoded in the 17th to 32nd bits, 1010101010101010", () => {
            let actual = encodeInstruction(0, 0, 0, 0, 0b1010101010101010);

            // have to use shift here because of twos complement reason detailed above
            expect(actual).toEqual(0b1010101010101010 << 16); 
        });
    });

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
});

/* ------------------------------------------------------------------------------------ */

describe("The instruction decoder takes an encoded instruction", () => {    

    let expectInstruction = (inst : Instruction, 
        opcode : number,
        opcodeMode : number,
        sourceRegister : number,
        destinationRegister : number,
        memoryAddress : number) =>
        {
            expect(inst.opcode).toEqual(opcode, "A");
            expect(inst.opcodeMode).toEqual(opcodeMode, "A");
            expect(inst.sourceRegister).toEqual(sourceRegister, "A");            
            expect(inst.destinationRegister).toEqual(destinationRegister, "A");
            expect(inst.memoryAddress).toEqual(memoryAddress, "A");
        };

    let decode = (instruction : number, 
        opcode : number,
        opcodeMode : number,
        sourceRegister : number,
        destinationRegister : number,
        memoryAddress : number) => {

        let coder = new InstructionCoder32Bit();        
        let ram = new RAM(4);
        ram.storeDWord(0, instruction);
        let { instruction : actual, length } = coder.decodeInstruction(ram, 0);

        expectInstruction(actual, 
            opcode,
            opcodeMode,
            sourceRegister,
            destinationRegister,
            memoryAddress);
    }

    describe("and returns its 6 bit opcode", () => {    
        it("which is taken from the first 6 bits, 1", () => {
            decode(0b1,
                   1, 0, 0, 0, 0);
        });

        it("which is taken from the first 6 bits, all 1s", () => {
            decode(0b111111,
                   0b111111, 0, 0, 0, 0);
        });

        it("which is taken from the first 6 bits, 101010", () => {
            decode(0b101010,
                   0b101010, 0, 0, 0, 0);
        });
    });

    describe("takes a 4 bit opcode mode", () => {        
        it("which is taken from the second 4 bits, 1", () => {
            decode(0b1000000,
                   0, 1, 0, 0, 0);
        });

        it("which is taken from the second 4 bits, all 1s", () => {
            decode(0b1111000000,
                   0, 0b1111, 0, 0, 0);
        });

        it("which is taken from the second 4 bits, 1010", () => {
            decode(0b1010000000,
                   0, 0b1010, 0, 0, 0);
        });

        it("which is taken from the second 4 bits, 1111", () => {
            decode(0b1111000000,
                   0, 0b1111, 0, 0, 0);
        });
    });

    describe("takes a 3 bit source register", () => {        
        it("mode which is taken from the 11th to 14th bits, 1", () => {
            decode(0b10000000000,
                   0, 0, 1, 0, 0);
        });

        it("mode which is taken from the 11th to 14th bits, all 1s", () => {
            decode(0b1110000000000,
                   0, 0, 0b111, 0, 0);
        });

        it("mode which is taken from the 11th to 14th bits, 101", () => {
            decode(0b1010000000000,
                   0, 0, 0b101, 0, 0);
        });
    });

    describe("takes a 3 bit destination register", () => {        
        it("mode which is taken from the 14th to 16th bits, 1", () => {
            decode(0b10000000000000,
                   0, 0, 0, 1, 0);
        });

        it("mode which is taken from the 14th to 16th bits, all 1s", () => {
            decode(0b1110000000000000,
                   0, 0, 0, 0b111, 0);
        });

        it("mode which is taken from the 14th to 16th bits, 101", () => {
            decode(0b1010000000000000,
                   0, 0, 0, 0b101, 0);
        });
    });

    describe("takes a 16 bit memory address", () => {        
        it("mode which is taken from the 17th to 32nd bits, 1", () => {
            decode(0b1 << 16,
                   0, 0, 0, 0, 1);
        });

        it("mode which is taken from the 17th to 32nd bits, all 1s", () => {
            // have to use shift here because 
            // 0b11111111111111110000000000000000 would be interpreted at two complement -65536
            // 0b00000000000000001111111111111111 !!!
            decode(0b1111111111111111 << 16,
                   0, 0, 0, 0, 0b1111111111111111);
        });

        it("mode which is taken from the 17th to 32nd bits, 101", () => {
            decode(0b101 << 16,
                   0, 0, 0, 0, 0b101);
        });

        it("mode which is taken from the 17th to 32nd bits, 1010101010101010", () => {
            decode(0b1010101010101010 << 16,
                   0, 0, 0, 0, 0b1010101010101010);
        });
    });
});