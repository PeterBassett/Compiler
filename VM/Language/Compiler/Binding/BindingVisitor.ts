import * as AST from "../Syntax/AST/ASTNode";
import { exhaustiveCheck } from "../../../misc/exhaustive";

export default class SyntaxTreeVisitor
{
    public structure : string = "";
    private indent : number = 0;

    private write(node:AST.SyntaxNode) : void
    {
        let value : string = "";

        switch(node.kind)
        {
            case "FloatLiteralExpressionSyntax":
            case "IntegerLiteralExpressionSyntax":
            case "StringLiteralExpressionSyntax":
                value = "<" + node.literalToken.lexeme + ">";
                break;
            case "BinaryExpressionSyntax":
            case "UnaryExpressionSyntax":
                value = "<" + node.operatorToken.lexeme + ">";
                break;
            case "FunctionDeclarationStatementSyntax":
                value = "<" + node.identifier.lexeme + ">";
                break;
            case "ParameterDeclarationSyntax":
                value = "<" + node.identifier.lexeme + ":" + (!!node.typeName ? node.typeName.identifier.lexeme : "INFERED") + ">";
                break;            
        }
        
        this.structure += Array(this.indent).join("    ") + node.kind+ value + "\n";
    }

    public Visit(node : AST.SyntaxNode) : void 
    {
        const keys = Object.keys(node);

        this.write(node);

        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const element = (node as any)[key];
                                
                if(typeof element == "object" && typeof element.kind== "string")
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