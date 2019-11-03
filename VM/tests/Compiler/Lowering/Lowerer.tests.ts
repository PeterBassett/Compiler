import Parser from "../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import { DiagnosticType } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import { BoundGlobalScope, BoundNodeKind } from "../../../Language/Compiler/Binding/BoundNode";
import Binder from "../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../Language/Compiler/lowering/Lowerer";
import BoundTreeStructureVisitor from "../BoundTreeStructureVisitor";

describe("A Lowerer object", () => {

    function lower(text : string) : BoundGlobalScope
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        let binder = new Binder();
        let boundTree = binder.Bind(compilationUnit);
        let lowerer = new Lowerer();
        let newBoundTree = lowerer.lower(boundTree);

        return newBoundTree;
    }

    function testBoundTreeStructure(text : string, structure : string) : void
    {
        let scope :BoundGlobalScope;
        
        try{
            scope = lower(text);
        }
        catch(ex)
        {
            scope = lower(text);
        }

        expect(scope.success).toEqual(true);
        expect(scope.diagnostics).toBeTruthy();
        expect(scope.diagnostics.length).toEqual(0);
    
        if(scope.success)
        {
            let visitor = new BoundTreeStructureVisitor();
            
            visitor.Visit(scope);
            
            if(visitor.structure != structure)
                printDiff(visitor.structure, structure);

            expect(visitor.structure).toEqual(structure);
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

        [`func main() : int
{
    // this is a test
    return 1; // trailing too

    /* oh 
    what
     a
      test */ 

}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<1:int>
` ],

[`func main() : int
{
    return 1;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<1:int>
` ],

[`func main() : float
{
    return 3.14;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:float>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<3.14:float>
` ],

[`func main() : string
{
    return "TEST";
}`, 
`BoundGlobalScope
    FunctionDefinition<main:string>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<TEST:string>
` ],

[`func main( a:int, b:float, c:string) : int
{
    return 1;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
            ParameterDeclaration<a:int>
            ParameterDeclaration<b:float>
            ParameterDeclaration<c:string>
        BlockStatement
            ReturnStatement
                LiteralExpression<1:int>
` ],

[`func main() : int
{
    return 1;
}

func a() : int
{
    return 2;
}

func b() : int
{
    return 3;
}
`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<1:int>
    FunctionDefinition<a:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<2:int>
    FunctionDefinition<b:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<3:int>
`],
                
[`func add(a:int, b:int) :int => a + b;`, 
`BoundGlobalScope
    FunctionDefinition<add:int>
        ParameterDeclarationList
            ParameterDeclaration<a:int>
            ParameterDeclaration<b:int>
        BlockStatement
            ReturnStatement
                BinaryExpression<+>
                    VariableExpression<a:int>
                    VariableExpression<b:int>
` ],
[`func main() : bool
{
    return true;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:bool>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<true:bool>
` ],
[`func main() : bool
{
    return false;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:bool>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<false:bool>
` ],
[`
let global : int = 5;
func main() : int
{
    return global;
}`, 
`BoundGlobalScope
    VariableDeclaration<global:int>
        LiteralExpression<5:int>
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                VariableExpression<global:int>
` ],
[`
var global : int = 5;
func main() : int
{
    return global;
}`, 
`BoundGlobalScope
    VariableDeclaration<global:int>
        LiteralExpression<5:int>
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                VariableExpression<global:int>
` ],
[`
func main() : int
{
    var n : int = 0;
    n = 5;
    return n;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<0:int>
            ExpressionStatement
                AssignmentExpression<n:int>
                    LiteralExpression<5:int>
            ReturnStatement
                VariableExpression<n:int>
` ]
    ].forEach((item) => {
        it(`should leave bound trees alone ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as string;
            testBoundTreeStructure(text, expected);
        });
    });

[    
[`func main() : int
{
    if 1 == 2
    {
        return 1;
    }
    else
    {
        return 2;
    }
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ConditionalGotoStatement<Label1:JIT=false>
                BinaryExpression<==>
                    LiteralExpression<1:int>
                    LiteralExpression<2:int>
            ReturnStatement
                LiteralExpression<1:int>
            GotoStatement<Label2>
            LabelStatement<Label1>
            ReturnStatement
                LiteralExpression<2:int>
            LabelStatement<Label2>
` ],
[
`func fib(n:int):int {
    if (n == 0 || n == 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}

func main() : int {
    let n : int = 5;
    return fib(n);
}`,
`BoundGlobalScope
    FunctionDefinition<fib:int>
        ParameterDeclarationList
            ParameterDeclaration<n:int>
        BlockStatement
            ConditionalGotoStatement<Label1:JIT=false>
                BinaryExpression<||>
                    BinaryExpression<==>
                        VariableExpression<n:int>
                        LiteralExpression<0:int>
                    BinaryExpression<==>
                        VariableExpression<n:int>
                        LiteralExpression<1:int>
            ReturnStatement
                VariableExpression<n:int>
            GotoStatement<Label2>
            LabelStatement<Label1>
            ReturnStatement
                BinaryExpression<+>
                    CallExpression<fib>
                        BinaryExpression<->
                            VariableExpression<n:int>
                            LiteralExpression<1:int>
                    CallExpression<fib>
                        BinaryExpression<->
                            VariableExpression<n:int>
                            LiteralExpression<2:int>
            LabelStatement<Label2>
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<5:int>
            ReturnStatement
                CallExpression<fib>
                    VariableExpression<n:int>
`
],
    [`
func main() : int
{
    let n : int = 0;

    for let i in 1 to 100
        n = n + i;

    return n;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<0:int>
            VariableDeclaration<i:int>
                LiteralExpression<1:int>
            ExpressionStatement
                AssignmentExpression<i:int>
                    LiteralExpression<1:int>
            VariableDeclaration<upperBound1:int>
                LiteralExpression<100:int>
            GotoStatement<Label1>
            LabelStatement<Label2>
            ExpressionStatement
                AssignmentExpression<n:int>
                    BinaryExpression<+>
                        VariableExpression<n:int>
                        VariableExpression<i:int>
            ExpressionStatement
                AssignmentExpression<i:int>
                    BinaryExpression<+>
                        VariableExpression<i:int>
                        LiteralExpression<1:int>
            LabelStatement<Label1>
            ConditionalGotoStatement<Label2:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<i:int>
                    VariableExpression<upperBound1:int>
            LabelStatement<break1>
            ReturnStatement
                VariableExpression<n:int>
`],
[`
func main() : int
{
    let n : int = 0;

    if true
    {
        for let i in 1 to 100
            n = n + i;
    }
    else
    {
        for let i in 100 to 1000
            n = n + i;
    }

    return n;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<0:int>
            ConditionalGotoStatement<Label1:JIT=false>
                LiteralExpression<true:bool>
            VariableDeclaration<i:int>
                LiteralExpression<1:int>
            ExpressionStatement
                AssignmentExpression<i:int>
                    LiteralExpression<1:int>
            VariableDeclaration<upperBound1:int>
                LiteralExpression<100:int>
            GotoStatement<Label3>
            LabelStatement<Label4>
            ExpressionStatement
                AssignmentExpression<n:int>
                    BinaryExpression<+>
                        VariableExpression<n:int>
                        VariableExpression<i:int>
            ExpressionStatement
                AssignmentExpression<i:int>
                    BinaryExpression<+>
                        VariableExpression<i:int>
                        LiteralExpression<1:int>
            LabelStatement<Label3>
            ConditionalGotoStatement<Label4:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<i:int>
                    VariableExpression<upperBound1:int>
            LabelStatement<break1>
            GotoStatement<Label2>
            LabelStatement<Label1>
            VariableDeclaration<i:int>
                LiteralExpression<100:int>
            ExpressionStatement
                AssignmentExpression<i:int>
                    LiteralExpression<100:int>
            VariableDeclaration<upperBound2:int>
                LiteralExpression<1000:int>
            GotoStatement<Label5>
            LabelStatement<Label6>
            ExpressionStatement
                AssignmentExpression<n:int>
                    BinaryExpression<+>
                        VariableExpression<n:int>
                        VariableExpression<i:int>
            ExpressionStatement
                AssignmentExpression<i:int>
                    BinaryExpression<+>
                        VariableExpression<i:int>
                        LiteralExpression<1:int>
            LabelStatement<Label5>
            ConditionalGotoStatement<Label6:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<i:int>
                    VariableExpression<upperBound2:int>
            LabelStatement<break2>
            LabelStatement<Label2>
            ReturnStatement
                VariableExpression<n:int>
`],
[`
func main() : int
{
    let n : int = 0;

    for let x in 1 to 100
        for let y in 100 to 1000
            n = n + x + y;    

    return n;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<0:int>
            VariableDeclaration<x:int>
                LiteralExpression<1:int>
            ExpressionStatement
                AssignmentExpression<x:int>
                    LiteralExpression<1:int>
            VariableDeclaration<upperBound1:int>
                LiteralExpression<100:int>
            GotoStatement<Label1>
            LabelStatement<Label2>
            VariableDeclaration<y:int>
                LiteralExpression<100:int>
            ExpressionStatement
                AssignmentExpression<y:int>
                    LiteralExpression<100:int>
            VariableDeclaration<upperBound2:int>
                LiteralExpression<1000:int>
            GotoStatement<Label3>
            LabelStatement<Label4>
            ExpressionStatement
                AssignmentExpression<n:int>
                    BinaryExpression<+>
                        BinaryExpression<+>
                            VariableExpression<n:int>
                            VariableExpression<x:int>
                        VariableExpression<y:int>
            ExpressionStatement
                AssignmentExpression<y:int>
                    BinaryExpression<+>
                        VariableExpression<y:int>
                        LiteralExpression<1:int>
            LabelStatement<Label3>
            ConditionalGotoStatement<Label4:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<y:int>
                    VariableExpression<upperBound2:int>
            LabelStatement<break2>
            ExpressionStatement
                AssignmentExpression<x:int>
                    BinaryExpression<+>
                        VariableExpression<x:int>
                        LiteralExpression<1:int>
            LabelStatement<Label1>
            ConditionalGotoStatement<Label2:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<x:int>
                    VariableExpression<upperBound1:int>
            LabelStatement<break1>
            ReturnStatement
                VariableExpression<n:int>
`],
[`
func main() : int
{
    let n : int = 0;

    for let x in 1 to 100
        if x < 50
            for let y in 100 to 1000
                if y > 50    
                    n = n + x + y;

    return n;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<0:int>
            VariableDeclaration<x:int>
                LiteralExpression<1:int>
            ExpressionStatement
                AssignmentExpression<x:int>
                    LiteralExpression<1:int>
            VariableDeclaration<upperBound1:int>
                LiteralExpression<100:int>
            GotoStatement<Label1>
            LabelStatement<Label2>
            ConditionalGotoStatement<Label3:JIT=false>
                BinaryExpression<<>
                    VariableExpression<x:int>
                    LiteralExpression<50:int>
            VariableDeclaration<y:int>
                LiteralExpression<100:int>
            ExpressionStatement
                AssignmentExpression<y:int>
                    LiteralExpression<100:int>
            VariableDeclaration<upperBound2:int>
                LiteralExpression<1000:int>
            GotoStatement<Label4>
            LabelStatement<Label5>
            ConditionalGotoStatement<Label6:JIT=false>
                BinaryExpression<>>
                    VariableExpression<y:int>
                    LiteralExpression<50:int>
            ExpressionStatement
                AssignmentExpression<n:int>
                    BinaryExpression<+>
                        BinaryExpression<+>
                            VariableExpression<n:int>
                            VariableExpression<x:int>
                        VariableExpression<y:int>
            LabelStatement<Label6>
            ExpressionStatement
                AssignmentExpression<y:int>
                    BinaryExpression<+>
                        VariableExpression<y:int>
                        LiteralExpression<1:int>
            LabelStatement<Label4>
            ConditionalGotoStatement<Label5:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<y:int>
                    VariableExpression<upperBound2:int>
            LabelStatement<break2>
            LabelStatement<Label3>
            ExpressionStatement
                AssignmentExpression<x:int>
                    BinaryExpression<+>
                        VariableExpression<x:int>
                        LiteralExpression<1:int>
            LabelStatement<Label1>
            ConditionalGotoStatement<Label2:JIT=true>
                BinaryExpression<<=>
                    VariableExpression<x:int>
                    VariableExpression<upperBound1:int>
            LabelStatement<break1>
            ReturnStatement
                VariableExpression<n:int>
`],
[`
func main() : int
{
    let n : int = 0;

    while n < 100
    {
        n = n + 1;
    }

    return n;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<n:int>
                LiteralExpression<0:int>
            GotoStatement<continue1>
            LabelStatement<Label1>
            ExpressionStatement
                AssignmentExpression<n:int>
                    BinaryExpression<+>
                        VariableExpression<n:int>
                        LiteralExpression<1:int>
            LabelStatement<continue1>
            ConditionalGotoStatement<Label1:JIT=true>
                BinaryExpression<<>
                    VariableExpression<n:int>
                    LiteralExpression<100:int>
            LabelStatement<break1>
            ReturnStatement
                VariableExpression<n:int>
`]
    ].forEach((item) => {
        it(`should lower bound trees ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as string;
            testBoundTreeStructure(text, expected);
        });
    });
    
});