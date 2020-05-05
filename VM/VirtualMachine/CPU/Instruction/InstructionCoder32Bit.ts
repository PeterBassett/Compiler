import Instruction, { OpcodeModes, OpcodeMode } from "./Instruction";
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
    calculateInstructionLength(opcode: number): { isCertain: boolean; instructionLength: number; } {
        return {
            isCertain : true,
            instructionLength : 4
        };
    }
    
    encodeInstruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number,
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number): Uint8Array
    {
        this.validateInstructionPart(opcode, OpCodeMask, "OpCode");
        //this.validateInstructionPart(opcodeMode, OpcodeModeMask, "OpcodeMode");
        this.validateInstructionPart(sourceRegister, SourceRegisterMask, "SourceRegister");
        this.validateInstructionPart(destinationRegister, DestinationRegisterMask, "DestinationRegister");   
        
        if(destinationMemoryAddress < -127)
            throw new RangeError(`Instruction part MemoryAddress can not be less than -127 (${destinationMemoryAddress})`);

        if(destinationMemoryAddress > 127)
            throw new RangeError(`Instruction part MemoryAddress can not be more than 127 (${destinationMemoryAddress})`);
            
        if(sourceMemoryAddress < -127 && !!destinationMemoryAddress)
            throw new RangeError(`Instruction part MemoryAddress can not be less than -127 when destination address is used (${sourceMemoryAddress})`);

        const memoryAddress = encodeInstructionOperand(destinationMemoryAddress,
            sourceMemoryAddress,
            opcodeMode.destination.isPointer && opcodeMode.source.isPointer);

        this.validateInstructionPart(memoryAddress, MemoryAddressMask, "MemoryAddress");

        let mode = encodeOpCodeModes(opcodeMode);

        const instruction = (opcode << OpCodeOffset) |
                            (mode << OpcodeModeOffset) |
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
        const rawMemoryAddress =       (codedInstruction & MemoryAddress32BitMask) >>> MemoryAddressOffset;                  

        const mode = new OpcodeModes(
            new OpcodeMode(
                (opcodeMode & 0b0001) !== 0,
                (opcodeMode & 0b0100) !== 0,
            ),
            new OpcodeMode(
                (opcodeMode & 0b0010) !== 0,
                (opcodeMode & 0b1000) !== 0,
            )
        );

        let sourceMemoryAddress : number = rawMemoryAddress;
        let destinationMemoryAddress : number = 0;

        if(mode.source.isPointer || 
           mode.destination.isPointer || 
           (mode.source.isRegister && mode.destination.isRegister))
        {
            sourceMemoryAddress = decodeInstructionOperandToValue(
                rawMemoryAddress, 
                Endpoint.Source, 
                mode.source.isPointer && mode.destination.isPointer);

            destinationMemoryAddress = decodeInstructionOperandToValue(
                rawMemoryAddress, 
                Endpoint.Destination, 
                mode.source.isPointer && mode.destination.isPointer);            
        }

        return { 
            instruction : new Instruction(opcode, 
                mode, 
                sourceRegister, 
                destinationRegister, 
                destinationMemoryAddress,
                sourceMemoryAddress),
            length : 4
        };
    }
}

export function encodeInstructionOperand(destinationRegisterOffset : number | undefined, sourceRegisterOffset : number | undefined, isTwoOffsets : boolean) : number
{
    destinationRegisterOffset = destinationRegisterOffset || 0;
    sourceRegisterOffset = sourceRegisterOffset || 0;

    if(destinationRegisterOffset < 0)
        destinationRegisterOffset = Math.abs(destinationRegisterOffset) | 128;

    if(sourceRegisterOffset < 0)
        sourceRegisterOffset = Math.abs(sourceRegisterOffset) | 128;

    const value = sourceRegisterOffset | destinationRegisterOffset << 8;
    return value;
}

export function decodeInstructionOperand(value : number, isTwoOffsets : boolean) : {op1Offset8? : number, op2Offset8? : number}
{
    let offset1 = value >> 8;
    let offset2 = value & 255;

    if(offset1 & 128)
        offset1 = -(offset1 & 127);

    if(offset2 & 128)
        offset2 = -(offset2 & 127);

    return {op1Offset8 : offset1, op2Offset8 : offset2};
}

export function encodeOpCodeModes(opcodeModes : OpcodeModes) : number
{
    let code = 0;

    code |= opcodeModes.source.isPointer ? 0b0001 : 0b0000;
    code |= opcodeModes.source.isRegister ? 0b0100 : 0b0000;

    code |= opcodeModes.destination.isPointer ? 0b0010 : 0b0000;
    code |= opcodeModes.destination.isRegister ? 0b1000 : 0b0000;
                
    return code;
}
/*
export function encodeOpCodeMode(isPointer : boolean, isRegister : boolean, scale : number) : number
{
    let code = 0;

    if(isRegister)
        code |= 1;    
    if(isPointer)
        code |= 4;
    
    code = code << scale;
    
    return code;
}
*/
export function decodeOpCodeMode(opcodeMode : number) : OpcodeModes
{
    const mode = new OpcodeModes(
        new OpcodeMode(
            (opcodeMode & 0b0100) !== 0,
            (opcodeMode & 0b0001) !== 0,
        ),
        new OpcodeMode(
            (opcodeMode & 0b1000) !== 0,
            (opcodeMode & 0b0010) !== 0,
        )
    );

    return mode;
}

export function decodeInstructionOperandToValue(value : number, endpoint :Endpoint, isTwoOffsets:boolean) : number
{
    let f = decodeInstructionOperand(value, isTwoOffsets);

    if(f.op1Offset8 != null && endpoint == Endpoint.Destination)
        return f.op1Offset8;

    if(f.op2Offset8 != null && endpoint == Endpoint.Source)
        return f.op2Offset8;
    
    throw RangeError();
}

export function isPointer(opcodeMode : number, scale : number) : boolean 
{
    opcodeMode = opcodeMode >> scale;
    return (opcodeMode & 1) == 1;
}

export function isTwoRelativeAddressed(instruction:Instruction)
{
    return  instruction.opcodeMode.source.isPointer &&
            instruction.opcodeMode.destination.isPointer; 
}
/*
export function isRegister(opcodeMode : OpcodeMode, scale : number) : boolean 
{
    opcodeMode = opcodeMode >> scale;
    return (opcodeMode & 4) == 4;
}*/

export enum Endpoint
{
    Source = 0,
    Destination = 1
}