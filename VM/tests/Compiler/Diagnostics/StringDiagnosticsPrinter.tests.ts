import Parser from "../../../Language/Compiler/Syntax/Parser";
import SourceText from "../../../Language/Compiler/Syntax/Text/SourceText";
import StringDiagnosticsPrinter from "../../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";

describe("A StringDiagnosticsPrinter ", () => {

    function testGeneratedErrorMessages(text : string, expected : string) : void
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();

        expect(compilationUnit.success).toEqual(false);
        expect(() => compilationUnit.compilationUnit).not.toThrow();
        expect(compilationUnit.diagnostics.length).toBeGreaterThan(0);

        let diagnosticsPrinter = new StringDiagnosticsPrinter();
        diagnosticsPrinter.print(compilationUnit.diagnostics);
        console.clear();
        console.log(diagnosticsPrinter.toString());
    }
    
[
[`£`, "Expected return type"],
[`func main() { return a; }`, "Expected return type"],
[`func main() :int 
{
    */%$ 324 fd garbage;
}`, "Expected return type"],
[`func main() :int 
{
    garbage;
}`, "Expected return type"],
[`func main() : int { £ return a; }`, "Unexpected character"],
    ].forEach((item) => {
        it(`should give specific error messages`, () => {  
            let text = item[0] as string;
            let expected = item[1] as string;
            testGeneratedErrorMessages(text, expected);
        });
    });
});