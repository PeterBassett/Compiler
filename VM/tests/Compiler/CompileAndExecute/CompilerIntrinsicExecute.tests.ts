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
import { AssembledOutput } from "../../../Assembler/AssembledOutput";

describe("Compiler Intrinsic Execute", () => {

    function run(text : string) : number 
    {
        let code = compile(text);
        let assemblyStream = assemble(code.text);
        let result = execute(assemblyStream);

        return result;
    }

    function compile(text : string) : GeneratedCode
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        let binder = new Binder();
        let boundTree = binder.Bind(compilationUnit);
        let lowerer = new Lowerer();
        let newBoundTree = lowerer.lower(boundTree);
        let codeGenerator = new CodeGenerator();
        let result = codeGenerator.generate(newBoundTree);
        
        if(!result.success)
            throw new Error(result.diagnostics.get(0).message);

        return result;
    }

    function assemble(assemblyCode : string) : AssembledOutput
    {
        let logger : Logger = (lineNumber : number, characterNumber : number, message : string) => {};
        let instructionCoder = new InstructionCoder32Bit();
        let assembler = new Assembler(logger, AssemblyParser, defaultPreprocessor, instructionCoder, 0);

        return assembler.assemble(assemblyCode)
    }

    function execute(output : AssembledOutput) : number
    {
        let assembler : Assembler;
        let ram : RAM;
        let flags : Flags;
        let registers : RegisterBank;
        let instructionCoder : InstructionCoder;
        let ramSize = 1 << 10;
        let cpu : CPU;
        let ip : number;

        const maximumSteps = 500000;
        
        ram = new RAM(ramSize);
        registers = new RegisterBank(ramSize);
        flags = new Flags();
        
        ram.blitStoreBytes(0, output.machineCode);
        ram.setReadonlyRegions(output.regions);

        instructionCoder = new InstructionCoder32Bit();
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

[
[`func main() : int {
    
    return rnd(5, 5);
}`, 5],
[`func main() : int {
    
    return rnd(3, 3) + rnd(8, 8);
}`, 11],
[`
func getANumber(a : int) : int
{
    return rnd(a,a) + 1;
}
func main() : int {
    return getANumber(3) * 5;
}`, 20]

/*,
[`
function MandelbrotFractionalEscapeTime(cr : float, ci : float) : float
{            
    var zr = cr;
    var zi = ci;
    let MaxIterations = 20
    let log2 = Math_Log(2);

    for (var counter in 0 to MaxIterations)
    {
        var r2 : float = zr * zr;
        var i2 : float = zi * zi;

        if (r2 + i2 > 4.0)
        {
            var log_zn = Math_Log(r2 + i2) / 2.0;
            var nu = Math_Log(log_zn / log2) / log2;

            return counter + 1 - nu;                    
        }

        zi = 2.0 * zr * zi + ci;
        zr = r2 - i2 + cr;
    }

    return float(MaxIterations) - 1;
}

func main() : int {
    return MandelbrotFractionalEscapeTime(1.0, 1.0);
}`, 20.0]*/
].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as number;

            let result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});