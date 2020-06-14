import { IAssembler } from "../Assembler/IAssembler";
import { AssembledOutput } from "../Assembler/AssembledOutput";
import { AssemblyLexer } from "./AssemblyLexer";
import { AssemblyParser, AssemblyParserOutput, AssemblyLineKind, AssemblyLine, AssemblyLineSectionLabel, AssemblyLineEntryPoint, AssemblyLineDataLabel, IAssemblyParser, AssemblyLineInstruction, AssemblyLineLabel, AssemblyLineInstructionOperand, AssemblyLineInstructionOperandLabel, AssemblyLineInstructionOperandRegister, AssemblyLineOperandKind, AssemblyLineInstructionOperandNumber, AssemblyLineInstructionOperandDereference, AssemblyLineInstructionOperandBinaryOperator, AssemblyLineInstructionOperandUnaryOperator, AssemblyLineInstructionOperandDataLabel } from "./AssemblyParser";
import Instruction, { OpcodeModes, OpcodeMode } from "../VirtualMachine/CPU/Instruction/Instruction";
import SourceText from "../Language/Compiler/Syntax/Text/SourceText";
import { Diagnostics } from "../Language/Compiler/Diagnostics/Diagnostics";
import { AssemblyTokenKind, AssemblyToken } from "../Assembler/IAssemblyLineLexer";
import { DataLabel } from "../Assembler/DataLabel";
import InstructionCoder from "../VirtualMachine/CPU/Instruction/InstructionCoder";
import { InstructionMap, OpCodes } from "../VirtualMachine/CPU/Instruction/InstructionSet";
import Region from "../Assembler/Region";
import { DataLabelType } from "../Assembler/DataLabelType";

class AssemblyInstructionData
{
    public instruction? : Instruction;
    public encodedLength? : number;
    public address? : number;

    constructor(public readonly line :  AssemblyLineInstruction)
    {
    }
}

export default class Assembler2 implements IAssembler
{    
    private instructions : AssemblyInstructionData[] = [];
    private labelAddresssMap: { [index: string]: number; }

    constructor(
        private readonly newParser : (t:string) => IAssemblyParser, 
        private readonly encoder : InstructionCoder, 
        private readonly diagnostics : Diagnostics)
    {
        this.labelAddresssMap = {};
    }

    public assemble(assembly: string): AssembledOutput 
    {
       // const source = new SourceText(assembly);
       // const diagnostics = new Diagnostics(source);

       // const lexer = new AssemblyLexer(source, diagnostics);
       // const parser = new AssemblyParser(lexer, diagnostics);

        const parser = this.newParser(assembly);
        const parsedInstructions = parser.parse();
        //this.diagnostics = parsedInstructions.diagnostics;

        let { startInstruction, dataLabels, instructions } = this.divideDataLabelsAndInstructions(parsedInstructions);

        const assemblyInstructions = this.injectEntryPoint(startInstruction, instructions);

        const totalEncodedInstructionSize = this.createInstructionsAndLabelMap(assemblyInstructions);
        const encodedDataLabels = this.calculateDataLabelSizes(dataLabels, totalEncodedInstructionSize);

        this.createInstructionsFromAssemblyLines();

        return this.outputMachineCode(totalEncodedInstructionSize, encodedDataLabels.totalSize, encodedDataLabels.dataLabels);
    }   

    private injectEntryPoint(entryPoint: AssemblyLineEntryPoint, instructions : AssemblyLine[]) 
    {       
        const mvi = new AssemblyLineInstruction(
            new AssemblyToken("MVI", 0, AssemblyTokenKind.IDENTIFIER),
            [
                new AssemblyLineInstructionOperandRegister(new AssemblyToken("R0", 0, AssemblyTokenKind.REGISTER), 0),
                new AssemblyLineInstructionOperandLabel(entryPoint.entryPointText)
            ], 0);

        const jmr = new AssemblyLineInstruction(
            new AssemblyToken("JMR", 0, AssemblyTokenKind.IDENTIFIER),
            [
                new AssemblyLineInstructionOperandRegister(new AssemblyToken("R0", 0, AssemblyTokenKind.REGISTER), 0)
            ], 0);
            
        return [mvi, jmr, ...instructions];
    }

