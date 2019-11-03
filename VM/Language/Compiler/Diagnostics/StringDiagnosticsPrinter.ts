import { Diagnostics, Diagnostic } from "./Diagnostics";
import IDiagnosticsPrinter from "./IDiagnosticsPrinter";

export default class StringDiagnosticsPrinter implements IDiagnosticsPrinter
{
    private output?: string;

    print(diagnostics : Diagnostics) : void
    {
        this.output = "";

        for(let i = 0; i < diagnostics.length; i++)
        {
            this.output += this.printDiagnostic(diagnostics, diagnostics.get(i));

            if(i < diagnostics.length)
                this.output += "\r\n----------------------------------------\r\n";
        }
    }

    printDiagnostic(diagnostics : Diagnostics, diagnostic : Diagnostic) : string
    {
        try{
        let source = diagnostics.text;
        let lineIndex = diagnostics.text.getLineIndexContainingPosition(diagnostic.span.start);
        let line = diagnostics.text.getline(lineIndex);
        let pointer = Array((diagnostic.span.start - line.start)).join(" ") + 
                      Array(diagnostic.span.length + 1).join("^");

        let prefix = source.toString(line.start, diagnostic.span.start);
        let error = source.toString(diagnostic.span.start, diagnostic.span.end);
        let suffix = source.toString(diagnostic.span.end, line.end);

        if(prefix == "\n")
            prefix = "";

        if(error == "\n")
            error = "";

        if(suffix == "\n")
            suffix = "";

        return `${diagnostic.message} (${diagnostic.span.start}, ${diagnostic.span.length})
${prefix}${error}${suffix}
${pointer}`;
        }
        catch(ex)
        {
/* TODO : caused by
func a(i1 : int) : int 
{    
    return 1;
}


func main() : int {
    return  a(n); 
} 
*/
            console.error(ex);
            return "";
        }
    }

    public toString() : string
    {
        return this.output || "";
    }
}