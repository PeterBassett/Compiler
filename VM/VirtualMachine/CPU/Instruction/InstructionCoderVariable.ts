import Instruction from "./Instruction";
import InstructionCoder from "./InstructionCoder";
import RAM from "../../Memory/RAM";
import { MapOpCodeToExecutor, InstructionSet } from "./InstructionSet";

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

export default class InstructionCoderVariable implements InstructionCoder
{
    encodeInstruction(opcode : number, 
        opcodeMode : number, 
        sourceRegister : number, 
        destinationRegister : number, 
        memoryAddress : number): Uint8Array
    {
        var instructionSpec = InstructionSet.filter( i => i.opcode === opcode )[0];

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
                            
        const array = new Uint8Array(12);//instructionSpec.instructionLength);
        
        array[0] = opcode;
        array[1] = opcodeMode;
        array[2] = sourceRegister;
        array[3] = destinationRegister;

        array[4] =  (memoryAddress >> 0 ) & 0xff;
        array[5] =  (memoryAddress >> 8 ) & 0xff;
        array[6] =  (memoryAddress >> 16) & 0xff;
        array[7] =  (memoryAddress >> 24) & 0xff;
        array[8] =  (memoryAddress >> 32) & 0xff;
        array[9] =  (memoryAddress >> 40) & 0xff;
        array[10] = (memoryAddress >> 48) & 0xff;
        array[11] = (memoryAddress >> 56) & 0xff;

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
        const array = ram.blitReadBytes(offset, 12);

        const opcode = array[0];
        const opcodeMode = array[1];
        const sourceRegister = array[2];
        const destinationRegister = array[3];

        const memoryAddress = (array[4] << 0) |
                              (array[5] << 8 ) |
                              (array[6] << 16) |
                              (array[7] << 24) |
                              (array[8] << 32) |
                              (array[9] << 40) |
                              (array[10] << 48) |
                              (array[11] << 56);

        return { 
            instruction : new Instruction(opcode, opcodeMode, sourceRegister, destinationRegister, memoryAddress),
            length : 12
        };
    }
}