import * as AST from "../../Language/Compiler/Syntax/AST/ASTNode";
import { exhaustiveCheck } from "../../misc/exhaustive";

export default class SyntaxTreeNodeTextSpanVisitor
{
    public structure : string = "";
    private indent : number = 0;

    private write(node:AST.SyntaxNode | AST.CompilationUnitSyntax) : void
    {
        if(!node)
            return;
            
        let span = node.span();
        this.structure += Array(this.indent+1).join("    ") + node.kind + "(" + span.start + "," + span.length + ")\n";
    }

    public Visit(node : AST.SyntaxNode | AST.CompilationUnitSyntax) : void 
    {
        var keys = Object.keys(node);

        this.write(node);

        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const element = (node as any)[key];
                
                if(!element)
                    continue;

                if(typeof element == "object" && typeof element.kind == "string")
                {
                    this.indent++;
                    this.Visit(element);
                    this.indent--;
                }
                else if(typeof element == "object" && typeof element.length == "number")
                {
                    this.indent++;
                    for(let i = 0; i < element.length; i++)
                    {
                        this.Visit(element[i]);
                    }
                    this.indent--;
                }
            }
        }
    }
}