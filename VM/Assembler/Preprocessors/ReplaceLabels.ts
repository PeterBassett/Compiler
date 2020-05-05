import AssemblyLine from "../AssemblyLine";
import * as SectionExtraction from "../SectionExtraction";
import { AssemblyLineParser } from "../AssemblyLineParser";
import { AssemblyLineLexer } from "../AssemblyLineLexer";
import InstructionCoder32Bit from "../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import InstructionCoder from "../../VirtualMachine/CPU/Instruction/InstructionCoder";

export function buildLabelMap(inputLines: AssemblyLine[], encoder : InstructionCoder): {lines : AssemblyLine [], labels : { [label:string] : number } } {
    const { lines, labels } = buildDetailedLabelMap(inputLines, encoder);
    const m : { [label:string] : number } = {};

    const l = Object.keys(labels).map( name => m[name] = labels[name].lineNumber );
    
    return { lines, labels: m };
}

export function buildDetailedLabelMap(lines: AssemblyLine[], encoder : InstructionCoder): {lines : AssemblyLine [], labels : { [index:string] : { lineNumber : number, byteOffset : number } } } {
    const labels : { 
        [index:string] : { lineNumber : number, byteOffset : number } 
    } = {};
    
    let labelOffset = 0;
    let byteOffset = 0;

    lines = lines.filter( (line : AssemblyLine, index : number) => {
        
        const firstPart = line.source.split(' ')[0];
        
        if (firstPart[firstPart.length - 1] === ':') {        
            labels[line.source.toLowerCase()] = {
                lineNumber : index - labelOffset++,
                byteOffset : byteOffset
            };

            return false;        
        }
        
        byteOffset += calculateInstructionSize(line, encoder);

        return true
    });

    return { lines, labels };
}

export function calculateTextSectionEncodedLength(lines: AssemblyLine[], instructionEncoder : InstructionCoder) : number
{
    let size = 0;

    for(let line of lines)
        size += calculateInstructionSize(line, instructionEncoder);
    
    return size;
}

export function calculateInstructionSize(line : AssemblyLine, encoder : InstructionCoder) : number
{
    const parser = new AssemblyLineParser(new AssemblyLineLexer(line.source), true);    

    const opcode = parser.parseForOpcode();

    const result = encoder.calculateInstructionLength(opcode);

    if(result.isCertain)
        return result.instructionLength; // if we are sure of the calculated length
    else
    {
        // do a full parse to determine the encoded instruction length
        const instruction = parser.Parse();

        const output = encoder.encodeInstruction(instruction.opcode, 
            instruction.opcodeMode, 
            instruction.sourceRegister, 
            instruction.destinationRegister, 
            instruction.destinationMemoryAddress, 
            instruction.sourceMemoryAddress);
        return output.length;
    }    
}

export function replaceLabels(memoryOffset : number, lines: AssemblyLine[], instructionEncoder : InstructionCoder) : AssemblyLine[] 
{
    const map = buildDetailedLabelMap(lines, instructionEncoder);

    const labels = Object.keys(map.labels);
    lines = map.lines;

    labels.sort((a, b) => b.length - a.length);
    labels.forEach((label) => {
        const regEx = new RegExp(label, "ig");  
        lines.forEach((line, index) => {          
            let target = memoryOffset + map.labels[label].byteOffset;         
            line.source = line.source.replace(regEx, target.toString());            
        });
    });

    return lines;
}