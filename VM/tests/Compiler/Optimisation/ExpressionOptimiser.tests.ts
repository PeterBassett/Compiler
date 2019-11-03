import Parser from "../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import { DiagnosticType } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import { BoundGlobalScope, BoundNodeKind } from "../../../Language/Compiler/Binding/BoundNode";
import Binder from "../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../Language/Compiler/lowering/Lowerer";
import ExpressionOptimiser from "../../../Language/Compiler/Optimisation/ExpressionOptimiser";
import BoundTreeStructureVisitor from "../BoundTreeStructureVisitor";

describe("A ExpressionOptimiser object", () => {

    function optimise(text : string) : BoundGlobalScope
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        let binder = new Binder();
        let boundTree = binder.Bind(compilationUnit);
        let lowerer = new Lowerer();
        let newBoundTree = lowerer.lower(boundTree);
        let expressionOptimiser = new ExpressionOptimiser();
        let optimisedTree = expressionOptimiser.optimise(newBoundTree);

        return optimisedTree;
    }

    function testBoundTreeStructure(text : string, structure : string) : void
    {
        let scope :BoundGlobalScope;
        
        try{
            scope = optimise(text);
        }
        catch(ex)
        {
            scope = optimise(text);
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
[`func main() : string
{
    return "Hello " + "World";
}`, 
`BoundGlobalScope
    FunctionDefinition<main:string>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<Hello World:string>
` ],

[`func main() : int
{
    return 1+2;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<3:int>
` ],

[`func main() : int
{
    return 2*6;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<12:int>
` ],
[`func main() : int
{
    return 10/2;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<5:int>
` ],

[`func main() : bool
{
    return 1 == 2;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:bool>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<false:bool>
` ],


[`func main() : bool
{
    return 1 != 2;
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
    return 1+2*3-6/4==6/8*4-1+8;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:bool>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<false:bool>
`],

[`func main() : int
{
    return 11/2;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<5:int>
`],

[`func main() : float
{
    return 11.0/2.0;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:float>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<5.5:float>
`],

[`
func add(a:int, b:int):int
{
    return a + b;
}

func main() : int
{
    return add(1+2, 3+4);
}`, 
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
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                CallExpression<add>
                    LiteralExpression<3:int>
                    LiteralExpression<7:int>
`],

[`func main() : bool
{
    return true==false;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:bool>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<false:bool>
` ],

[`func main() : bool
{
    return !true;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:bool>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<false:bool>
` ],

[`func main() : int
{
    return -(-5);
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                LiteralExpression<5:int>
` ]
    ].forEach((item) => {
        it(`should optimise computable binary expressions ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as string;
            testBoundTreeStructure(text, expected);
        });
    });
});