import { printPerformance, resetPerformance } from "./CompileAndExecute.base";
import { Diagnostics } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import StringDiagnosticsPrinter from "../../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";
import GeneratedCode from "../../../Language/Compiler/CodeGeneration/GeneratedCode";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import Parser from "../../../Language/Compiler/Syntax/Parser";
import Binder from "../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../Language/Compiler/lowering/Lowerer";
import CodeGenerator from "../../../Language/Compiler/CodeGeneration/CodeGenerator";
import InstructionCoder from "../../../VirtualMachine/CPU/Instruction/InstructionCoder";
import InstructionCoderVariable from "../../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { AssembledOutput } from "../../../Assembler/AssembledOutput";
import RAM from "../../../VirtualMachine/Memory/RAM";
import Flags from "../../../VirtualMachine/CPU/Flags";
import RegisterBank from "../../../VirtualMachine/CPU/RegisterBank";
import CPU from "../../../VirtualMachine/CPU/CPU";
import { AssemblyParser } from "../../../Assembler/AssemblyParser";
import { AssemblyLexer } from "../../../Assembler/AssemblyLexer";
import Assembler from "../../../Assembler/Assembler";

let times : any = {};
export function addPerformanceMark(t1 : number, t2 : number, name : string)
{
    times[name] = times[name] || [];
    times[name].push(t2 - t1);
}

export function resetPerformanceMarks()
{
    times = {};
}

export function printPerformanceMarks()
{
    const arrSum = (arr:number[]) : number => arr.reduce((a,b) => a + b, 0);
    const arrAvg = (arr:number[]) : number => arr.reduce((a,b) => a + b, 0) / arr.length;

    let names = Object.keys(times);

    let t : any = {};

    let totalExecutionTime = 0;
    for(let i = 0; i < names.length; i++)
    {
        t[names[i]] = {};
        t[names[i]].total = arrSum(times[names[i]]);
        t[names[i]].avg = arrAvg(times[names[i]]);
        totalExecutionTime += t[names[i]].total; 
    }

    for(let i = 0; i < names.length; i++)
    {
        t[names[i]].percentage = ((t[names[i]].total / totalExecutionTime) * 100.0) + "%";
    }

    console.table(t);
}