    private createInstructionsAndLabelMap(lines: AssemblyLine[]) : number 
    {
        this.labelAddresssMap = {};
        let instructions : AssemblyLineInstruction[] = [];
        this.instructions = [];
        let totalSize = 0;

        for(let i = 0; i < lines.length; i++)
        {
            const line = lines[i];

            switch(line.kind)
            {
                case AssemblyLineKind.Label:
                    const label = line as AssemblyLineLabel;
                    this.labelAddresssMap[label.labelText.lexeme] = totalSize;
                    break;
                case AssemblyLineKind.Instruction:
                {
                    const instructionLine = line as AssemblyLineInstruction;
                    
                    const instructionData = new AssemblyInstructionData(instructionLine);

                    this.instructions.push(instructionData);

                    const mnemonic = instructionLine.mnemonic.lexeme.toUpperCase();
                    const instruction = InstructionMap[mnemonic];            

                    const instructionSize = this.encoder.calculateInstructionLength(instruction.opcode);

                    if(!instructionSize.isCertain)
                        throw new Error("Unknown instruction length not currently supported");

                    instructionData.encodedLength = instructionSize.instructionLength;

                    totalSize += instructionSize.instructionLength;

                    break;
                }
                default :
                {
                    throw new Error("Unexpected assembly line type");
                }
            }
        }

        return totalSize;
    }

    private createInstructionsFromAssemblyLines() : void
    {
        let instructions : Instruction[] = [];

        for(let line of this.instructions)
        {
            line.instruction = this.createInstructionFromAssemblyLine(line.line);
        }
    }

    private createInstructionFromAssemblyLine(line:AssemblyLineInstruction) : Instruction
    {
        const mnemonic = line.mnemonic.lexeme.toUpperCase();
        const instruction = InstructionMap[mnemonic];

        if(!instruction)
        {
            throw RangeError("Invalid instruction " + mnemonic);
        }

        if(instruction.operandCount == 0)
        {
            return new Instruction(instruction.opcode, OpcodeModes.Default, 0, 0, 0, 0);
        }

        if(instruction.operandCount == 1)
        {
            const operand = this.createOperand(line.operands[0]);

            const mode = new OpcodeMode(operand.isPointer, !!operand.register);
            const modes = new OpcodeModes(mode, OpcodeMode.Default);

            return new Instruction(instruction.opcode, 
                                   modes,                                                                   
                                   0, 
                                   operand.register || 0,
                                   0, operand.value || 0);
        }
        else if(instruction.operandCount == 2)
        {
            const op1 = this.createOperand(line.operands[0]);
            const op2 = this.createOperand(line.operands[1]);

            let modes = new OpcodeModes(
                new OpcodeMode(op2.isPointer, !!op2.register),
                new OpcodeMode(op1.isPointer, !!op1.register)
            );
            
            return new Instruction(instruction.opcode, 
                modes,
                op2.register || 0, 
                op1.register || 0,
                op1.value || 0, 
                op2.value || 0);
        }
        else
        {
            throw new Error("Unexpected operand count");
        }
    }
    
