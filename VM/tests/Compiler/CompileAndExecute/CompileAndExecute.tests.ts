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
import TextSpan from "../../../Language/Compiler/Syntax/Text/TextSpan";

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

    function CreateInstructionCoder() : InstructionCoder
    {
        const instructionCoder32 = new InstructionCoder32Bit();
        const instructionCoderVariable = new InstructionCoderVariable();

        return instructionCoder32;
    }

    function assemble(assemblyCode : string) : AssembledOutput
    {
        const logger : Logger = (lineNumber : number, characterNumber : number, message : string) => {};
        const instructionCoder = CreateInstructionCoder();        
        const assembler = new Assembler(logger, AssemblyParser, defaultPreprocessor, instructionCoder, 0);

        return assembler.assemble(assemblyCode)
    }

    function execute(output : AssembledOutput) : number
    {
        let assembler : Assembler;
        let ram : RAM;
        let flags : Flags;
        let registers : RegisterBank;
        const ramSize = 1 << 10;
        let cpu : CPU;
        let ip : number;

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
}`, 15],
[
`let secondsInAYear : int = 60*60*24;
func main() : int
{
    return secondsInAYear;
}`, 86400
],
[
`var a : int = 1;
func change() : int
{
    // assign to global
    a = 5;
    return 1;
}
func main() : int
{
    // assign to global
    a = 2;        
    change();

    // read from global
    return a;
}`, 5
],
[
`
var a1 : float = 1.2;
var a2 : float = 2.3;
var a3 : float = 3.4;
var a4 : float = 4.5;
var b1 : float;
var b2 : float;
var b3 : float;
var b4 : float; 
func main() : float
{
    b1 = 1.2;
    b2 = 2.3;
    b3 = 3.4;
    b4 = 4.5;

    return a1;// + b4;
}`, 1.2
],
[`func main() : float
{
    return 1.2 + 2.3;
}`, 3.5
],
[`func main() : bool
{
    return true;
}`, 1
],
[`func main() : bool
{
    return false;
}`, 0
],
[`func main() : bool
{
    return 1.2 < 2.0;
}`, 1
],
[`func main() : bool
{
    return 1.2 > 2.0;
}`, 0
],
[`func main() : bool
{
    return 1.2 == 2.0;
}`, 0
],
[`func main() : bool
{
    return 2.0 == 2.0;
}`, 1
],
[`func main() : bool
{
    return 2.0 < 2.0;
}`, 0
],
[`func main() : bool
{
    return 2.0 > 2.0;
}`, 0
],
[`func main() : bool
{
    return 2.0 >= 2.0;
}`, 1
],
[`func main() : bool
{
    return 2.0 <= 2.0;
}`, 1
],
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
[
`func test(num:int):int  
{
    // test the greater than or equal to operator
    if (num >= 0)
    {
		return 1;
    }
	else
    {
    	return 2;
    }    
}
func main() : int {
	var a : int = 0;
    var b : int = 5;
    return test(a-b);
}`, 2],
[
`func fib(num:int):int 
{
	var a : int = 1;
    var b : int = 0;
    var temp : int = 0;

    while (num >= 0)
    {
      temp = a;
      a = a + b;
      b = temp;
      num = num - 1;
    }

  	return b;
}

func main() : int {
    return fib(25);
}`, 121393],
[
`func McCarthy(n:int) : int
{
    if (n > 100)
        return n - 10;

    return McCarthy(McCarthy(n + 11));
}
func main() : int
{
    return McCarthy(45);
}
`, 91],
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
}`, 5]

/*,
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
}`, 3,14159]
,
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
`false`]*/
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});