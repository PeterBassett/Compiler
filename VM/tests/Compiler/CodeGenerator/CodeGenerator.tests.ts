import Parser from "../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import { DiagnosticType } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import { BoundGlobalScope, BoundNodeKind } from "../../../Language/Compiler/Binding/BoundNode";
import Binder from "../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../Language/Compiler/lowering/Lowerer";
import BoundTreeStructureVisitor from "../BoundTreeStructureVisitor";
import CodeGenerator from "../../../Language/Compiler/CodeGeneration/CodeGenerator";
import GeneratedCode from "../../../Language/Compiler/CodeGeneration/GeneratedCode";

describe("A CodeGenerator object", () => {

    function codeGen(text : string) : GeneratedCode
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        let binder = new Binder();
        let boundTree = binder.Bind(compilationUnit);
        let lowerer = new Lowerer();
        let newBoundTree = lowerer.lower(boundTree);
        let codeGenerator = new CodeGenerator({
            comments:false,
            blankLines:false
        });
        let result = codeGenerator.generate(newBoundTree);
        
        return result;
    }

    function testBoundTreeStructure(text : string, expected : string, mainShouldBeDefined : boolean) : void
    {
        let scope : GeneratedCode;
        
        try
        {
            scope = codeGen(text);
        }
        catch(ex)
        {
            scope = codeGen(text);
        }

        let diagnostics = scope.diagnostics.map(d => d);

        if(!mainShouldBeDefined)        
        {
            diagnostics = diagnostics.filter(d => d.type != DiagnosticType.EntryPointNotFound);
        }

        expect(diagnostics.length == 0).toEqual(true);
        expect(diagnostics).toBeTruthy();

        if(scope.success)
        {
            let output = scope.text;
            
            if(output != expected)
                printDiff(output, expected);

            expect(output).toEqual(expected);
        } 
    }

    function printDiff(a : string, b : string) : void
    {
        let aLines = a.split('\n');
        let bLines = b.split('\n');

        if(aLines.length != bLines.length)
        {
            console.log(a);
            console.log(`Line count difference ${aLines.length} vs ${bLines.length}`);
            return;            
        }

        for(let i = 0; i < aLines.length; i++)
        {
            if(aLines[i] !== bLines[i])
            {
                console.log("|" + aLines[i] + "|");
                console.log("vs");
                console.log("|" + bLines[i] + "|");    
            }
        }
    }

    [
        [`var g : int;`, 
`.data
    .g long`, false ],
[`let g : int;`, 
`.data
    .g long`, false ],        
[`let global : float;`, 
`.data
    .global float`, false ],
[`let flag : bool;`, 
`.data
    .flag byte`, false ],
[`let name : string;`, 
`.data
    .name string`, false ],
[`func main() : int
{
    return 1;
}`, 
`.data
.text
.global __entrypoint:
__entrypoint:
    MOV R6 SP
    CALL main:
    HALT
main:
    PUSH R6
    MOV R6 SP
    MVI R1 1
main_epilogue:
    MOV SP R6
    POP R6
    RET` ],                                
[`
func main() : int
{
    var n : int = 0;
    n = 5;
    return n;
}`, 
`.data
.text
.global __entrypoint:
__entrypoint:
    MOV R6 SP
    CALL main:
    HALT
main:
    PUSH R6
    MOV R6 SP
    MVI R1 0
    PUSH R1
    MVI R1 5
    MOV [R6-4] R1
    MOV R1 [R6-4]
main_epilogue:
    MOV SP R6
    POP R6
    RET`],
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
}`, 
`.data
    .g1 float 3.14
    .g2 float 3.14
    .g3 float 3.14
    .g4 float 3.15
    .g5 long 3
    .g6 long 3
    .g7 byte true
    .g8 byte false
    .g9 byte true
    .floatLiteral_0 float 3.14
.text
.global __entrypoint:
__entrypoint:
    MOV R6 SP
    CALL main:
    HALT
main:
    PUSH R6
    MOV R6 SP
    LDRf R1 .floatLiteral_0
    PUSHf R1
    MVI R1 3
    PUSH R1
    MVIb R1 1
    PUSHb R1
    MVIb R1 1
    PUSHb R1
    MVI R1 0
    PUSH R1
    MVI R1 5
    MOV [R6-18] R1
    MOV R1 [R6-18]
main_epilogue:
    MOV SP R6
    POP R6
    RET`
],
[`
let secondsInAYear : int = 60*60*24*365;

func main() : int
{
    return secondsInAYear;
}`, 
`.data
    .secondsInAYear long 0
.text
.global __entrypoint:
__entrypoint:
    MVI R1 60
    PUSH R1
    MVI R1 60
    POP R2
    MUL R1 R2
    PUSH R1
    MVI R1 24
    POP R2
    MUL R1 R2
    PUSH R1
    MVI R1 365
    POP R2
    MUL R1 R2
    STR R1 .secondsInAYear
    MOV R6 SP
    CALL main:
    HALT
main:
    PUSH R6
    MOV R6 SP
    LDR R1 .secondsInAYear
main_epilogue:
    MOV SP R6
    POP R6
    RET`],
[`func test(a:float, b:int, c:float, d:float, e:float) : float
{
    return a;
}
func main() : float
{
    return test(1.0, 2, 3.0, 1.0, 1.0);
}`, 
`.data
    .floatLiteral_0 float 1
    .floatLiteral_1 float 3
.text
.global __entrypoint:
__entrypoint:
    MOV R6 SP
    CALL main:
    HALT
main:
    PUSH R6
    MOV R6 SP
    LDRf R1 .floatLiteral_0
    PUSHf R1
    LDRf R1 .floatLiteral_0
    PUSHf R1
    LDRf R1 .floatLiteral_1
    PUSHf R1
    MVI R1 2
    PUSH R1
    LDRf R1 .floatLiteral_0
    PUSHf R1
    CALL test:
    POPf R3
    POPf R3
    POPf R3
    POP R3
    POPf R3
main_epilogue:
    MOV SP R6
    POP R6
    RET
test:
    PUSH R6
    MOV R6 SP
    MOVf R1 [R6+8]
test_epilogue:
    MOV SP R6
    POP R6
    RET`
]
    ].forEach((item) => {
        it(`should produce the correct ASM code ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as string;

            let mainShouldBeDefined = true;
            if(item.length > 2)
                mainShouldBeDefined = item[2] as boolean;

            //diabled for now.
            testBoundTreeStructure(text, expected, mainShouldBeDefined);
        });
    });
});