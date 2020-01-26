import Instruction, { OpcodeModes, OpcodeMode } from "./Instruction";
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
        public readonly instructions : string[], 
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

function encodeEightByteMemoryAddress(opcode : number, 
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
    
function decodeEightByteMemoryAddress(ram : RAM, offset : number) : { instruction: Instruction, length: number }
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
const EightByteMemoryAddressInstructionEncoder = new EncoderDecoder(encodeEightByteMemoryAddress, decodeEightByteMemoryAddress);

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
        new InstructionSetCoder(["HALT", "RET"], SingleByteInstructionEncoder),
        new InstructionSetCoder(["NEG", "NOT", "INC", "DEC"], SingleRegisterInstructionEncoder),
        new InstructionSetCoder(["MVIf"], EightByteMemoryAddressInstructionEncoder)
    ];

    static instructionEncoderMap : { [mnemonic :  string] : EncoderDecoder };

    private static _staticInitialiser = (() => {
        InstructionCoderVariable.instructionEncoderMap = {};
        for(let item of InstructionCoderVariable.instructionEncoderList)
        {
            for(let name of item.instructions)
            {   
                InstructionCoderVariable.instructionEncoderMap[name] = item.coder;
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
        var instructionSpec = InstructionSet.filter( i => i.opcode === opcode )[0];

        if(!!instructionSpec && InstructionCoderVariable.instructionEncoderMap[instructionSpec.name])
            return InstructionCoderVariable.instructionEncoderMap[instructionSpec.name].encoder(opcode, 
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
        var instructionSpec = InstructionSet.filter( i => i.opcode === opcode )[0];

        if(!!instructionSpec && InstructionCoderVariable.instructionEncoderMap[instructionSpec.name])
            return InstructionCoderVariable.instructionEncoderMap[instructionSpec.name].decoder(ram, offset);

        return InstructionCoderVariable.decodeDefaultInstruction(ram, offset);        
    }

    static encodeDefaultInstruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number, 
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number): Uint8Array
    {
        var instructionSpec = InstructionSet.filter( i => i.opcode === opcode )[0];

        InstructionCoderVariable.validateInstructionPart(opcode, OpCodeMask, "OpCode");
        //InstructionCoderVariable.validateInstructionPart(opcodeMode, OpcodeModeMask, "OpcodeMode");
        InstructionCoderVariable.validateInstructionPart(sourceRegister, SourceRegisterMask, "SourceRegister");
        InstructionCoderVariable.validateInstructionPart(destinationRegister, DestinationRegisterMask, "DestinationRegister");        

        const memoryAddress = encodeInstructionOperand(destinationMemoryAddress,
            sourceMemoryAddress,
            opcodeMode.destination.isPointer && opcodeMode.source.isPointer);

        InstructionCoderVariable.validateInstructionPart(memoryAddress, MemoryAddressMask, "MemoryAddress");

        let mode = encodeOpCodeModes(opcodeMode);

        const instruction = (opcode << OpCodeOffset) |
                            (mode << OpcodeModeOffset) |
                            (sourceRegister << SourceRegisterOffset) |
                            (destinationRegister << DestinationRegisterOffset) |
                            (memoryAddress << MemoryAddressOffset);
                            
        const array = new Uint8Array(12);//instructionSpec.instructionLength);
        
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