describe("Complie Assemble and Execute multiple times for performance comparisons", () => {
    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("performance");
    });
        
    let instructionCoder : InstructionCoder;

    function run(text : string, 
        ic : InstructionCoder, 
        assembler : (text:string) => AssembledOutput,
        section : string) : number 
    {
        instructionCoder = ic;        

        let t1 : number;
        let t2 : number;

        t1 = performance.now();
        const code = compile(text);
        t2 = performance.now();
        addPerformanceMark(t1, t2, /*section +*/ " compile");

        t1 = performance.now();
        const assemblyStream = assembler(code.text);
        t2 = performance.now();
        addPerformanceMark(t1, t2, /*section +*/ " assemble");

        t1 = performance.now();
        const result = execute(assemblyStream);
        t2 = performance.now();
        addPerformanceMark(t1, t2, /*section +*/ " execute");
        
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

    function assembleV2(assemblyCode : string) : AssembledOutput
    {        
        const source = new SourceText(assemblyCode);
        const diagnostics = new Diagnostics(source);      
        
        const lexer = new AssemblyLexer(source, diagnostics);
        const parser = new AssemblyParser(lexer, diagnostics);
        const instructionCoder = new InstructionCoderVariable();
        
        const assembler = new Assembler(parser, instructionCoder, diagnostics);
        
        return assembler.assemble();
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

let testCases = [
[`struct root 
{
    a1 : int;
}

struct leaf1
{
    b1 : int;
    b2 : root;
}

struct leaf2
{
    c1 : int;
    c2 : leaf1;
}

struct leaf3
{
    d1 : int;
    d2 : leaf2;
}

func main() : int
{
    let l3 : leaf3;
    let l2 : leaf2;

    // complex multilevel referencing
    l2.c2.b2.a1 = 3;

    l3.d2.c2.b2.a1 = l2.c2.b2.a1;

    return l3.d2.c2.b2.a1;
}`, 3],
[`struct leaf 
{
    a : int;
}

struct branch 
{
    a : int;
    b: leaf;
}

struct root 
{
    a : int;
    b:branch;
}

func foo() : int
{
    let a : root;
    let b : leaf;
    let c : branch;

    return 1+2;
}

func main() : int
{
    // local variables only
    let a : root;
    let b : leaf;
    let c : branch;

    return foo();
}`, 3],
[`struct leaf 
{
    a : int;
}
func main() : int
{
    let b : leaf;
    b.a = 3;
    return b.a;
}`, 3],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}
func main() : int
{
    let a : root;
    a.a.la = 3;
    a.a.lb = 1;

    let l : leaf;
    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    a : int;
}

struct branch 
{
    a : int;
    b: leaf;
}

struct root 
{
    a : int;
    b:branch;
}

func main() : int
{
    // multilevel assignment
    let r : root;
    r.a = 5;
    r.b.a = 15;
    r.b.b.a = 25;

    return r.b.a;
}`, 15],
[`struct root 
{
    a : int;
}

func main() : int
{
    // simple assignment and member referencing
    let r : root;
    r.a = 5;

    return r.a;
}`, 5],
[`struct root 
{
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct root 
{
    flag : bool;
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : float
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.b;
}`, 5.3],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : bool
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.flag;
}`, 0],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : bool
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;
 
    // create copy of struct
    s2 = s1;

    return s2.flag;
}`, 1],
[`struct root 
{
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s2.a = 4;
    
    // create copy of struct
    s2 = s1;

    s1.a = 5;

    return s2.a;
}`, 6],
[`struct root 
{
    a : int;
    b : int;
    c : int;
}

func foo(s : root) : int
{
    return s.b;
}

func main() : int
{
    // simple struct parameter and member referencing
    let r : root;
    r.a = 1;
    r.b = 5;
    r.c = 12;

    return foo(r);
}`, 5],
[`struct root 
{
    a : int;
    b : int;
    c : int;
}

func foo() : root
{
    let r : root;
    r.a = 1;
    r.b = 5;
    r.c = 12;

    return r; // struct return type
}

func main() : int
{
    let r : root;
    // struct return types!
    r = foo();
    return r.b;
}`, 5],
[`struct root 
{
    a : float;
    b : int;
    c : bool;
}

func foo() : root
{
    let r : root;
    r.a = 3.14159;
    r.b = 5;
    r.c = true;
    return r;
}

func main() : int
{
    // rvalue member reference
    return foo().b;
}`, 5],
[`struct root 
{
    a : float;
    b : int;
    c : bool;
}

func foo() : root
{
    let bar1:int;
    let bar2:bool;
    let r : root;
    let bar3:float;

    r.a = 3.14159;
    r.b = 5;
    r.c = true;
    return r;
}

func main() : int
{
    let bar1:int;
    let bar2:bool;
    let bar3:float;
    let bar4:float;

    // rvalue member reference with complex stack allocations
    return foo().b;
}`, 5],
[`struct root 
{
    a : float;
    b : int;
    c : bool;
}

func makeRoot() : root
{
    let r : root;

    r.a = 3.14159;
    r.b = 4;
    r.c = true;
    
    return r;
}

func main() : int
{
    let bar1:int;

    // struct initialisation from function call
    let r:root = makeRoot();
    let bar3:float;
    let bar4:float;

    return r.b;
}`, 4],
[`struct root 
{
    a : int;    
    b : float;
    c : bool;
    d: int;
    e: float;
}

func foo() : root
{
    let r : root;
    r.a = 1;
    r.b = 3.14159;
    r.c = true;
    r.d = 7;
    r.e = 0.7171;

    return r; // struct return type
}

func foo2() : float
{
    let r : root = foo();
    return r.b;
}

func main() : float
{
    return foo2();
}`, 3.14159],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    return s1.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : float
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    return s1.b;
}`, 5.3],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : bool
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    return s1.flag;
}`, 0],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : bool
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;
 
    return s1.flag;
}`, 1],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s0 : root;
let s1 : root;
let s2 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;
 
    return s1.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s0 : root;
let s1 : root;
let s2 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;

    s2.a = s1.a;
    s2.b = s1.b;
    s2.flag= s1.flag;
 
    return s2.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;
let s2 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let a : root;

func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    let l : leaf;
    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let l : leaf;
 
func main() : int
{
    let a : root;
    a.a.la = 3;
    a.a.lb = 1;

    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let a : root;
let l : leaf;
 
func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

// other way around
let l : leaf;
let a : root;
 
func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let a : root;
 
func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    a.b = a.a;

    return a.b.la + a.b.lb;
}`, 4],
    ];
   
    // currently not required. this was used to prove that the new Assembler and new RegisterBank implemetations 
    // gave a 4-5x speed inprovement.

    /*
    const iterationCount = 50

    const ic32 = new InstructionCoder32Bit();
    const icV = new InstructionCoderVariable();

    let t1 : number;
    let t2 : number;
    
    it(`InstructionCoder32Bit & RegisterBank2 & New Assembler`, () => {      
        t1 = performance.now();
        for(let i = 0; i < iterationCount; i++)            
        {
            for(let i of testCases)
            {
                const text = i[0] as string;
                const expected = i[1] as number;
        
                const result = run(text, ic32, (t) => assembleV2(t), `InstructionCoder32Bit & RegisterBank2 & New Assembler`);
                expect(result).toEqual(expected);
            }
        }
        t2 = performance.now();
        addPerformanceMark(t1, t2, `InstructionCoder32Bit & RegisterBank2 & New Assembler`);
    });

    it(`InstructionCoderVariable & RegisterBank2 & New Assembler`, () => {      
        t1 = performance.now();
        for(let i = 0; i < iterationCount; i++)            
        {
            for(let i of testCases)
            {
                const text = i[0] as string;
                const expected = i[1] as number;
        
                const result = run(text, icV, (t) => assembleV2(t), `InstructionCoderVariable & RegisterBank2 & New Assembler`);            
                expect(result).toEqual(expected);
            }
        }
        t2 = performance.now();
        addPerformanceMark(t1, t2, `InstructionCoderVariable & RegisterBank2 & New Assembler`);
    });
    */
});