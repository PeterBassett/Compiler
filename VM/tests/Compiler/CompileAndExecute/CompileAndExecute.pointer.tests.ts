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

describe("Complie Assemble and Execute pointer", () => {
[
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap != null)
        return 1;
    else
        return 0;
}`, 0],
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap == null)
        return 1;
    else
        return 0;
}`, 1],
[`
func main() : int
{
    let a : int = 5;
    let ap : *int = null;
    
    ap = &a;
    *ap = 6;

    return a;
}`, 6],
[`
func update(b : *int) : int
{
    *b = 50;
    return 1;
}
func main() : int
{
    let a : int = 5;

    update(&a);

    return a;
}`, 50],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let root : item;

    root.value = 10;

    let a : *item;
    
    a = &root;
    (*a).value = 51;

    return root.value;
}`, 51],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let root : item;
    let a : *item;
    
    a = &root;
    a.value = 51;

    return root.value;
}`, 51],
[`
struct item 
{
    value : int;    
    next : *item;
}

func length(a : *item) : int
{
    let i : int = 0;

    while (a.next != null) 
    {
        i = i + 1;
        a = a.next;
    }

    return i;
}

func main() : int
{
    let root : item;
    let mid : item;
    let end : item;

    root.value = 1;
    mid.value = 2;
    end.value = 3;

    root.next = &mid;
    mid.next = &end;
    end.next = null;

    let len = length(&root);

    return len;
}`, 3]
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});