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

describe("Complie Assemble and Execute", () => {

    function run(text : string) : number 
    {
        const code = compile(text);
        const assemblyStream = assemble(code.text);
        const result = execute(assemblyStream);

        return result;
    }

    function compile(text : string) : GeneratedCode
    {
        const source = new SourceText(text);        
        const parser = new Parser(source);
        const compilationUnit = parser.parse();
        const binder = new Binder();
        const boundTree = binder.Bind(compilationUnit);
        const lowerer = new Lowerer();
        const newBoundTree = lowerer.lower(boundTree);
        const codeGenerator = new CodeGenerator();
        const result = codeGenerator.generate(newBoundTree);
        
        if(!result.success)
            throw new Error(result.diagnostics.get(0).message);

        return result;
    }

    function assemble(assemblyCode : string) : ArrayBuffer
    {
        const logger : Logger = (lineNumber : number, characterNumber : number, message : string) => {};
        const instructionCoder = new InstructionCoder32Bit();
        const assembler = new Assembler(logger, AssemblyParser, defaultPreprocessor, instructionCoder, 0);

        return assembler.assemble(assemblyCode)
    }

    function execute(instructionStream : ArrayBuffer) : number
    {
        let assembler : Assembler;
        let ram : RAM;
        let flags : Flags;
        let registers : RegisterBank;
        let instructionCoder : InstructionCoder;
        const ramSize = 1 << 10;
        let cpu : CPU;
        let ip : number;

        const maximumSteps = 500000;
        
        ram = new RAM(ramSize);
        registers = new RegisterBank(ramSize);
        flags = new Flags();
        
        ram.blitStoreBytes(0, instructionStream);

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
[`func main() : int
{
    return 5;
}`, 5],   
[`func main() : int
{
    return 5 + 1;
}`, 6],
[`func main() : int
{
    return 5 - 1;
}`, 4],
[`func main() : int
{
    return 5 * 2;
}`, 10],
[`func main() : int
{
    return 10 / 2;
}`, 5],
[`func main() : int
{
    let i : int = 5;
    return i;
}`, 5],
[`func main() : int
{
    let i : int = 5;
    return i * i;
}`, 25],
[`func main() : int
{
    let i : int = 5;
    let n : int = 10;
    return i * n;
}`, 50],
[`func main() : int
{
    let i : int = 0;
    i = 10;
    return i;
}`, 10],
[`func main() : int
{
    let i : int;
    i = 10;
    let n : int;
    n = 20;
    return i + n;
}`, 30],
[`func main() : int
{
    if true
        return 1;
    else
        return 0;        
}`, 1],
[`func main() : int
{
    if false
        return 1;
    else
        return 0;        
}`, 0],
[`func main() : int
{
    if false
        return 1;
    
    return 0;        
}`, 0],
[`func main() : int
{
    let x : int = 0;
    for let i in 1 to 10
        x = x + i;
        
    return x;
}`, 55],
[`func main() : int
{
    let x : int = 0;
    while x < 10
        x = x + 1;
        
    return x;
}`, 10],
[`func main() : int
{
    let x : int = 0;
    
    for let a in 1 to 10
        for let b in 1 to 10
            x = x + 1;
    
    return x;
}`, 100],
[`func main() : int
{
    if true
    {
        let i : int = 0;
        i = i + 5;
    }
    let j : int = 1;
    return j;
}`, 1],
[`func plusOne(n:int):int {
    return n + 1;
}

func main() : int {
    return plusOne(1);
}`, 2],
[`func add(a:int, b:int):int {
    return a + b;
}

func main() : int {
    return add(1, 2);
}`, 3],
[`
func a(x:int):int
{
    return x + 1;
}
func b(x:int):int
{
    return a(x) + 1;
}
func c(x:int):int
{
    return b(x) + 1;
}
func d(x:int):int
{
    return c(x) + 1;
}
func main() : int {
    return d(1);
}`, 5],
[`func add(a:int, b:int, c:int, d:int):int {
    return a + b + c + d;
}

func main() : int {
    return add(1, 2, 3, 4);
}`, 10],
[`func plusOne(n:int):int {
    return n + 1;
}

func timesTwo(n:int):int {
    return n * 2;
}

func main() : int {
    return timesTwo(plusOne(1));
}`, 4],
[`func fib(n:int):int {
    if (n == 0 || n == 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}

func main() : int {
    let n : int = 13;
    return fib(n);
}`, 233],
[`func main() : int {
    // integer division
    return 5 / 2;
}`, 2],
[`func main() : float {
    return 3.14159;
}`, 3.14159],
[`func main() : int {
    let f : bool = true;
    if f
        return 45;
    
    return 123;
}`, 45],
[`func a(n:int):int {
    n = 5;
    return n;
}
func main() : int {
    return a(1);
}`, 5],
[`func f(flag:bool):bool {
    return flag;
}
func main() : int {
    if f(true)
        return 45;
    
    return 123;
}`, 45],
[`func iif(n:int, flag:bool, n2:int):int {
    if flag    
        return n;
    else
        return n2;
}
func main() : int {
    return iif(45, true, 123);
}`, 45],
[`func iif(n:int, flag:bool, n2:int):int {
    if flag    
        return n;
    else
        return n2;
}
func main() : int {
    return iif(45, false, 123);
}`, 123],
[`func three(n1:int, n2:int, n3:int):int {
    return n2;
}
func main() : int {
    return three(1, 2, 3);
}`, 2],
[`func three(n1:int, n2:int, n3:int):int {
    return (n3*n2)/n1;
}
func main() : int {
    return three(1, 2, 3);
}`, 6],
[`func test(
	a : int, 
	b : bool, 
    c : int, 
    d : bool) : int 
{ 
	return c;
}

func main() : int 
{
    let a : int = 5;
    let b : bool = true;
    let c : int = 15;
    let d : bool = false;

	return test(a, b, c, d);
}`, 15]
/*
[`func main() : float {
    // floating point division
    return 5.0 / 2;
}`, 2.5],
[`func main() : int {
    return 5 / 2;
}`,
2],
[`func main() : int {
    return int(5.5);
}`,
5],
[`func main() : string {
    return string(3.14159);
}`,
`3.14159`],
[`func main() : string {
    return string(true);
}`,
`true`],
[`func main() : string {
    return string(1==2);
}`,
`false`] */
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});