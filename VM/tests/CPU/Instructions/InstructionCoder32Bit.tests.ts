import InstructionCoder32Bit from "../../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import Instruction, { OpcodeModes, OpcodeMode } from "../../../VirtualMachine/CPU/Instruction/Instruction";
import RAM from "../../../VirtualMachine/Memory/RAM";

const b0000 = new OpcodeModes(OpcodeMode.Default, OpcodeMode.Default);
const b1111 = new OpcodeModes(OpcodeMode.RegisterWithOffset, OpcodeMode.RegisterWithOffset);
const b0001 = new OpcodeModes(OpcodeMode.Pointer, OpcodeMode.Default);
const b1010 = new OpcodeModes(OpcodeMode.Default, OpcodeMode.RegisterWithOffset);

describe("The 32-bit instruction encoder", () => {    
    const coder = new InstructionCoder32Bit();

    function encodeInstruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number,
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number) : number
    {
        let actual = coder.encodeInstruction(opcode, 
            opcodeMode, 
            sourceRegister, 
            destinationRegister, 
            destinationMemoryAddress, 
            sourceMemoryAddress);

        let instruction = 0;

        instruction |= actual[0] << 0;
        instruction |= actual[1] << 8;
        instruction |= actual[2] << 16;
        instruction |= actual[3] << 24;

        return instruction;
    }

    describe("takes a 6 bit opcode", () => {    
        it(" which is encoded in the first 6 bits, 1", () => {
            let actual = encodeInstruction(1, b0000, 0, 0, 0, 0);

            expect(actual).toEqual(1);
        });

        it("which is encoded in the first 6 bits, all 1s", () => {
            let actual = encodeInstruction(0b111111, b0000, 0, 0, 0, 0);

            expect(actual).toEqual(0b111111);
        });

        it("which is encoded in the first 6 bits, 101010", () => {
            let actual = encodeInstruction(0b101010, b0000, 0, 0, 0, 0);

            expect(actual).toEqual(0b101010);
        });

        it("which is encoded in the first 6 bits, 111111", () => {
            let actual = encodeInstruction(0b111111, b0000, 0, 0, 0, 0);

            expect(actual).toEqual(0b111111);
        });
    });

    describe("takes a 4 bit opcode mode", () => {        
        it("mode which is encoded in the second 4 bits, 1", () => {
            let actual = encodeInstruction(0, b0001, 0, 0, 0, 0);

            expect(actual).toEqual(0b1000000);
        });

        it("which is encoded in the second 4 bits, all 1s", () => {
            let actual = encodeInstruction(0, b1111, 0, 0, 0, 0);

            expect(actual).toEqual(0b1111000000);
        });

        it("which is encoded in the second 4 bits, 1111", () => {
            let actual = encodeInstruction(0, b1111, 0, 0, 0, 0);

            expect(actual).toEqual(0b1111000000);
        });
    });

    describe("takes a 3 bit source register", () => {        
        it("mode which is encoded in the 11th to 14th bits, 1", () => {
            let actual = encodeInstruction(0, b0000, 1, 0, 0, 0);

            expect(actual).toEqual(0b10000000000);
        });

        it("mode which is encoded in the 11th to 14th bits, all 1s", () => {
            let actual = encodeInstruction(0, b0000, 0b111, 0, 0, 0);

            expect(actual).toEqual(0b1110000000000);
        });

        it("mode which is encoded in the 11th to 14th bits, 101", () => {
            let actual = encodeInstruction(0, b0000, 0b101, 0, 0, 0);

            expect(actual).toEqual(0b1010000000000);
        });
    });

    describe("takes a 3 bit destination register", () => {        
        it("mode which is encoded in the 14th to 16th bits, 1", () => {
            let actual = encodeInstruction(0, b0000, 0, 1, 0, 0);

            expect(actual).toEqual(0b10000000000000);
        });

        it("mode which is encoded in the 14th to 16th bits, all 1s", () => {
            let actual = encodeInstruction(0, b0000, 0, 0b111, 0, 0);

            expect(actual).toEqual(0b1110000000000000);
        });

        it("mode which is encoded in the 14th to 16th bits, 101", () => {
            let actual = encodeInstruction(0, b0000, 0, 0b101, 0, 0);

            expect(actual).toEqual(0b1010000000000000);
        });
    });

    describe("takes a 16 bit memory address", () => {        
        it("mode which is encoded in the 17th to 32nd bits, 1", () => {
            let actual = encodeInstruction(0, b0000, 0, 0, 0, 1);

            expect(actual).toEqual(0b10000000000000000);
        });

        it("mode which is encoded in the 17th to 32nd bits, all 1s", () => {
            let actual = encodeInstruction(0, b0000, 0, 0, 0, 0b1111111111111111);

            // have to use shift here because 
            // 0b11111111111111110000000000000000 would be interpreted at two complement -65536
            // 0b00000000000000001111111111111111 !!!
            expect(actual).toEqual(0b1111111111111111 << 16);
        });

        it("mode which is encoded in the 17th to 32nd bits, 101", () => {
            let actual = encodeInstruction(0, b0000, 0, 0, 0, 0b101);

            expect(actual).toEqual(0b101 << 16);
        });

        it("mode which is encoded in the 17th to 32nd bits, 1010101010101010", () => {
            let actual = encodeInstruction(0, b0000, 0, 0, 0, 0b1010101010101010);

            // have to use shift here because of twos complement reason detailed above
            expect(actual).toEqual(0b1010101010101010 << 16); 
        });
    });

    describe("validates its inputs", () => {    
        it("opcode cannot be negative", () => {        
            expect(() => {
                encodeInstruction(-1, b0000, 0, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part OpCode can not be negative (-1)"));
        });

        it("opcode cannot be greater than 63", () => {                
            expect(() => {
                encodeInstruction(64, b0000, 0, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part OpCode is outside range (64). Max is 63"));
        });

        it("sourceRegister cannot be negative", () => {        
            expect(() => {
                encodeInstruction(0, b0000, -1, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part SourceRegister can not be negative (-1)"));
        });

        it("sourceRegister cannot be greater than 7", () => {
            expect(() => {
                encodeInstruction(0, b0000, 8, 0, 0, 0);
            }).toThrow(new RangeError("Instruction part SourceRegister is outside range (8). Max is 7"));
        });

        it("destinationRegister cannot be negative", () => {        
            expect(() => {
                encodeInstruction(0, b0000, 0, -1, 0, 0);
            }).toThrow(new RangeError("Instruction part DestinationRegister can not be negative (-1)"));
        });
        it("destinationRegister cannot be greater than 7", () => {
            expect(() => {
                encodeInstruction(0, b0000, 0, 8, 0, 0);
            }).toThrow(new RangeError("Instruction part DestinationRegister is outside range (8). Max is 7"));
        });

        it("destination memory address cannot be less than -127", () => {        
            expect(() => {
                encodeInstruction(0, b0000, 0, 0, -128, 0);
            }).toThrow(new RangeError("Instruction part MemoryAddress can not be less than -127 (-128)"));
        });

        it("source memory address cannot be less than -127 when destination address is used", () => {        
            expect(() => {
                encodeInstruction(0, b0000, 0, 0, 1, -128);
            }).toThrow(new RangeError("Instruction part MemoryAddress can not be less than -127 when destination address is used (-128)"));
        });

        it("source memory address can be negative and less than -128", () => {        
            encodeInstruction(0, b0000, 0, 0, 0, -1000);
        });

        it("source memory address can be greater than 128", () => {        
            encodeInstruction(0, b0000, 0, 0, 0, 1000);
        });

        it("memory address cannot be greater than 2^16", () => {
            expect(() => {
                encodeInstruction(0, b0000, 0, 0, 0, 65536);
            }).toThrow(new RangeError("Instruction part MemoryAddress is outside range (65536). Max is 65535"));
        });
    });    
});

/* ------------------------------------------------------------------------------------ */

describe("The instruction decoder takes an encoded instruction", () => {    

    let expectInstruction = (inst : Instruction, 
        opcode : number,
        opcodeMode : OpcodeModes,
        sourceRegister : number,
        destinationRegister : number,
        destinationMemoryAddress : number,
        sourceMemoryAddress : number) =>
        {
            expect(inst.opcode).toEqual(opcode, "A");
            
            expect(inst.opcodeMode.source.isPointer).toEqual(opcodeMode.source.isPointer, "source is pointer");
            expect(inst.opcodeMode.source.isRegister).toEqual(opcodeMode.source.isRegister, "source is register");
            expect(inst.opcodeMode.destination.isPointer).toEqual(opcodeMode.destination.isPointer, "destination is pointer");
            expect(inst.opcodeMode.destination.isRegister).toEqual(opcodeMode.destination.isRegister, "destination is register");

            expect(inst.sourceRegister).toEqual(sourceRegister, "A");            
            expect(inst.destinationRegister).toEqual(destinationRegister, "A");
            expect(inst.destinationMemoryAddress).toEqual(destinationMemoryAddress, "A");
            expect(inst.sourceMemoryAddress).toEqual(sourceMemoryAddress, "A");
        };

    let decode = (instruction : number, 
        opcode : number,
        opcodeMode : OpcodeModes,
        sourceRegister : number,
        destinationRegister : number,
        sourceMemoryAddress : number,
        destinationMemoryAddress : number) => {

        let coder = new InstructionCoder32Bit();        
        let ram = new RAM(4);
        ram.storeDWord(0, instruction);
        let { instruction : actual, length } = coder.decodeInstruction(ram, 0);

        expectInstruction(actual, 
            opcode,
            opcodeMode,
            sourceRegister,
            destinationRegister,
            destinationMemoryAddress,
            sourceMemoryAddress);
    }

    describe("and returns its 6 bit opcode", () => {    
        it("which is taken from the first 6 bits, 1", () => {
            decode(0b1,
                   1, b0000, 0, 0, 0, 0);
        });

        it("which is taken from the first 6 bits, all 1s", () => {
            decode(0b111111,
                   0b111111, b0000, 0, 0, 0, 0);
        });

        it("which is taken from the first 6 bits, 101010", () => {
            decode(0b101010,
                   0b101010, b0000, 0, 0, 0, 0);
        });
    });

    describe("takes a 4 bit opcode mode", () => {        
        it("which is taken from the second 4 bits, 1", () => {
            decode(0b1000000,
                   0, b0001, 0, 0, 0, 0);
        });

        it("which is taken from the second 4 bits, all 1s", () => {
            decode(0b1111000000,
                   0, b1111, 0, 0, 0, 0);
        });

        it("which is taken from the second 4 bits, 1010", () => {
            decode(0b1010000000,
                   0, b1010, 0, 0, 0, 0);
        });

        it("which is taken from the second 4 bits, 1111", () => {
            decode(0b1111000000,
                   0, b1111, 0, 0, 0, 0);
        });
    });

    describe("takes a 3 bit source register", () => {        
        it("mode which is taken from the 11th to 14th bits, 1", () => {
            decode(0b10000000000,
                   0, b0000, 1, 0, 0, 0);
        });

        it("mode which is taken from the 11th to 14th bits, all 1s", () => {
            decode(0b1110000000000,
                   0, b0000, 0b111, 0, 0, 0);
        });

        it("mode which is taken from the 11th to 14th bits, 101", () => {
            decode(0b1010000000000,
                   0, b0000, 0b101, 0, 0, 0);
        });
    });

    describe("takes a 3 bit destination register", () => {        
        it("mode which is taken from the 14th to 16th bits, 1", () => {
            decode(0b10000000000000,
                   0, b0000, 0, 1, 0, 0);
        });

        it("mode which is taken from the 14th to 16th bits, all 1s", () => {
            decode(0b1110000000000000,
                   0, b0000, 0, 0b111, 0, 0);
        });

        it("mode which is taken from the 14th to 16th bits, 101", () => {
            decode(0b1010000000000000,
                   0, b0000, 0, 0b101, 0, 0);
        });
    });

    describe("takes a 16 bit memory address", () => {        
        it("mode which is taken from the 17th to 32nd bits, 1", () => {
            decode(0b1 << 16,
                   0, b0000, 0, 0, 1, 0);
        });

        it("mode which is taken from the 17th to 32nd bits, all 1s", () => {
            // have to use shift here because 
            // 0b11111111111111110000000000000000 would be interpreted at two complement -65536
            // 0b00000000000000001111111111111111 !!!
            decode(0b1111111111111111 << 16,
                   0, b0000, 0, 0, 0b1111111111111111, 0);
        });

        it("mode which is taken from the 17th to 32nd bits, 101", () => {
            decode(0b101 << 16,
                   0, b0000, 0, 0, 0b101, 0);
        });

        it("mode which is taken from the 17th to 32nd bits, 1010101010101010", () => {
            decode(0b1010101010101010 << 16,
                   0, b0000, 0, 0, 0b1010101010101010, 0);
        });
    });
});