    private createOperand(operand: AssemblyLineInstructionOperand) : { isPointer:boolean, value:number|undefined, register:number|undefined } 
    {    
        let isPointer = false;
        let value : number|undefined = undefined;
        let register : number|undefined = undefined;

        switch(operand.kind)
        {
            case AssemblyLineOperandKind.Dereference:
            {
                isPointer = true;
                const dereferenceOperand = operand as AssemblyLineInstructionOperandDereference;
                const internal = this.createOperand(dereferenceOperand.operand);
                value = internal.value;
                register = internal.register;
                break;
            }
            case AssemblyLineOperandKind.BinaryOperator:
            {
                const binaryOperator = operand as AssemblyLineInstructionOperandBinaryOperator;
                
                const left = this.createOperand(binaryOperator.left);
                const right = this.createOperand(binaryOperator.right);

                if(left.register)
                    register = left.register;

                if(left.value && !right.value)
                    throw new Error("Unexpected numeric left hand operand");
                
                if(left.value && right.value)
                {
                    switch(binaryOperator.operatorToken.token)
                    {
                        case AssemblyTokenKind.PLUS:
                        {    
                            value = left.value + right.value;
                            break;
                        }
                        case AssemblyTokenKind.MINUS:
                            value = left.value - right.value;
                            break;             
                        default:
                            throw new Error("Unexpected unary operator");           
                    }
                }
                else if(right.value || right.value === 0)
                    value = right.value;
                else
                    throw new Error("Unexpected numeric left hand operand");      
                    
                if(value && binaryOperator.operatorToken.lexeme === "-")
                    value = -value;

                break;
            }
            case AssemblyLineOperandKind.UnaryOperator:
            {
                const unaryOperator = operand as AssemblyLineInstructionOperandUnaryOperator;
                const right = this.createOperand(unaryOperator.right);
                        
                switch(unaryOperator.operatorToken.token)
                {
                    case AssemblyTokenKind.PLUS:
                    {    
                        value = right.value;
                        break;
                    }
                    case AssemblyTokenKind.MINUS:
                        if(!right.value)
                            throw new Error("right.value is undefined");
                        value = -right.value!;
                        break;             
                    default:
                        throw new Error("Unexpected unary operator");           
                }

                break;
            }            
            case AssemblyLineOperandKind.Number:
            {
                const numberOperand = operand as AssemblyLineInstructionOperandNumber;
                value = numberOperand.value;
                break;
            }
            case AssemblyLineOperandKind.Register:
            {
                const registerOperand = operand as AssemblyLineInstructionOperandRegister;
                register = registerOperand.registerIndex;
                break;
            }
            case AssemblyLineOperandKind.Label:
            {
                const labelOperand = operand as AssemblyLineInstructionOperandLabel;
                value = this.labelAddresssMap[labelOperand.name.lexeme];
                break;
            }
            case AssemblyLineOperandKind.DataLabel:
            {
                const labelOperand = operand as AssemblyLineInstructionOperandDataLabel;
                value = this.labelAddresssMap[labelOperand.name.lexeme];
                break;
            }            
            case AssemblyLineOperandKind.Error:
            {
                throw new Error("Error operator");    
            }            
        }

        return {
            isPointer,
            value,
            register
        }
    }

    private calculateDataLabelSizes(dataLabels: AssemblyLineDataLabel[], totalEncodedInstructionSize : number) : { dataLabels : DataLabel[], totalSize : number }
    {
        const labels : DataLabel[] = [];
        let memoryOffset : number = totalEncodedInstructionSize;
        let totalSize = 0;
        dataLabels.forEach(line => {
            const output = this.assemblyLineToDataLabel(memoryOffset, line);

            output.address = memoryOffset;

            memoryOffset += output.size;            
            totalSize += output.size;

            labels.push( output );

            this.labelAddresssMap[output.label] = output.address;
        });    

        return { 
            dataLabels : labels, 
            totalSize 
        };
    }

    assemblyLineToDataLabel(memoryOffset: number, line: AssemblyLineDataLabel) : DataLabel
    {
        return new DataLabel(line.dataType, line.labelText.lexeme, line.initialValue.value, memoryOffset);
    }
    
