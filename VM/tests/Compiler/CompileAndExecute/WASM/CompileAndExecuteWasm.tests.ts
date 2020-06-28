import Parser from "../../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../../Language/Compiler/Syntax/Text/SourceText";
import { DiagnosticType } from "../../../../Language/Compiler/Diagnostics/Diagnostics";
import { BoundGlobalScope, BoundNodeKind } from "../../../../Language/Compiler/Binding/BoundNode";
import Binder from "../../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../../Language/Compiler/lowering/Lowerer";
import BoundTreeStructureVisitor from "../../BoundTreeStructureVisitor";
import GeneratedCode from "../../../../Language/Compiler/CodeGeneration/AssemblyLanguage/GeneratedCode";
import WasmCodeGenerator from "../../../../Language/Compiler/CodeGeneration/WASM/WasmCodeGenerator";
import { resetPerformance } from "../../CompileAndExecute/CompileAndExecute.base";

describe("A WasmCodeGenerator object", () => {

    async function test(text : string, expected:any)
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        let binder = new Binder();
        let boundTree = binder.Bind(compilationUnit);

        let codeGenerator = new WasmCodeGenerator();
        let wasm = codeGenerator.generate(boundTree);
        
        try
        {
            const p = await WebAssembly.instantiate(wasm);
            const exports = p.instance.exports as any;    
            const result = exports.main();    
         
            expect(result).toEqual(expected);
        }
        catch(e)
        {
            console.log(e.message + text);
            fail("Exception caught");
        }
    }
[
[`func main() : int
{
    return 4;
}`, 4], 
[`func main() : int
{
    return (6 + 4 * 2) / 2;
}`, 7],/*
[`
func main() : int
{
    var n : int = 0;
    n = 5;
    return n;
}`, 5]


,
[`
let g1 : float = 3.14;
let g2 : float = 3.14;
let g3 : float = 3.14;
let g4 : float = 3.15;
let g5 : int = 3;
let g6 : int = 3;
let g7 : bool = true;
let g8 : bool = false;
let g9 : bool = true;

func main() : int
{
    let localf : float = 3.14;
    let locali : int = 3;
    let localbt : bool = true;
    let localbf : bool = true;

    var n : int = 0;
    n = 5;
    return n;
}`, 5],
[`
let secondsInAYear : int = 60*60*24*365;
func main() : int
{
    return secondsInAYear;
}`, 60*60*24*365],
[`func test(a:float, b:int, c:float, d:float, e:float) : float
{
    return a;
}
func main() : float
{
    return test(1.0, 2, 3.0, 1.0, 1.0);
}`, 1]*/
    ].forEach((item) => {
        it(`should produce the correct ASM code ` + item[0], async () => {  
            let text = item[0] as string;
            let expected = item[1];

            //diabled for now.
            await test(text, expected);
        });
    });
});