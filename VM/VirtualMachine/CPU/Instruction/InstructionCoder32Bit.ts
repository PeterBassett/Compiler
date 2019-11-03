import Instruction from "./Instruction";
import InstructionCoder from "./InstructionCoder";
import RAM from "../../Memory/RAM";

function Mask(bits : number) : number
{
    return Math.pow(2, bits) - 1;
}

const OpCodeOffset = 0;
const OpCodeBits = 6;
const OpCodeMask = Mask(OpCodeBits);
const OpCode32BitMask = OpCodeMask << OpCodeOffset;

const OpcodeModeOffset = OpCodeOffset + OpCodeBits;
const OpcodeModeBits = 4;
const OpcodeModeMask = Mask(OpcodeModeBits);
const OpcodeMode32BitMask = OpcodeModeMask << OpcodeModeOffset;

const SourceRegisterOffset = OpcodeModeOffset + OpcodeModeBits;
const SourceRegisterBits = 3
const SourceRegisterMask = Mask(SourceRegisterBits);
const SourceRegister32BitMask = SourceRegisterMask << SourceRegisterOffset;

const DestinationRegisterOffset = SourceRegisterOffset + SourceRegisterBits;
const DestinationRegisterBits = 3
const DestinationRegisterMask = Mask(DestinationRegisterBits);
const DestinationRegister32BitMask = DestinationRegisterMask << DestinationRegisterOffset;

const MemoryAddressOffset = DestinationRegisterOffset + DestinationRegisterBits;
const MemoryAddressBits = 16;
const MemoryAddressMask = Mask(MemoryAddressBits);
const MemoryAddress32BitMask = MemoryAddressMask << MemoryAddressOffset;

export default class InstructionCoder32Bit implements InstructionCoder
{
    encodeInstruction(opcode : number, 
        opcodeMode : number, 
        sourceRegister : number,
        destinationRegister : number, 
        memoryAddress : number): Uint8Array
    {
        this.validateInstructionPart(opcode, OpCodeMask, "OpCode");
        this.validateInstructionPart(opcodeMode, OpcodeModeMask, "OpcodeMode");
        this.validateInstructionPart(sourceRegister, SourceRegisterMask, "SourceRegister");
        this.validateInstructionPart(destinationRegister, DestinationRegisterMask, "DestinationRegister");
        this.validateInstructionPart(memoryAddress, MemoryAddressMask, "MemoryAddress");

        const instruction = (opcode << OpCodeOffset) |
                            (opcodeMode << OpcodeModeOffset) |
                            (sourceRegister << SourceRegisterOffset) |
                            (destinationRegister << DestinationRegisterOffset) |
                            (memoryAddress << MemoryAddressOffset);
                            
        const array = new Uint8Array(4);
        
        array[0] = (instruction >> 0 ) & 0xff;
        array[1] = (instruction >> 8 ) & 0xff;
        array[2] = (instruction >> 16) & 0xff;
        array[3] = (instruction >> 24) & 0xff;

        return array;
    }

    validateInstructionPart(part : number, max : number, name : string) : void
    {
        if(part < 0)
            throw new RangeError(`Instruction part ${name} can not be negative (${part})`);

        if(part > max && max >= 0)
            throw new RangeError(`Instruction part ${name} is outside range (${part}). Max is ${max}`);
    }

    decodeInstruction (ram : RAM, offset : number) : { instruction: Instruction, length: number }
    {
        const codedInstruction = ram.readDWord(offset);

        const opcode =              (codedInstruction & OpCode32BitMask) >>> OpCodeOffset;
        const opcodeMode =          (codedInstruction & OpcodeMode32BitMask) >>> OpcodeModeOffset;
        const sourceRegister =      (codedInstruction & SourceRegister32BitMask) >>> SourceRegisterOffset;
        const destinationRegister = (codedInstruction & DestinationRegister32BitMask) >>> DestinationRegisterOffset;
        const memoryAddress =       (codedInstruction & MemoryAddress32BitMask) >>> MemoryAddressOffset;  

        return { 
            instruction : new Instruction(opcode, opcodeMode, sourceRegister, destinationRegister, memoryAddress),
            length : 4
        };
    }
}