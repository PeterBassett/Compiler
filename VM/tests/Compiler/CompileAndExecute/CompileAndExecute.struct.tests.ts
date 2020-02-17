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
import run from "./CompileAndExecute.base";

describe("Complie Assemble and Execute structs", () => {
    [
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
}`, 3.14159]
/*
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