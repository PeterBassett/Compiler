import Parser from "../../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../../Language/Compiler/Syntax/Text/SourceText";
import { DiagnosticType } from "../../../../Language/Compiler/Diagnostics/Diagnostics";
import { BoundGlobalScope, BoundNodeKind } from "../../../../Language/Compiler/Binding/BoundNode";
import Binder from "../../../../Language/Compiler/Binding/Binder";
import Lowerer from "../../../../Language/Compiler/lowering/Lowerer";
import BoundTreeStructureVisitor from "../../BoundTreeStructureVisitor";
import ControlFlowAnalyser from "../../../../Language/Compiler/Binding/ControlFlow/ControlFlowAnalyser";
import { StringWriter } from "../../../../misc/StringWriter";
import ControlFlowGraph from "../../../../Language/Compiler/Binding/ControlFlow/ControlFlowGraph";
import ControlFlowGraphRenderer from "../../../../Language/Compiler/Binding/ControlFlow/ControlFlowGraphRenderer";

describe("A ControlFlowAnalyser object", () => {

    function cfa(text : string, excpectedSuccess : boolean) : void
    {
        const source = new SourceText(text);        
        const parser = new Parser(source);
        const compilationUnit = parser.parse();
        const binder = new Binder();
        const boundTree = binder.Bind(compilationUnit);
        const lowerer = new Lowerer();
        const newBoundTree = lowerer.lower(boundTree);

        const target = new ControlFlowAnalyser(newBoundTree);
        const scope = target.analyse();

        expect(scope.success).toEqual(excpectedSuccess);
        expect(scope.diagnostics).toBeTruthy();
        
        const cfg = ControlFlowGraph.Create(newBoundTree.functions[0].blockBody);
        const renderer = new ControlFlowGraphRenderer(cfg);
        const writer = new StringWriter();
        //renderer.WriteTo(writer);
        //console.log(writer.toString());
    }

[
`func main() : int
{    
    return 1;
}`,
`func main() : string
{
    return "TEST";
}`,
`func main( a:int, b:float, c:string) : int
{
    return 1;
}`,
`func main() : int
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
}`,              
`func add(a:int, b:int) :int => a + b;`, 
`let global : int = 5;
func main() : int
{
    return global;
}`, 
`func main() : int
{
    var n : int = 0;
    n = 5;
    return n;
}`,
`func main() : int
{
    if 1 == 2
    {
        return 1;
    }
    else
    {
        return 2;
    }
}`
    ].forEach((text) => {
        it(`should identify functions where all paths return ` + text, () => {  
            cfa(text, true);
        });
    });

[
`func main() : int
{    
}`,
`func main() : string
{
}`,
`func main( a:int, b:float, c:string) : int
{
}`,
`func main() : int
{
    return 1;
}
func a() : int
{
    return 2;
}
func b() : int
{
}`,              
`func main() : int
{
    if 1 == 2
    {
        let i = 1;
    }
    else
    {
        return 2;
    }
}`,
`func main() : int
{
    if 1 == 2
    {
        return 1;
    }
    else
    {
        let i = 1;
    }
}`
    ].forEach((text) => {
        it(`should identify functions where not all paths return ` + text, () => {  
            cfa(text, false);
        });
    });
    
});