    private divideDataLabelsAndInstructions(parsedInstructions: AssemblyParserOutput): { startInstruction:AssemblyLineEntryPoint, dataLabels: AssemblyLineDataLabel[]; instructions: AssemblyLine[]; } 
    {
        const dataLabels : AssemblyLineDataLabel[] = []; 
        const instructions : AssemblyLine[] = []; 
        const startInstructionLines : AssemblyLine[] = []; 
        let startInstructionLine : AssemblyLineEntryPoint;

        let inTextSection = false;
        let inDataSection = false;

        for(let i = 0; i < parsedInstructions.lines.length; i++)
        {
            const line = parsedInstructions.lines[i];

            switch(line.kind)
            {
                case AssemblyLineKind.SectionLabel:
                {
                    inTextSection = false;
                    inDataSection = false;

                    const sectionLabel = line as AssemblyLineSectionLabel;
                    
                    switch(sectionLabel.labelText.lexeme.toLowerCase())
                    {
                        case ".text":
                            inTextSection = true;
                            break;
                        case ".data":
                            inDataSection = true;
                            break;
                        default:
                            throw new Error(`Unexpected section label ${sectionLabel.labelText.length}`);
                    }
                    break;
                }
                case AssemblyLineKind.EntryPoint:
                    startInstructionLines.push(line as AssemblyLineEntryPoint);
                    break
                case AssemblyLineKind.DataLabel:
                    dataLabels.push(line as AssemblyLineDataLabel);
                    break;                
                case AssemblyLineKind.Label:
                case AssemblyLineKind.Instruction:
                    if(!inTextSection)
                        this.diagnostics.reportAssemblyInstructionInInvalidSection(line);
                    instructions.push(line);
                    break;                                    
                case AssemblyLineKind.Error:
                    throw new Error("AssemblyLineKind Error");
                default :
                    throw new Error("Unexpected AssemblyLineKind");
            }
        }
        
        if(startInstructionLines.length === 0)
        {
            this.diagnostics.reportAssemblyStartInstructionNotDefined();
        }
        else if(startInstructionLines.length > 1)
        {
            this.diagnostics.reportAssemblyMultipleStartInstructionsDefined(startInstructionLines);
        }

        startInstructionLine = startInstructionLines[0] as AssemblyLineEntryPoint;

        return { startInstruction : startInstructionLine, dataLabels, instructions};
    }

    private outputMachineCode(textSectionSize:number, dataSectionSize:number, dataLabels : DataLabel[]) : AssembledOutput 
    {        
        let output = new Uint8Array(textSectionSize + dataSectionSize);
        let outputView = new DataView(output.buffer);
        
        this.encodeTextSection(output);
        this.encodeDataSection(outputView, dataLabels, textSectionSize);

        return new AssembledOutput(output, [
                // registering the code section as readonly 
                new Region(0, textSectionSize - 1) // minus one here because regions record start and end, not lengths.
            ]
        );
    }

    private encodeTextSection(output : Uint8Array) : number
    {
        let bytesOutput = 0;

        for(let instructionData of this.instructions)
        {
            const instruction = instructionData.instruction;

            if(!instruction)
                throw new Error("Encountered undefoned instruction");

            const { 
                opcode, 
                opcodeMode, 
                sourceRegister, 
                destinationRegister, 
                destinationMemoryAddress, 
                sourceMemoryAddress 
            } = instruction;

            const encoded = this.encoder.encodeInstruction(opcode, 
                opcodeMode, 
                sourceRegister, 
                destinationRegister, 
                destinationMemoryAddress,
                sourceMemoryAddress);
            
            for(let i = 0; i < encoded.length; i++, bytesOutput++)
            {                                        
                output[bytesOutput] = encoded[i];
            }                
        }

        return bytesOutput;
    }

    private encodeDataSection(output : DataView, dataLabels : DataLabel[], offset : number) : void 
    {
        dataLabels.forEach((label) => {
            const {type, address, size} = label;

            switch(type)
            {
                case DataLabelType.Byte : {
                    output.setUint8(address, label.data as number);
                    break;
                } 
                case DataLabelType.Int16 : {
                    output.setUint16(address, label.data as number, true);
                    break;
                } 
                case DataLabelType.Int32 : {
                    output.setUint32(address, label.data as number, true);
                    break;
                }
                case DataLabelType.Float : {
                    output.setFloat64(address, label.data as number, true);
                    break;
                }             
                case DataLabelType.String : {
                    let str = label.data as string;

                    for(let i = 0; i < str.length; i++)
                        output.setUint16(address + (i*2), str.charCodeAt(i), true);

                    output.setUint16(address + str.length * 2, 0, true);
                    break;
                }
                case DataLabelType.Buffer : {
                    for(let i = 0; i < size; i++)                
                        output.setUint8(address + i, 0);

                    break;
                }
                default:
                    throw new RangeError("Invalid DataLabelType");
            }
        });
    }
}