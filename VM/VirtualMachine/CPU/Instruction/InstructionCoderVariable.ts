import Instruction, { OpcodeModes, OpcodeMode } from "./Instruction";
import { OpCodes as Op, OpCodes } from "./InstructionSet";
import InstructionCoder from "./InstructionCoder";
import RAM from "../../Memory/RAM";
import { MapOpCodeToExecutor, InstructionSet } from "./InstructionSet";
import { decodeInstructionOperandToValue, Endpoint, encodeInstructionOperand, encodeOpCodeModes } from "./InstructionCoder32Bit";
import { memo } from "react";

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

export type encoder = (opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number) => Uint8Array; 

export type decoder = (ram : RAM, offset : number) => { instruction: Instruction, length: number } ;

class InstructionSetCoder
{
    constructor(
        public readonly instructions : OpCodes[], 
        public readonly coder : EncoderDecoder) 
    {        
    }
}

class EncoderDecoder 
{
    constructor(
        public readonly encoder : encoder,
        public readonly decoder : decoder) 
    {        
    }
}

function writeFloatAtPosition(array : Uint8Array, value : number, offset : number) : void
{
    const view = new DataView(array.buffer, 0, array.byteLength);
    view.setFloat64(offset, value, true);        
}

function readFloatAtPosition(array : Uint8Array, offset : number) : number
{
    const view = new DataView(array.buffer, 0, array.byteLength);
    return view.getFloat64(offset, true);
}

function writeInt32AtPosition(array : Uint8Array, value : number, offset : number) : void
{
    const view = new DataView(array.buffer, 0, array.byteLength);
    view.setInt32(offset, value, true);        
}

function readInt32AtPosition(array : Uint8Array, offset : number) : number
{
    const view = new DataView(array.buffer, 0, array.byteLength);
    return view.getInt32(offset, true);
}

function writeInt16AtPosition(array : Uint8Array, value : number, offset : number) : void
{
    const view = new DataView(array.buffer, 0, array.byteLength);
    view.setInt16(offset, value, true);        
}

function readInt16AtPosition(array : Uint8Array, offset : number) : number
{
    const view = new DataView(array.buffer, 0, array.byteLength);
    return view.getInt16(offset, true);
}

function decodeSingleByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 2);

    const opcode = array[0];
    const address = array[1];

    return { 
        instruction : new Instruction(opcode, 
            OpcodeModes.Default, 
            0, 0, address, 0),
        length : 2
    };
}

function encodeSingleByteMemoryAddress(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(2);        
    array[0] = opcode;
    array[1] = sourceMemoryAddress;

    return array;
}
const SingleByteMemoryAddressEncoder = new EncoderDecoder(encodeSingleByteMemoryAddress, decodeSingleByteMemoryAddress);

function encodeSingleRegisterInstruction(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(2);        
    array[0] = opcode;
    array[1] = destinationRegister;

    return array;
}
 
function decodeSingleRegisterInstruction(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 2);

    const opcode = array[0];
    const destinationRegister = array[1];

    return { 
        instruction : new Instruction(opcode, 
            OpcodeModes.Default, 
            0, destinationRegister, 0, 0),
        length : 2
    };
}
const SingleRegisterInstructionEncoder = new EncoderDecoder(encodeSingleRegisterInstruction, decodeSingleRegisterInstruction);

function encodeDoubleRegisterInstruction(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(2);        
    array[0] = opcode;
    array[1] = ((sourceRegister & 7) << 3) | ((destinationRegister & 7));

    return array;
}
 
function decodeDoubleRegisterInstruction(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 2);

    const opcode = array[0];

    const registers = array[1];
    const destinationRegister = registers & 7;
    const sourceRegister = (registers >> 3) & 7;

    return { 
        instruction : new Instruction(opcode, 
            OpcodeModes.Default, 
            sourceRegister, destinationRegister, 0, 0),
        length : 2
    };
}
const DoubleRegisterInstructionEncoder = new EncoderDecoder(encodeDoubleRegisterInstruction, decodeDoubleRegisterInstruction);

function encodeFourByteMemoryAddress(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(5);        
    array[0] = opcode;
    
    writeInt32AtPosition(array, sourceMemoryAddress, 1);

    return array;
}
    
function decodeFourByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 10);

    const opcode = array[0];
    const memoryAddress = readInt32AtPosition(array, 1);

    const mode = new OpcodeModes(
        OpcodeMode.Default,
        OpcodeMode.Default
    );

    return { 
        instruction : new Instruction(opcode, 
            mode,
            0, 0, 0, memoryAddress),
        length : 5
    };
}
const FourByteMemoryAddressInstructionEncoder = new EncoderDecoder(encodeFourByteMemoryAddress, decodeFourByteMemoryAddress);

