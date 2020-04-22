import Parser from "../../Language/Compiler/Syntax/Parser";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import SyntaxTreeVisitor from "./SyntaxTreeStructureVisitor";
import CompilationUnit from "../../Language/Compiler/Syntax/CompilationUnit";
import StringDiagnosticsPrinter from "../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";
import { DiagnosticType, Diagnostics } from "../../Language/Compiler/Diagnostics/Diagnostics";
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

        assertNoDiagnositcs("Parser", compilationUnit.diagnostics);
        
        if(compilationUnit.success)
        {
            let visitor = new SyntaxTreeStructureVisitor();
            
            visitor.Visit(compilationUnit.compilationUnit);
            
            //if(visitor.structure != structure)
             //   printDiff(visitor.structure, structure);

            expect(visitor.structure).toEqual(structure);
        }
    }

    function assertNoDiagnositcs(source : string, diagnostics : Diagnostics) : void
    {
        if(diagnostics.length > 0)
        {
            const printer = new StringDiagnosticsPrinter();
            expect(diagnostics.length).toEqual(0);

            diagnostics.map( (d, i) => {
                const output = printer.printDiagnostic(diagnostics, d);
                fail(`${source} : ${output}`);
                return "";
            });
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
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<float>
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
        NamedTypeSyntax<string>
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
                NamedTypeSyntax<int>
            ParameterDeclarationSyntax<b:float>
                NamedTypeSyntax<float>
            ParameterDeclarationSyntax<c:string>
                NamedTypeSyntax<string>
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
    FunctionDeclarationStatementSyntax<a>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<2>
    FunctionDeclarationStatementSyntax<b>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<3>
`],
[`func main() : int
{
    return 1;
}

func function_with_underscores_in_its_name() : int
{
    return 2;
}
`,
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
    FunctionDeclarationStatementSyntax<function_with_underscores_in_its_name>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<2>
`],                
[`func add(a:int, b:int) : int => a + b;`, 
`CompilationUnitSyntax
    LambdaDeclarationStatementSyntax<add>
        ParameterDeclarationListSyntax
            ParameterDeclarationSyntax<a:int>
                NamedTypeSyntax<int>
            ParameterDeclarationSyntax<b:int>
                NamedTypeSyntax<int>
        NamedTypeSyntax<int>
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
                NamedTypeSyntax<int>
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                NamedTypeSyntax<int>
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
        NamedTypeSyntax<boolean>
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
        NamedTypeSyntax<boolean>
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
        NamedTypeSyntax<int>
        IntegerLiteralExpressionSyntax<5>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        IntegerLiteralExpressionSyntax<5>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                NamedTypeSyntax<int>
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
            NamedTypeSyntax<void>
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
            NamedTypeSyntax<int>
        VariableDeclarationSyntax<i>
            NamedTypeSyntax<int>
        FunctionDeclarationStatementSyntax<print>
            ParameterDeclarationListSyntax
            NamedTypeSyntax<void>
            BlockStatementSyntax
                ReturnStatementSyntax
        VariableDeclarationSyntax<j>
            NamedTypeSyntax<string>
        FunctionDeclarationStatementSyntax<a>
            ParameterDeclarationListSyntax
            NamedTypeSyntax<float>
            BlockStatementSyntax
                ReturnStatementSyntax
                    FloatLiteralExpressionSyntax<3.14>
        VariableDeclarationSyntax<k>
            NamedTypeSyntax<float>
        FunctionDeclarationStatementSyntax<b>
            ParameterDeclarationListSyntax
            NamedTypeSyntax<string>
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
            NamedTypeSyntax<void>
            BlockStatementSyntax
                ReturnStatementSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<void>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                NamedTypeSyntax<test>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<n>
                NamedTypeSyntax<int>
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
        NamedTypeSyntax<string>
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
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            NamedTypeSyntax<bool>
        StructMemberDeclarationStatementSyntax<third:int>
            NamedTypeSyntax<int>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                NamedTypeSyntax<pair>
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
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            NamedTypeSyntax<bool>
        StructMemberDeclarationStatementSyntax<third:int>
            NamedTypeSyntax<int>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                NamedTypeSyntax<pair>
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
            NamedTypeSyntax<int>
    StructDeclarationStatementSyntax<leaf1>
        StructMemberDeclarationStatementSyntax<b1:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<b2:root>
            NamedTypeSyntax<root>
    StructDeclarationStatementSyntax<leaf2>
        StructMemberDeclarationStatementSyntax<c1:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<c2:leaf1>
            NamedTypeSyntax<leaf1>
    StructDeclarationStatementSyntax<leaf3>
        StructMemberDeclarationStatementSyntax<d1:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<d2:leaf2>
            NamedTypeSyntax<leaf2>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<d1>
                NamedTypeSyntax<leaf3>
            VariableDeclarationSyntax<b1>
                NamedTypeSyntax<leaf2>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                PointerTypeSyntax
                    NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                PointerTypeSyntax
                    PointerTypeSyntax
                        NamedTypeSyntax<int>
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                PointerTypeSyntax
                    NamedTypeSyntax<int>
            AssignmentStatementSyntax
                DereferenceExpressionSyntax
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
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<a>
                NamedTypeSyntax<int>
                IntegerLiteralExpressionSyntax<5>
            VariableDeclarationSyntax<ap>
                PointerTypeSyntax
                    NamedTypeSyntax<int>
            AssignmentStatementSyntax
                NameExpressionSyntax<ap>
                UnaryExpressionSyntax<&>
                    NameExpressionSyntax<a>
            AssignmentStatementSyntax
                DereferenceExpressionSyntax
                    NameExpressionSyntax<ap>
                IntegerLiteralExpressionSyntax<6>
            ReturnStatementSyntax
                NameExpressionSyntax<a>
`],
[
`struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let root : item;
    let a : *item;
    
    a = &root;
    (*a).value = 51;

    return root.value;
}`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<item>
        StructMemberDeclarationStatementSyntax<value:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<next:item>
            PointerTypeSyntax
                NamedTypeSyntax<item>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<root>
                NamedTypeSyntax<item>
            VariableDeclarationSyntax<a>
                PointerTypeSyntax
                    NamedTypeSyntax<item>
            AssignmentStatementSyntax
                NameExpressionSyntax<a>
                UnaryExpressionSyntax<&>
                    NameExpressionSyntax<root>
            AssignmentStatementSyntax
                GetExpressionSyntax<value>
                    ParenthesizedExpressionSyntax
                        DereferenceExpressionSyntax
                            NameExpressionSyntax<a>
                IntegerLiteralExpressionSyntax<51>
            ReturnStatementSyntax
                GetExpressionSyntax<value>
                    NameExpressionSyntax<root>
`
],
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap != null)
        return 1;
    else
        return 0;
}`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                PointerTypeSyntax
                    NamedTypeSyntax<int>
                NullLiteralExpressionSyntax
            IfStatementSyntax
                ParenthesizedExpressionSyntax
                    BinaryExpressionSyntax<!=>
                        NameExpressionSyntax<ap>
                        NullLiteralExpressionSyntax
                ReturnStatementSyntax
                    IntegerLiteralExpressionSyntax<1>
                ElseStatementSyntax
                    ReturnStatementSyntax
                        IntegerLiteralExpressionSyntax<0>
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
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<ap>
                PointerTypeSyntax
                    NamedTypeSyntax<int>
                NullLiteralExpressionSyntax
            IfStatementSyntax
                ParenthesizedExpressionSyntax
                    BinaryExpressionSyntax<==>
                        NameExpressionSyntax<ap>
                        NullLiteralExpressionSyntax
                ReturnStatementSyntax
                    IntegerLiteralExpressionSyntax<1>
                ElseStatementSyntax
                    ReturnStatementSyntax
                        IntegerLiteralExpressionSyntax<0>
`],
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
    (*a).value = 51;

    return root.value;
}`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<item>
        StructMemberDeclarationStatementSyntax<value:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<next:item>
            PointerTypeSyntax
                NamedTypeSyntax<item>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<root>
                NamedTypeSyntax<item>
            VariableDeclarationSyntax<a>
                PointerTypeSyntax
                    NamedTypeSyntax<item>
            AssignmentStatementSyntax
                NameExpressionSyntax<a>
                UnaryExpressionSyntax<&>
                    NameExpressionSyntax<root>
            AssignmentStatementSyntax
                GetExpressionSyntax<value>
                    ParenthesizedExpressionSyntax
                        DereferenceExpressionSyntax
                            NameExpressionSyntax<a>
                IntegerLiteralExpressionSyntax<51>
            ReturnStatementSyntax
                GetExpressionSyntax<value>
                    NameExpressionSyntax<root>
`],
[`
// array of length 3 of int
let root : [3]int;
`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            IntegerLiteralExpressionSyntax<3>
            NamedTypeSyntax<int>
`],
[`
// array of length 9 of int
let root : [3*3]int;
`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            BinaryExpressionSyntax<*>
                IntegerLiteralExpressionSyntax<3>
                IntegerLiteralExpressionSyntax<3>
            NamedTypeSyntax<int>
`],
[`
// array of length 3 of array of length 2 of int
let root : [3][2]int;
`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            IntegerLiteralExpressionSyntax<3>
            ArrayTypeSyntax
                IntegerLiteralExpressionSyntax<2>
                NamedTypeSyntax<int>
`],
[`
// pointer to array of length 3 of int
let root : *[3]int;
`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<root>
        PointerTypeSyntax
            ArrayTypeSyntax
                IntegerLiteralExpressionSyntax<3>
                NamedTypeSyntax<int>
`],
[`
// array of length 3 of pointer to array of length 2 of pointer to int
let root : [3]*[2]*int;
`, 
`CompilationUnitSyntax
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            IntegerLiteralExpressionSyntax<3>
            PointerTypeSyntax
                ArrayTypeSyntax
                    IntegerLiteralExpressionSyntax<2>
                    PointerTypeSyntax
                        NamedTypeSyntax<int>
`],
[`
struct test 
{
    first : int;
    second : bool;
}

// array of length 3 pointer to pair
let root : [3]*pair;
`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<test>
        StructMemberDeclarationStatementSyntax<first:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            NamedTypeSyntax<bool>
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            IntegerLiteralExpressionSyntax<3>
            PointerTypeSyntax
                NamedTypeSyntax<pair>
`],
[`
func main() : int
{
    let root : [3]int;
    root[0] = 123;
    return root[0];
}
`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<root>
                ArrayTypeSyntax
                    IntegerLiteralExpressionSyntax<3>
                    NamedTypeSyntax<int>
            AssignmentStatementSyntax
                ArrayIndexExpressionSyntax
                    NameExpressionSyntax<root>
                    IntegerLiteralExpressionSyntax<0>
                IntegerLiteralExpressionSyntax<123>
            ReturnStatementSyntax
                ArrayIndexExpressionSyntax
                    NameExpressionSyntax<root>
                    IntegerLiteralExpressionSyntax<0>
`],
[`
func updatearray(a : *[2]int) : int
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
}
`, 
`CompilationUnitSyntax
    FunctionDeclarationStatementSyntax<updatearray>
        ParameterDeclarationListSyntax
            ParameterDeclarationSyntax<a:int>
                PointerTypeSyntax
                    ArrayTypeSyntax
                        IntegerLiteralExpressionSyntax<2>
                        NamedTypeSyntax<int>
        NamedTypeSyntax<int>
        BlockStatementSyntax
            AssignmentStatementSyntax
                ArrayIndexExpressionSyntax
                    ParenthesizedExpressionSyntax
                        DereferenceExpressionSyntax
                            NameExpressionSyntax<a>
                    IntegerLiteralExpressionSyntax<1>
                IntegerLiteralExpressionSyntax<750>
            ReturnStatementSyntax
                IntegerLiteralExpressionSyntax<1>
    FunctionDeclarationStatementSyntax<main>
        ParameterDeclarationListSyntax
        NamedTypeSyntax<int>
        BlockStatementSyntax
            VariableDeclarationSyntax<arr>
                ArrayTypeSyntax
                    IntegerLiteralExpressionSyntax<2>
                    NamedTypeSyntax<int>
            AssignmentStatementSyntax
                ArrayIndexExpressionSyntax
                    NameExpressionSyntax<arr>
                    IntegerLiteralExpressionSyntax<0>
                IntegerLiteralExpressionSyntax<78>
            AssignmentStatementSyntax
                ArrayIndexExpressionSyntax
                    NameExpressionSyntax<arr>
                    IntegerLiteralExpressionSyntax<1>
                IntegerLiteralExpressionSyntax<89>
            ExpressionStatementSyntax
                CallExpressionSyntax
                    NameExpressionSyntax<updatearray>
                    UnaryExpressionSyntax<&>
                        NameExpressionSyntax<arr>
            ReturnStatementSyntax
                ArrayIndexExpressionSyntax
                    NameExpressionSyntax<arr>
                    IntegerLiteralExpressionSyntax<1>
`],
[
`class test 
{
    public let a : int = 50;
}

func main() : int
{
    let c : test;
    return c.a;
}
`,``
]
/*,
[`
// array of length 3 int with initialisation vector
let root : [3]int = {1, 2, 3};
`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<test>
        StructMemberDeclarationStatementSyntax<first:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            NamedTypeSyntax<bool>
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            IntegerLiteralExpressionSyntax<3>
            PointerTypeSyntax
                NamedTypeSyntax<pair>
`],
[`
// array with no length with initialsation vector
let root : [...]int = {1, 2, 3, 4, 5, 6};
`, 
`CompilationUnitSyntax
    StructDeclarationStatementSyntax<test>
        StructMemberDeclarationStatementSyntax<first:int>
            NamedTypeSyntax<int>
        StructMemberDeclarationStatementSyntax<second:bool>
            NamedTypeSyntax<bool>
    VariableDeclarationSyntax<root>
        ArrayTypeSyntax
            IntegerLiteralExpressionSyntax<3>
            PointerTypeSyntax
                NamedTypeSyntax<pair>
`]*/
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
        NamedTypeSyntax(14,5)
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