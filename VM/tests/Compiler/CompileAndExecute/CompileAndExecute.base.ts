import GeneratedCode from "../../../Language/Compiler/CodeGeneration/GeneratedCode";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import Binder from "../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../Language/Compiler/lowering/Lowerer";
import CodeGenerator from "../../../Language/Compiler/CodeGeneration/CodeGenerator";
import { Logger } from "../../../Assembler/interfaces/Logger";
import Parser from "../../../Language/Compiler/Syntax/Parser";
import Assembler from "../../../Assembler/Assembler";
import AssemblyParser from "../../../Assembler/Parser";
import defaultPreprocessor from "../../../Assembler/Preprocessors/DefaultPreprocessor";
import InstructionCoder from "../../../VirtualMachine/CPU/Instruction/InstructionCoder";
import InstructionCoder32Bit from "../../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import RAM from "../../../VirtualMachine/Memory/RAM";
import Flags from "../../../VirtualMachine/CPU/Flags";
import RegisterBank from "../../../VirtualMachine/CPU/RegisterBank";
import CPU from "../../../VirtualMachine/CPU/CPU";
import InstructionCoderVariable from "../../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { AssembledOutput } from "../../../Assembler/AssembledOutput";
import { Diagnostics } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import StringDiagnosticsPrinter from "../../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";

export default function run(text : string) : number 
{
    const code = compile(text);
    const assemblyStream = assemble(code.text);
    const result = execute(assemblyStream);

    return result;
}

function assertNoError(source : string, diagnostics : Diagnostics) : void
{
    if(diagnostics.length > 0)
    {
        const printer = new StringDiagnosticsPrinter();
        expect(diagnostics.length).toEqual(0);

        diagnostics.map( (d, i) => {
            const output = printer.printDiagnostic(diagnostics, d);
            fail(`${source} : ${output}`);
            return "";
        });
    }
}

function compile(text : string) : GeneratedCode
{
    const source = new SourceText(text);        
    
    const parser = new Parser(source);
    const compilationUnit = parser.parse();
    assertNoError("Parsing", compilationUnit.diagnostics);
    
    const binder = new Binder();
    const boundTree = binder.Bind(compilationUnit);
    assertNoError("Binding", boundTree.diagnostics);
    
    const lowerer = new Lowerer();
    const newBoundTree = lowerer.lower(boundTree);
    assertNoError("Lowering", newBoundTree.diagnostics);

    const codeGenerator = new CodeGenerator();
    const result = codeGenerator.generate(newBoundTree);
    assertNoError("CodeGen", result.diagnostics);

    if(!result.success)
        throw new Error(result.diagnostics.get(0).message);

    return result;
}

function CreateInstructionCoder() : InstructionCoder
{
    const instructionCoderVariable = new InstructionCoderVariable();

    return instructionCoderVariable;
}

function assemble(assemblyCode : string) : AssembledOutput
{
    const logger : Logger = () => {};
    const instructionCoder = CreateInstructionCoder();        
    const assembler = new Assembler(logger, AssemblyParser, defaultPreprocessor, instructionCoder, 0);

    return assembler.assemble(assemblyCode)
}

function execute(output : AssembledOutput) : number
{
    let ram : RAM;
    let flags : Flags;
    let registers : RegisterBank;
    const ramSize = 1 << 16;
    let cpu : CPU;

    const maximumSteps = 500000;
    
    ram = new RAM(ramSize);
    registers = new RegisterBank(ramSize);
    flags = new Flags();
    
    ram.blitStoreBytes(0, output.machineCode);
    ram.setReadonlyRegions(output.regions);

    const instructionCoder = CreateInstructionCoder();
    
    cpu = new CPU(ram, registers, flags, instructionCoder);

    let stepCount = 0;
    try
    {
        while(true)   
        {                  
            cpu.step();

            stepCount++;

            if(stepCount > maximumSteps)
                throw new Error("Step Count Exceeded.");
        }
    }
    catch(e)
    {
        if(e.message != "HALT EXECUTION") 
            throw e;
    }

    return registers.R1;
}