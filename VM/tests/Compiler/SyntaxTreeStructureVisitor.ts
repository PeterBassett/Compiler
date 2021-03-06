import * as AST from "../../Language/Compiler/Syntax/AST/ASTNode";
import { exhaustiveCheck } from "../../misc/exhaustive";
import { SyntaxType } from "../../Language/Compiler/Syntax/SyntaxType";

export default class SyntaxTreeStructureVisitor
{
    public structure : string = "";
    private indent : number = 0;

    private write(node:AST.SyntaxNode | AST.CompilationUnitSyntax) : void
    {
        let value : string = "";

        if(!node)
            return;

        switch(node.kind)
        {
            case "BooleanLiteralExpressionSyntax":
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
            case "LambdaDeclarationStatementSyntax":
            case "VariableDeclarationSyntax":
            case "ClassDeclarationStatementSyntax":
                value = "<" + node.identifier.lexeme + ">";
                break;  
            case "StructOrUnionDeclarationStatementSyntax":
                let type = node.keyword.kind === SyntaxType.StructKeyword ? "StructDeclarationStatementSyntax" : "UnionDeclarationStatementSyntax";
                this.structure += Array(this.indent+1).join("    ") + type + "<" + node.identifier.lexeme + ">" + "\n";
                return;              
            case "ParameterDeclarationSyntax":
            case "StructMemberDeclarationStatementSyntax" :            
                value = "<" + node.identifier.lexeme + ":" + (!!node.typeName ? node.typeName.rootIdentifier().lexeme : "INFERED") + ">";
                break;            
            case "GetExpressionSyntax":
                value = "<" + node.name.lexeme + ">";
                break;   
            case "NameExpressionSyntax":            
                value = "<" + node.identifierToken.lexeme + ">";
                break;     
            case "NamedTypeSyntax":
            {
                value = "<" + node.identifier.lexeme + ">";
                break;
            }          
           /* case "PointerTypeSyntax":
            {
                let pointer = "";
                if(node.starToken)
                {                    
                    let n = node;
                    while(n.pointerToType)
                    {
                        n = n.pointerToType;
                        pointer += "*";
                    }
                }

                value = "<" + pointer + node.identifier.lexeme + ">";
                break;
            }   */                                
        }
        
        this.structure += Array(this.indent+1).join("    ") + node.kind + value + "\n";
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