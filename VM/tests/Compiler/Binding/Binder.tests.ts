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
            AssignmentStatement
                VariableExpression<n:int>
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
                AssignmentStatement
                    VariableExpression<n:int>
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
                    AssignmentStatement
                        VariableExpression<n:int>
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
}`, 
`BoundGlobalScope
    StructDeclaration<root>
        StructMemberDeclaration<a1:int>
    StructDeclaration<leaf1>
        StructMemberDeclaration<b1:int>
        StructMemberDeclaration<b2:root>
    StructDeclaration<leaf2>
        StructMemberDeclaration<c1:int>
        StructMemberDeclaration<c2:leaf1>
    StructDeclaration<leaf3>
        StructMemberDeclaration<d1:int>
        StructMemberDeclaration<d2:leaf2>
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<l3:leaf3>
                LiteralExpression<null:leaf3>
            VariableDeclaration<l2:leaf2>
                LiteralExpression<null:leaf2>
            AssignmentStatement
                GetExpression<a1:int>
                    GetExpression<b2:root>
                        GetExpression<c2:leaf1>
                            GetExpression<d2:leaf2>
                                VariableExpression<l3:leaf3>
                GetExpression<a1:int>
                    GetExpression<b2:root>
                        GetExpression<c2:leaf1>
                            VariableExpression<l2:leaf2>
            ReturnStatement
                GetExpression<a1:int>
                    GetExpression<b2:root>
                        GetExpression<c2:leaf1>
                            GetExpression<d2:leaf2>
                                VariableExpression<l3:leaf3>
`
],
[`func main() : int
{
    let ap : *int = null;
    return 1;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*int>
                LiteralExpression<0:*int>
            ReturnStatement
                LiteralExpression<1:int>
`],
[`func main() : int
{
    let ap : **int = null;
    return 1;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:**int>
                LiteralExpression<0:**int>
            ReturnStatement
                LiteralExpression<1:int>
`],
[`func main() : int
{
    let ap : *int;
    *ap = 6; // test binding of a dereference assignment. doesnt matter that the pointer is currently null
    return 1;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*int>
                LiteralExpression<0:*int>
            AssignmentStatement
                DereferenceExpression
                    VariableExpression<ap:*int>
                LiteralExpression<6:int>
            ReturnStatement
                LiteralExpression<1:int>
`],
[`func main() : int
{
    let ap : *int;
    *ap = 6; // test binding of a dereference assignment. doesnt matter that the pointer is currently null
    return *ap;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*int>
                LiteralExpression<0:*int>
            AssignmentStatement
                DereferenceExpression
                    VariableExpression<ap:*int>
                LiteralExpression<6:int>
            ReturnStatement
                DereferenceExpression
                    VariableExpression<ap:*int>
`],
[`func main() : int
{
    let a : int = 5;
    let ap : *int;
    
    ap = &a; // test parsing of taking the address of a variable
    *ap = 6;

    return a;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<a:int>
                LiteralExpression<5:int>
            VariableDeclaration<ap:*int>
                LiteralExpression<0:*int>
            AssignmentStatement
                VariableExpression<ap:*int>
                UnaryExpression<&>
                    VariableExpression<a:int>
            AssignmentStatement
                DereferenceExpression
                    VariableExpression<ap:*int>
                LiteralExpression<6:int>
            ReturnStatement
                VariableExpression<a:int>
`],
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap != null)
        return 1;
    else
        return 0;
}`, 
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*int>
                LiteralExpression<0:*int>
            IfStatement
                Condition
                    BinaryExpression<!=>
                        VariableExpression<ap:*int>
                        LiteralExpression<0:null>
                TrueBranch
                    ReturnStatement
                        LiteralExpression<1:int>
                FalseBranch
                    ReturnStatement
                        LiteralExpression<0:int>
`],
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap == null)
        return 1;
    else
        return 0;
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*int>
                LiteralExpression<0:*int>
            IfStatement
                Condition
                    BinaryExpression<==>
                        VariableExpression<ap:*int>
                        LiteralExpression<0:null>
                TrueBranch
                    ReturnStatement
                        LiteralExpression<1:int>
                FalseBranch
                    ReturnStatement
                        LiteralExpression<0:int>
`],
[
`func main() : int
{
    let ap : [3]int;
    return 0;
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:[3]int>
                LiteralExpression<null:[3]int>
            ReturnStatement
                LiteralExpression<0:int>
`],
[
`func main() : int
{
    let ap : *[3]int = null;
    return 0;
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*[3]int>
                LiteralExpression<0:*[3]int>
            ReturnStatement
                LiteralExpression<0:int>
`],
[
`func main() : int
{
    let ap : [3][2]int;
    return 0;
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:[3][2]int>
                LiteralExpression<null:[3][2]int>
            ReturnStatement
                LiteralExpression<0:int>
`],
[
`func main() : int
{
    let ap : *[3]*[2]*int;
    return 0;
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:*[3]*[2]*int>
                LiteralExpression<0:*[3]*[2]*int>
            ReturnStatement
                LiteralExpression<0:int>
`],
[
`func main() : int
{
    let ap : [3*2+1]int;
    return 0;
}`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<ap:[7]int>
                LiteralExpression<null:[7]int>
            ReturnStatement
                LiteralExpression<0:int>
`],
[
`
func main() : int
{
    let root : [3]int;
    root[1] = 123;
    return root[1];
}
`,
`BoundGlobalScope
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<root:[3]int>
                LiteralExpression<null:[3]int>
            AssignmentStatement
                ArrayIndex
                    VariableExpression<root:[3]int>
                    LiteralExpression<1:int>
                LiteralExpression<123:int>
            ReturnStatement
                ArrayIndex
                    VariableExpression<root:[3]int>
                    LiteralExpression<1:int>
`
],
[
`func updatearray(a : *[2]int) : int
{   
    // updating the array value at specified index 
    (*a)[1] = 750;

    // HACK : Need to make void functions work
    return 1;
} 
  
func main() : int { 
  
    // Taking an pointer to an array 
    let arr : [2]int;
    arr[0] = 78;
    arr[1] = 89;

    updatearray(&arr);
  
    return arr[1];
}`,
`BoundGlobalScope
    FunctionDefinition<updatearray:int>
        ParameterDeclarationList
            ParameterDeclaration<a:*[2]int>
        BlockStatement
            AssignmentStatement
                ArrayIndex
                    DereferenceExpression
                        VariableExpression<a:*[2]int>
                    LiteralExpression<1:int>
                LiteralExpression<750:int>
            ReturnStatement
                LiteralExpression<1:int>
    FunctionDefinition<main:int>
        ParameterDeclarationList
        BlockStatement
            VariableDeclaration<arr:[2]int>
                LiteralExpression<null:[2]int>
            AssignmentStatement
                ArrayIndex
                    VariableExpression<arr:[2]int>
                    LiteralExpression<0:int>
                LiteralExpression<78:int>
            AssignmentStatement
                ArrayIndex
                    VariableExpression<arr:[2]int>
                    LiteralExpression<1:int>
                LiteralExpression<89:int>
            ExpressionStatement
                CallExpression<updatearray>
                    UnaryExpression<&>
                        VariableExpression<arr:[2]int>
            ReturnStatement
                ArrayIndex
                    VariableExpression<arr:[2]int>
                    LiteralExpression<1:int>
`
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