function encodeRegisterAndEightByteMemoryAddress(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(10);        
    array[0] = opcode;
    array[1] = destinationRegister;

    writeFloatAtPosition(array, sourceMemoryAddress, 2);

    return array;
}
    
function decodeRegisterAndEightByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 10);

    const opcode = array[0];
    const destinationRegister = array[1];
    const memoryAddress = readFloatAtPosition(array, 2);

    const mode = new OpcodeModes(
        OpcodeMode.Register,
        OpcodeMode.Default
    );

    return { 
        instruction : new Instruction(opcode, 
            mode,
            0, destinationRegister, 0, memoryAddress),
        length : 10
    };
}
const RegisterAndEightByteMemoryAddressInstructionEncoder = new EncoderDecoder(encodeRegisterAndEightByteMemoryAddress, decodeRegisterAndEightByteMemoryAddress);

function encodeRegisterAndFourByteMemoryAddress(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(6);        
    array[0] = opcode;
    array[1] = destinationRegister;

    writeInt32AtPosition(array, sourceMemoryAddress, 2);

    return array;
}
    
function decodeRegisterAndFourByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 6);

    const opcode = array[0];
    const destinationRegister = array[1];
    const memoryAddress = readInt32AtPosition(array, 2);

    const mode = new OpcodeModes(
        OpcodeMode.Register,
        OpcodeMode.Default
    );

    return { 
        instruction : new Instruction(opcode, 
            mode,
            0, destinationRegister, 0, memoryAddress),
        length : 6
    };
}
const RegisterAndFourByteMemoryAddressInstructionEncoder = new EncoderDecoder(encodeRegisterAndFourByteMemoryAddress, decodeRegisterAndFourByteMemoryAddress);

function encodeRegisterAndTwoByteMemoryAddress(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(4);        
    array[0] = opcode;
    array[1] = destinationRegister;

    writeInt16AtPosition(array, sourceMemoryAddress, 2);

    return array;
}
    
function decodeRegisterAndTwoByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 4);

    const opcode = array[0];
    const destinationRegister = array[1];
    const memoryAddress = readInt16AtPosition(array, 2);

    const mode = new OpcodeModes(
        OpcodeMode.Register,
        OpcodeMode.Default
    );

    return { 
        instruction : new Instruction(opcode, 
            mode,
            0, destinationRegister, 0, memoryAddress),
        length : 4
    };
}
const RegisterAndTwoByteMemoryAddressInstructionEncoder = new EncoderDecoder(encodeRegisterAndTwoByteMemoryAddress, decodeRegisterAndTwoByteMemoryAddress);

function encodeRegisterAndOneByteMemoryAddress(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(3);        
    array[0] = opcode;
    array[1] = destinationRegister;
    array[2] = sourceMemoryAddress;

    return array;
}
    
function decodeRegisterAndOneByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 3);

    const opcode = array[0];
    const destinationRegister = array[1];
    const memoryAddress = array[2];

    const mode = new OpcodeModes(
        OpcodeMode.Register,
        OpcodeMode.Default
    );

    return { 
        instruction : new Instruction(opcode, 
            mode,
            0, destinationRegister, 0, memoryAddress),
        length : 3
    };
}
const RegisterAndOneByteMemoryAddressInstructionEncoder = new EncoderDecoder(encodeRegisterAndOneByteMemoryAddress, decodeRegisterAndOneByteMemoryAddress);

function encodeSingleByteInstruction(opcode : number, 
    opcodeMode : OpcodeModes, 
    sourceRegister : number, 
    destinationRegister : number, 
    destinationMemoryAddress : number,
    sourceMemoryAddress : number): Uint8Array
{
    const array = new Uint8Array(1);        
    array[0] = opcode;
    return array;
}

function decodeSingleByteInstruction(ram : RAM, offset : number) : { instruction: Instruction, length: number }
{
    const array = ram.blitReadBytes(offset, 1);

    const opcode = array[0];

    return { 
        instruction : new Instruction(opcode, 
            OpcodeModes.Default, 
            0, 0, 0, 0),
        length : 1
    };
}
const SingleByteInstructionEncoder = new EncoderDecoder(encodeSingleByteInstruction, decodeSingleByteInstruction);

