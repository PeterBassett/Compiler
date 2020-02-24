import Parser from "../../Language/Compiler/Syntax/Parser";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import SyntaxTreeVisitor from "./SyntaxTreeStructureVisitor";
import CompilationUnit from "../../Language/Compiler/Syntax/CompilationUnit";
import StringDiagnosticsPrinter from "../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";
import { DiagnosticType } from "../../Language/Compiler/Diagnostics/Diagnostics";
import SyntaxTreeStructureVisitor from "./SyntaxTreeStructureVisitor";
import SyntaxTreeNodeTextSpanVisitor from "./SyntaxTreeNodeTextSpanVisitor";

describe("A Parser object", () => {

    function parse(text : string) : CompilationUnit
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();
        return compilationUnit;
    }

    function testParsedAstStructure(text : string, structure : string) : void
    {
        let compilationUnit = parse(text);

        expect(compilationUnit.success).toEqual(true);
        expect(compilationUnit.diagnostics).toBeTruthy();
        expect(compilationUnit.diagnostics.length).toEqual(0);

        if(compilationUnit.success)
        {
            let visitor = new SyntaxTreeStructureVisitor();
            
            visitor.Visit(compilationUnit.compilationUnit);
            
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

    function testParsedAstNodeTextSpans(text : string, structure : string) : void
    {
        let compilationUnit = parse(text);

        expect(compilationUnit.success).toEqual(true);
        expect(compilationUnit.diagnostics).toBeTruthy();
        expect(compilationUnit.diagnostics.length).toEqual(0);

        if(compilationUnit.success)
        {
            let visitor = new SyntaxTreeNodeTextSpanVisitor();
            
            visitor.Visit(compilationUnit.compilationUnit);

            expect(visitor.structure).toEqual(structure);
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
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
` ],

[`func main() : int
{
    return 1;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
` ],

[`func main() : float
{
    return 3.14;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<float>
        BlockStatementSyntax
            ReturnStatementSyntax
                FloatLiteralExpressionSyntax<3.14>
` ],

[`func main() : string
{
    return "TEST";
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<string>
        BlockStatementSyntax
            ReturnStatementSyntax
                StringLiteralExpressionSyntax<TEST>
` ],

[`func main( a:int, b:float, c:string) : int
    {
        return 1;
    }`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
            ParameterDeclarationSyntax<a:int>
                TypeNameSyntax<int>
            ParameterDeclarationSyntax<b:float>
                TypeNameSyntax<float>
            ParameterDeclarationSyntax<c:string>
                TypeNameSyntax<string>
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
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
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            IfStatementSyntax
                BinaryExpressionSyntax<==>
                    IntegerLiteralExpressionSyntax<1>
                    IntegerLiteralExpressionSyntax<2>
                BlockStatementSyntax
                    ReturnStatementSyntax
                        IntegerLiteralExpressionSyntax<1>
                ElseStatementSyntax
                    BlockStatementSyntax
                        ReturnStatementSyntax
                            IntegerLiteralExpressionSyntax<2>
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
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
    FunctionDeclarationStatementSyntax<a>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<2>
    FunctionDeclarationStatementSyntax<b>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<3>
`],
                
[`func add(a:int, b:int) : int => a + b;`, 
`CompilationUnitSyntax
    LambdaDeclarationStatementSyntax<add>
        ParameterDeclarationListSyntax
            ParameterDeclarationSyntax<a:int>
                TypeNameSyntax<int>
            ParameterDeclarationSyntax<b:int>
                TypeNameSyntax<int>
        TypeNameSyntax<int>
        BinaryExpressionSyntax<+>
            NameExpressionSyntax<a>
            NameExpressionSyntax<b>
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
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<fib>
        ParameterDeclarationListSyntax
            ParameterDeclarationSyntax<n:int>
                TypeNameSyntax<int>
        TypeNameSyntax<int>
        BlockStatementSyntax
            IfStatementSyntax
                ParenthesizedExpressionSyntax
                    BinaryExpressionSyntax<||>
                        BinaryExpressionSyntax<==>
                            NameExpressionSyntax<n>
                            IntegerLiteralExpressionSyntax<0>
                        BinaryExpressionSyntax<==>
                            NameExpressionSyntax<n>
                            IntegerLiteralExpressionSyntax<1>
                BlockStatementSyntax
                    ReturnStatementSyntax
                        NameExpressionSyntax<n>
                ElseStatementSyntax
                    BlockStatementSyntax
                        ReturnStatementSyntax
                            BinaryExpressionSyntax<+>
                                CallExpressionSyntax
                                    NameExpressionSyntax<fib>
                                    BinaryExpressionSyntax<->
                                        NameExpressionSyntax<n>
                                        IntegerLiteralExpressionSyntax<1>
                                CallExpressionSyntax
                                    NameExpressionSyntax<fib>
                                    BinaryExpressionSyntax<->
                                        NameExpressionSyntax<n>
                                        IntegerLiteralExpressionSyntax<2>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                TypeNameSyntax<int>
                IntegerLiteralExpressionSyntax<5>
            ReturnStatementSyntax
                CallExpressionSyntax
                    NameExpressionSyntax<fib>
                    NameExpressionSyntax<n>
`
],
[`func main() : boolean
{
    return true;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<boolean>
        BlockStatementSyntax
            ReturnStatementSyntax
                BooleanLiteralExpressionSyntax<true>
` ],
[`func main() : boolean
{
    return false;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<boolean>
        BlockStatementSyntax
            ReturnStatementSyntax
                BooleanLiteralExpressionSyntax<false>
` ],
[`
let global : int = 5;
func main() : int
{
    return global;
}`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<global>
        TypeNameSyntax<int>
        IntegerLiteralExpressionSyntax<5>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                NameExpressionSyntax<global>
` ],
[`
var global : int = 5;
func main() : int
{
    return global;
}`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<global>
        TypeNameSyntax<int>
        IntegerLiteralExpressionSyntax<5>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                NameExpressionSyntax<global>
` ],
[`
func main() : int
{
    var n : int = 0;
    n = 5;
    return n;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                TypeNameSyntax<int>
                IntegerLiteralExpressionSyntax<0>
            AssignmentStatementSyntax
                NameExpressionSyntax<n>
                IntegerLiteralExpressionSyntax<5>
            ReturnStatementSyntax
                NameExpressionSyntax<n>
` ],
[`
func main() : int
{
    let n : int = 0;

    for let i in 1 to 100
        n = n + i;

    return n;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                TypeNameSyntax<int>
                IntegerLiteralExpressionSyntax<0>
            ForStatementSyntax
                IntegerLiteralExpressionSyntax<1>
                IntegerLiteralExpressionSyntax<100>
                AssignmentStatementSyntax
                    NameExpressionSyntax<n>
                    BinaryExpressionSyntax<+>
                        NameExpressionSyntax<n>
                        NameExpressionSyntax<i>
            ReturnStatementSyntax
                NameExpressionSyntax<n>
`],
[`
class test
{
}`, 
`CompilationUnitSyntax
    ClassDeclarationStatementSyntax<test>
`],
[`
class test
{
    func print():void
    {
        return;
    }
}`, 
`CompilationUnitSyntax
    ClassDeclarationStatementSyntax<test>
        FunctionDeclarationStatementSyntax<print>
            ParameterDeclarationListSyntax
            TypeNameSyntax<void>
            BlockStatementSyntax
                ReturnStatementSyntax
`],
[`
class test
{
    let h:int;
    let i:int;

    func print():void
    {
        return;
    }

    let j : string;

    func a():float
    {
        return 3.14;
    }
    
    var k:float;
    
    func b():string
    {
        return "string value";
    }
}`, 
`CompilationUnitSyntax
    ClassDeclarationStatementSyntax<test>
        VariableDeclarationSyntax<h>
            TypeNameSyntax<int>
        VariableDeclarationSyntax<i>
            TypeNameSyntax<int>
        FunctionDeclarationStatementSyntax<print>
            ParameterDeclarationListSyntax
            TypeNameSyntax<void>
            BlockStatementSyntax
                ReturnStatementSyntax
        VariableDeclarationSyntax<j>
            TypeNameSyntax<string>
        FunctionDeclarationStatementSyntax<a>
            ParameterDeclarationListSyntax
            TypeNameSyntax<float>
            BlockStatementSyntax
                ReturnStatementSyntax
                    FloatLiteralExpressionSyntax<3.14>
        VariableDeclarationSyntax<k>
            TypeNameSyntax<float>
        FunctionDeclarationStatementSyntax<b>
            ParameterDeclarationListSyntax
            TypeNameSyntax<string>
            BlockStatementSyntax
                ReturnStatementSyntax
                    StringLiteralExpressionSyntax<string value>
`],
[`
class test
{
    func print():void
    {
        return;
    }
}

func main() : void
{
    let a : test;
    a.print();
}
`, 
`CompilationUnitSyntax
    ClassDeclarationStatementSyntax<test>
        FunctionDeclarationStatementSyntax<print>
            ParameterDeclarationListSyntax
            TypeNameSyntax<void>
            BlockStatementSyntax
                ReturnStatementSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<void>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                TypeNameSyntax<test>
            ExpressionStatementSyntax
                CallExpressionSyntax
                    GetExpressionSyntax<print>
                        NameExpressionSyntax<a>
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
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                TypeNameSyntax<int>
                IntegerLiteralExpressionSyntax<0>
            WhileStatementSyntax
                BinaryExpressionSyntax<<>
                    NameExpressionSyntax<n>
                    IntegerLiteralExpressionSyntax<100>
                BlockStatementSyntax
                    AssignmentStatementSyntax
                        NameExpressionSyntax<n>
                        BinaryExpressionSyntax<+>
                            NameExpressionSyntax<n>
                            IntegerLiteralExpressionSyntax<1>
            ReturnStatementSyntax
                NameExpressionSyntax<n>
`],
[`func main() : string {
    return string(3.14159);
}`,
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<string>
        BlockStatementSyntax
            ReturnStatementSyntax
                CallExpressionSyntax
                    NameExpressionSyntax<string>
                    FloatLiteralExpressionSyntax<3.14159>
`],
[`
struct pair 
{
    first : int;
    second : bool;
    third : int;
}

func main() : int
{
    let a : pair;
    return 1;
}`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<pair>
        StructMemberDeclarationStatementSyntax<first:int>
            TypeNameSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            TypeNameSyntax<bool>
        StructMemberDeclarationStatementSyntax<third:int>
            TypeNameSyntax<int>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                TypeNameSyntax<pair>
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
`],
[`
struct pair 
{
    first : int;
    second : bool;
    third : int;
}

func main() : int
{
    let a : pair;

    a.first = 1;
    a.second = 2;

    return a.first + a.second;
}`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<pair>
        StructMemberDeclarationStatementSyntax<first:int>
            TypeNameSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            TypeNameSyntax<bool>
        StructMemberDeclarationStatementSyntax<third:int>
            TypeNameSyntax<int>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                TypeNameSyntax<pair>
            AssignmentStatementSyntax
                GetExpressionSyntax<first>
                    NameExpressionSyntax<a>
                IntegerLiteralExpressionSyntax<1>
            AssignmentStatementSyntax
                GetExpressionSyntax<second>
                    NameExpressionSyntax<a>
                IntegerLiteralExpressionSyntax<2>
            ReturnStatementSyntax
                BinaryExpressionSyntax<+>
                    GetExpressionSyntax<first>
                        NameExpressionSyntax<a>
                    GetExpressionSyntax<second>
                        NameExpressionSyntax<a>
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
    let d1 : leaf3;
    let b1 : leaf2;

    d1.d2.c2.b2.a1 = b1.b2.a1;

    return d1.d2.c2.b2.a1;
}`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<root>
        StructMemberDeclarationStatementSyntax<a1:int>
            TypeNameSyntax<int>
    StructDeclarationStatementSyntax<leaf1>
        StructMemberDeclarationStatementSyntax<b1:int>
            TypeNameSyntax<int>
        StructMemberDeclarationStatementSyntax<b2:root>
            TypeNameSyntax<root>
    StructDeclarationStatementSyntax<leaf2>
        StructMemberDeclarationStatementSyntax<c1:int>
            TypeNameSyntax<int>
        StructMemberDeclarationStatementSyntax<c2:leaf1>
            TypeNameSyntax<leaf1>
    StructDeclarationStatementSyntax<leaf3>
        StructMemberDeclarationStatementSyntax<d1:int>
            TypeNameSyntax<int>
        StructMemberDeclarationStatementSyntax<d2:leaf2>
            TypeNameSyntax<leaf2>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<d1>
                TypeNameSyntax<leaf3>
            VariableDeclarationSyntax<b1>
                TypeNameSyntax<leaf2>
            AssignmentStatementSyntax
                GetExpressionSyntax<a1>
                    GetExpressionSyntax<b2>
                        GetExpressionSyntax<c2>
                            GetExpressionSyntax<d2>
                                NameExpressionSyntax<d1>
                GetExpressionSyntax<a1>
                    GetExpressionSyntax<b2>
                        NameExpressionSyntax<b1>
            ReturnStatementSyntax
                GetExpressionSyntax<a1>
                    GetExpressionSyntax<b2>
                        GetExpressionSyntax<c2>
                            GetExpressionSyntax<d2>
                                NameExpressionSyntax<d1>
`],
[`func main() : int
{
    let ap : *int = null;
    return 1;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                TypeNameSyntax<*int>
                    TypeNameSyntax<int>
                NullLiteralExpressionSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
`],
[`func main() : int
{
    let ap : **int = null;
    return 1;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                TypeNameSyntax<**int>
                    TypeNameSyntax<*int>
                        TypeNameSyntax<int>
                NullLiteralExpressionSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
`],
[`func main() : int
{
    let ap : *int;
    *ap = 6; // test parsing of a dereference assignment
    return a;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                TypeNameSyntax<*int>
                    TypeNameSyntax<int>
            DereferenceAssignmentStatementSyntax
                UnaryExpressionSyntax<*>
                    NameExpressionSyntax<ap>
                IntegerLiteralExpressionSyntax<6>
            ReturnStatementSyntax
                NameExpressionSyntax<a>
`],
[`func main() : int
{
    let a : int = 5;
    let ap : *int;
    
    ap = &a; // test parsing of taking the address of a variable
    *ap = 6;

    return a;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        TypeNameSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                TypeNameSyntax<int>
                IntegerLiteralExpressionSyntax<5>
            VariableDeclarationSyntax<ap>
                TypeNameSyntax<*int>
                    TypeNameSyntax<int>
            AssignmentStatementSyntax
                NameExpressionSyntax<ap>
                UnaryExpressionSyntax<&>
                    NameExpressionSyntax<a>
            DereferenceAssignmentStatementSyntax
                UnaryExpressionSyntax<*>
                    NameExpressionSyntax<ap>
                IntegerLiteralExpressionSyntax<6>
            ReturnStatementSyntax
                NameExpressionSyntax<a>
`]
    ].forEach((item) => {
        it(`should parse source : ` + item[0], () => {
            let text = item[0] as string;
            let expected = item[1] as string;
            testParsedAstStructure(text, expected);
        });
    });

    it("parses a top level function", () => {
        let actual = parse(
        `func main() : int
        {
            return 1;
        }`);
        
        expect(actual.compilationUnit.declarations.length).toEqual(1);
        expect(actual.compilationUnit.declarations[0].kind).toEqual("FunctionDeclarationStatementSyntax");        
    });

    it("parses a top level function", () => {

        let actual = parse(
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
        
        expect(actual.compilationUnit.declarations.length).toEqual(3);
        expect(actual.compilationUnit.declarations[0].kind).toEqual("FunctionDeclarationStatementSyntax");
        expect(actual.compilationUnit.declarations[1].kind).toEqual("FunctionDeclarationStatementSyntax");
        expect(actual.compilationUnit.declarations[2].kind).toEqual("FunctionDeclarationStatementSyntax");
    });

    it("parses an if statement", () => {

        let actual = parse(
        `func main() : int
        {
            if 1==2
                return 1;
            else
                return 2;
        }
        `);
        
        expect(actual.compilationUnit.declarations.length).toEqual(1);
        expect(actual.compilationUnit.declarations[0].kind).toEqual("FunctionDeclarationStatementSyntax");        
    });

    
[
[`func main() : float
{
    return 3.14;
}`, 
`CompilationUnitSyntax(0,40)
    FunctionDeclarationStatementSyntax(0,40)
        ParameterDeclarationListSyntax(9,2)
        TypeNameSyntax(14,5)
        BlockStatementSyntax(20,20)
            ReturnStatementSyntax(26,12)
                FloatLiteralExpressionSyntax(33,4)
`]
    ].forEach((item) => {
            it(`should build correct spans for parsed nodes`, () => {  
                let text = item[0] as string;
                let expected = item[1] as string;
                testParsedAstNodeTextSpans(text, expected);
            });
        });
        
    function testGeneratedDiagnostics(text : string, expected : DiagnosticType[]) : void
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();

        expect(compilationUnit.success).toEqual(false);
        expect(() => compilationUnit.compilationUnit).not.toThrow();
        
        expect(compilationUnit.diagnostics.length).toEqual(expected.length);

        for(let i = 0; i < compilationUnit.diagnostics.length; i++)
        {
            expect(DiagnosticType[compilationUnit.diagnostics.get(i).type]).toEqual(DiagnosticType[expected[i]], text);    
        }
    }
    
[
[`func main() :int 
{
    /%*$ 324 fd garbage;
}`, [
        DiagnosticType.UnexpectedCharacter, 
        DiagnosticType.UnexpectedCharacter, 
        DiagnosticType.UnexpectedToken, 
        DiagnosticType.InvalidStatementExpressionType, 
        DiagnosticType.UnexpectedToken, 
        DiagnosticType.InvalidStatementExpressionType, 
        DiagnosticType.UnexpectedToken, 
        DiagnosticType.InvalidStatementExpressionType]],
[`func main() :int 
{
    garbage;
}`, [DiagnosticType.InvalidStatementExpressionType]],
[`func main() : int { £ return a; }`, [DiagnosticType.UnexpectedCharacter]],
    ].forEach((item) => {
        it(`should record specific error types for ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1] as DiagnosticType[];
            testGeneratedDiagnostics(text, expected);
        });
    });
});