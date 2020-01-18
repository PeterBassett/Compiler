import AssemblyLine from "./AssemblyLine";
import { DataLabel, DataLabelType } from "./Preprocessors/ParseDataLabels";
import { dataSectionSizeInBytes } from "./Preprocessors/ReplaceDataLabels";
import { AssemblyLineLexer } from "./AssemblyLineLexer";
import { AssemblyLineParser } from "./AssemblyLineParser";
import InstructionCoder from "../VirtualMachine/CPU/Instruction/InstructionCoder";
import Instruction from "../VirtualMachine/CPU/Instruction/Instruction";

export function assemble(instructions : AssemblyLine[], data : DataLabel[], fixedTextSectionOffset : number, encoder : InstructionCoder) : ArrayBuffer
{
    const instructionBuffer = encodeTextSection(instructions, fixedTextSectionOffset, encoder);

    const dataSize = dataSectionSizeInBytes(data);
    const buffer = new Uint8Array(instructionBuffer.length + dataSize);
    const dataOutput = new DataView(buffer.buffer);

    buffer.set(instructionBuffer);

    encodeDataSection(dataOutput, data, 0);

    return buffer;
}

function round(i : number, v : number) : number {
    return Math.round(i / v) * v;
}

export function encodeTextSection(instructions : AssemblyLine[], offset : number, encoder : InstructionCoder) : Uint8Array 
{    
    let output = new Uint8Array(instructions.length * 4);
    let lineToOutputPosition : { [index:number] : { position : number, instruction : Instruction } } = {};

    let bytesOutput = 0;
    instructions
        .map(instruction => instruction.source.toUpperCase())
        .forEach((assemblyLine, lineIndex) => {    
            try
            {
                const lexer = new AssemblyLineLexer(assemblyLine);
                const parser = new AssemblyLineParser(lexer);
                
                const instruction = parser.Parse();
                
                const { 
                    opcode, 
                    opcodeMode, 
                    sourceRegister, 
                    destinationRegister, 
                    destinationMemoryAddress, 
                    sourceMemoryAddress 
                } = instruction;

                const encoded = encoder.encodeInstruction(opcode, 
                    opcodeMode, 
                    sourceRegister, 
                    destinationRegister, 
                    destinationMemoryAddress,
                    sourceMemoryAddress);

                if(output.length < bytesOutput + encoded.length)
                {
                    let newOutput = new Uint8Array(Math.max(output.length * 2, bytesOutput + encoded.length));
                    newOutput.set(output);
                    output = newOutput;
                }

                // record the position of all output instructions.
                lineToOutputPosition[lineIndex] = {
                    position : bytesOutput,
                    instruction : instruction 
                };

                for(let i = 0; i < encoded.length; i++, bytesOutput++)
                {                                        
                    output[offset + bytesOutput] = encoded[i];
                }                
            }
            catch(e)
            {
                throw Error(`Error on line ${lineIndex} ${assemblyLine}`);
            }
        });

    return output.subarray(0, bytesOutput);
}

export function encodeDataSection(output : DataView, data : DataLabel[], offset : number) : void 
{
    data.forEach((label) => {
        const {type, address, size} = label;

        switch(type)
        {
            case DataLabelType.Byte : {
                output.setUint8(offset + address, label.data as number);
                break;
            } 
            case DataLabelType.Int16 : {
                output.setUint16(offset + address, label.data as number, true);
                break;
            } 
            case DataLabelType.Int32 : {
                output.setUint32(offset + address, label.data as number, true);
                break;
            }
            case DataLabelType.Float : {
                output.setFloat64(offset + address, label.data as number, true);
                break;
            }             
            case DataLabelType.String : {
                let str = label.data as string;

                for(let i = 0; i < str.length; i++)
                    output.setUint16(offset + address + (i*2), str.charCodeAt(i), true);

                output.setUint16(offset + address + str.length * 2, 0, true);
                break;
            }
            case DataLabelType.Buffer : {
                for(let i = 0; i < size; i++)                
                    output.setUint8(offset + address + i, 0);

                break;
            }
            default:
                throw new RangeError("Invalid DataLabelType");
        }
    });
}