export default class InstructionCoderVariable implements InstructionCoder
{
    static instructionEncoderList : InstructionSetCoder[] = [
        new InstructionSetCoder([Op.HALT, Op.RET, Op.INT], SingleByteInstructionEncoder),
        new InstructionSetCoder([Op.NEG, Op.NOT, Op.INC, Op.DEC, 
                                 Op.PUSH, Op.POP,
                                 Op.PUSHb, Op.POPb,
                                 Op.PUSHw, Op.POPw,
                                 Op.PUSHf, Op.POPf,
                                 Op.JMR, 
                                 Op.CMPZ,
                                 Op.SETE, Op.SETGT, Op.SETGTE, Op.SETLT, Op.SETLTE, Op.SETNE, 
                                 Op.TRUNCf], SingleRegisterInstructionEncoder),
        new InstructionSetCoder([Op.SWAP, Op.OR, Op.XOR, Op.CMPr], DoubleRegisterInstructionEncoder), 
        new InstructionSetCoder([Op.MVIf, Op.STRf, Op.LDRf], RegisterAndEightByteMemoryAddressInstructionEncoder),
        new InstructionSetCoder([Op.MVI, Op.STR, Op.LDR], RegisterAndFourByteMemoryAddressInstructionEncoder),        
        new InstructionSetCoder([Op.MVIw, Op.STRw, Op.LDRw], RegisterAndTwoByteMemoryAddressInstructionEncoder),        
        new InstructionSetCoder([Op.MVIb, Op.STRb, Op.LDRb], RegisterAndOneByteMemoryAddressInstructionEncoder),        
        new InstructionSetCoder([Op.CALL, Op.JMP, Op.JEQ, Op.JNE, Op.JGE, Op.JLT, Op.JNZ], FourByteMemoryAddressInstructionEncoder) 
    ];

    static instructionEncoderMap : { [op :  number] : EncoderDecoder };

    private static _staticInitialiser = (() => {
        InstructionCoderVariable.instructionEncoderMap = {};
        for(let item of InstructionCoderVariable.instructionEncoderList)
        {
            for(let opcode of item.instructions)
            {   
                InstructionCoderVariable.instructionEncoderMap[opcode] = item.coder;
            }
        }
    })();

    static validateInstructionPart(part : number, max : number, name : string) : void
    {
        if(part < 0)
            throw new RangeError(`Instruction part ${name} can not be negative (${part})`);

        if(part > max && max >= 0)
            throw new RangeError(`Instruction part ${name} is outside range (${part}). Max is ${max}`);
    }

    encodeInstruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number, 
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number): Uint8Array
    {        
        if(InstructionCoderVariable.instructionEncoderMap[opcode])
            return InstructionCoderVariable.instructionEncoderMap[opcode].encoder(opcode, 
                                                                                opcodeMode, 
                                                                                sourceRegister, 
                                                                                destinationRegister,
                                                                                destinationMemoryAddress,
                                                                                sourceMemoryAddress);

        return InstructionCoderVariable.encodeDefaultInstruction(opcode, 
            opcodeMode, 
            sourceRegister, 
            destinationRegister,
            destinationMemoryAddress,
            sourceMemoryAddress);
    }

    decodeInstruction (ram : RAM, offset : number) : { instruction: Instruction, length: number }
    {
        const array = ram.blitReadBytes(offset, 1);
        var opcode = array[0];

        if(InstructionCoderVariable.instructionEncoderMap[opcode])
            return InstructionCoderVariable.instructionEncoderMap[opcode].decoder(ram, offset);

        return InstructionCoderVariable.decodeDefaultInstruction(ram, offset);        
    }

    static encodeDefaultInstruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number, 
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number): Uint8Array
    {
        InstructionCoderVariable.validateInstructionPart(opcode, OpCodeMask, "OpCode");
        //InstructionCoderVariable.validateInstructionPart(opcodeMode, OpcodeModeMask, "OpcodeMode");
        InstructionCoderVariable.validateInstructionPart(sourceRegister, SourceRegisterMask, "SourceRegister");
        InstructionCoderVariable.validateInstructionPart(destinationRegister, DestinationRegisterMask, "DestinationRegister");        

        const memoryAddress = encodeInstructionOperand(destinationMemoryAddress,
            sourceMemoryAddress,
            opcodeMode.destination.isPointer && opcodeMode.source.isPointer);

        InstructionCoderVariable.validateInstructionPart(memoryAddress, MemoryAddressMask, "MemoryAddress");

        let mode = encodeOpCodeModes(opcodeMode);

        const array = new Uint8Array(12);
        
        array[0] = opcode;
        array[1] = mode;
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

    static decodeDefaultInstruction (ram : RAM, offset : number) : { instruction: Instruction, length: number }
    {
        const array = ram.blitReadBytes(offset, 12);

        const opcode = array[0];
        const opcodeMode = array[1];
        const sourceRegister = array[2];
        const destinationRegister = array[3];

        const rawMemoryAddress = (array[4] << 0) |
                                    (array[5] << 8 ) |
                                    (array[6] << 16) |
                                    (array[7] << 24) |
                                    (array[8] << 32) |
                                    (array[9] << 40) |
                                    (array[10] << 48) |
                                    (array[11] << 56);

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

        if(mode.source.isPointer || mode.destination.isPointer)
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
            length : 12
        };
    }
}