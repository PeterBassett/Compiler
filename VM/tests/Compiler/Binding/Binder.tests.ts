import Parser from "../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import { DiagnosticType } from "../../../Language/Compiler/Diagnostics/Diagnostics";
import { BoundGlobalScope, BoundNodeKind } from "../../../Language/Compiler/Binding/BoundNode";
import Binder from "../../../Language/Compiler/Binding/Binder";
import BoundTreeStructureVisitor from "../BoundTreeStructureVisitor";

describe("A Binder object", () => {

    function bind(text : string) : BoundGlobalScope
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let BoundGlobalScope = parser.parse();
        let binder = new Binder();
        let boundTree = binder.Bind(BoundGlobalScope);

        return boundTree;
    }

    function testBoundTreeStructure(text : string, structure : string) : void
    {
        let scope : BoundGlobalScope = bind(text);

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
            if(aLines[i] != bLines[i])
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
            IfStatement
                Condition
                    BinaryExpression<==>
                        LiteralExpression<1:int>
                        LiteralExpression<2:int>
                TrueBranch
                    BlockStatement
                        ReturnStatement
                            LiteralExpression<1:int>
                FalseBranch
                    BlockStatement
                        ReturnStatement
                            LiteralExpression<2:int>
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
                
[`func add(a:int, b:int):int => a + b;`, 
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
            IfStatement
                Condition
                    BinaryExpression<||>
                        BinaryExpression<==>
                            VariableExpression<n:int>
                            LiteralExpression<0:int>
                        BinaryExpression<==>
                            VariableExpression<n:int>
                            LiteralExpression<1:int>
                TrueBranch
                    BlockStatement
                        ReturnStatement
                            VariableExpression<n:int>
                FalseBranch
                    BlockStatement
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
` ],
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
            ForStatement
                LiteralExpression<1:int>
                LiteralExpression<100:int>
                ExpressionStatement
                    AssignmentExpression<n:int>
                        BinaryExpression<+>
                            VariableExpression<n:int>
                            VariableExpression<i:int>
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
            WhileStatement
                BinaryExpression<<>
                    VariableExpression<n:int>
                    LiteralExpression<100:int>
                BlockStatement
                    ExpressionStatement
                        AssignmentExpression<n:int>
                            BinaryExpression<+>
                                VariableExpression<n:int>
                                LiteralExpression<1:int>
            ReturnStatement
                VariableExpression<n:int>
`],
[`func add(a:int, b:int):int => a + b;
func main() : int
{
    return add(1, 2);
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
                    LiteralExpression<1:int>
                    LiteralExpression<2:int>
` ],
[`func main() : float {
    return 5.0 / float(2);
}`,
`BoundGlobalScope
    FunctionDefinition<main:float>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                BinaryExpression</>
                    LiteralExpression<5:float>
                    ConversionExpression<float>
                        LiteralExpression<2:int>
`],
[`func main() : int {
    return int(5.5);
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                ConversionExpression<int>
                    LiteralExpression<5.5:float>
`],
[`func main() : string {
    return string(3.14159);
}`,
`BoundGlobalScope
    FunctionDefinition<main:string>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                ConversionExpression<string>
                    LiteralExpression<3.14159:float>
`],
[`func main() : string {
    return string(true);
}`,
`BoundGlobalScope
    FunctionDefinition<main:string>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                ConversionExpression<string>
                    LiteralExpression<true:bool>
`],
[`func main() : string {
    return string(1==2);
}`,
`BoundGlobalScope
    FunctionDefinition<main:string>
        ParameterDeclarationList
        BlockStatement
            ReturnStatement
                ConversionExpression<string>
                    BinaryExpression<==>
                        LiteralExpression<1:int>
                        LiteralExpression<2:int>
`],
[`
struct root 
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

    l3.d2.c2.b2.a1 = l2.c2.b2.a1;

    return l3.d2.c2.b2.a1;
}`, ``
]
/*,[`
class test
{
    func print():int
    {
        return 1;
    }
}

func main() : int
{
    let a : test;
    a.print();
    return 0;
}
`, 
`BoundGlobalScope
    ClassDeclarationStatement<test>
        FunctionDefinition<print:int>
            ParameterDeclarationList
            BlockStatement
                ReturnStatement
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<a:int>
            ExpressionStatement
                CallExpression
                    GetExpression
                        VariableExpression<a>
`]*/
    ].forEach((item) => {
        it(`should bind source ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as string;
            testBoundTreeStructure(text, expected);
        });
    });
[
    [`func add(a:int, b:int):int => a + b;
func main() : int
{
    return add(1, 2);
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
                    LiteralExpression<1:int>
                    LiteralExpression<2:int>
` ]
].forEach((item) => {
    it(`should bind call to lambda with two parameters ` + item[0], () => {  
        let text = item[0] as string;
        let expected = item[1] as string;
        testBoundTreeStructure(text, expected);
    });
});

    it("bind a the main function", () => {
        let actual = bind(
        `func main() : int
        {
            return 1;
        }`);
        
        expect(actual.functions.length).toEqual(1);
        expect(actual.functions[0].kind).toEqual(BoundNodeKind.FunctionDefinition);
        expect(actual.functions[0].identifier).toEqual("main");        
    });

    it("binds many top level functions", () => {

        let actual = bind(
        `func main() : int
        {
            return 1;
        }

        func a() : int
        {
            return 1;
        }

        func b() : int
        {
            return 1;
        }
        `);
        
        expect(actual.functions.length).toEqual(3);
        expect(actual.functions[0].kind).toEqual(BoundNodeKind.FunctionDefinition);
        expect(actual.functions[0].identifier).toEqual("main");
        expect(actual.functions[1].kind).toEqual(BoundNodeKind.FunctionDefinition);
        expect(actual.functions[1].identifier).toEqual("a");
        expect(actual.functions[2].kind).toEqual(BoundNodeKind.FunctionDefinition);
        expect(actual.functions[2].identifier).toEqual("b");
    });

    it("binds an if statement", () => {

        let actual = bind(
        `func main() : int
        {
            if 1==2
                return 1;
            else
                return 2;
        }
        `);
        
        expect(actual.functions.length).toEqual(1);
        expect(actual.functions[0].kind).toEqual(BoundNodeKind.FunctionDefinition);        
        expect(actual.functions[0].blockBody.statements[0].kind).toEqual(BoundNodeKind.IfStatement);                
    });
    
    function testGeneratedDiagnostics(text : string, expected : DiagnosticType[]) : void
    {
        let boundTree = bind(text);

        expect(boundTree.success).toEqual(false);
        expect(boundTree.diagnostics.length).toEqual(expected.length);

        for(let i = 0; i < boundTree.diagnostics.length; i++)
        {
            expect(DiagnosticType[boundTree.diagnostics.get(i).type]).toEqual(DiagnosticType[expected[i]], text);    
        }
    }
    
[
[`func main() :int 
{
    return "string";
}`, [DiagnosticType.CannotConvertType]],
[`func main() : int 
{
    return 1 + true;
}`, [DiagnosticType.UndefinedBinaryOperator]],
[`func main() : int 
{
    let a : int;
    let a : int;
    return 1;
}`, [DiagnosticType.VariableAlreadyDeclaredInScope]],
    ].forEach((item) => {
        it(`should record specific error types for ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as DiagnosticType[];
            testGeneratedDiagnostics(text, expected);
        });
    });
});