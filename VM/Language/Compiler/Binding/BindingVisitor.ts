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
        var keys = Object.keys(node);

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

    /*
    Visit2(node : AST.SyntaxNode) : void 
    {
        this.structure = "";

        this.write(node);

        switch(node.kind
        {
            case "BinaryExpressionSyntax":
                return this.VisitBinaryExpressionSyntax(node);
            case "UnaryExpressionSyntax" :
                return this.VisitUnaryExpressionSyntax(node);
            case "BlockStatementSyntax":
                return this.VisitBlockStatementSyntax(node); 
            case "ForStatementSyntax":
                return this.VisitForStatementSyntax(node); 
            case "IfStatementSyntax" :
                return this.VisitIfStatementSyntax(node);
            case "ElseStatementSyntax" :
                return this.VisitElseStatementSyntax(node);                
            case "IntegerLiteralExpressionSyntax" :
                return this.VisitIntegerLiteralStatementSyntax(node);
            case "FloatLiteralExpressionSyntax" :
                return this.VisitFloatLiteralStatementSyntax(node);                
            case "StringLiteralExpressionSyntax" :
                return this.VisitStringLiteralStatementSyntax(node);
            case "ExpressionStatementSyntax" :
                return this.VisitExpressionStatementSyntax(node);
            case "AssignmentExpressionSyntax":
                return this.VisitAssignmentExpressionSyntax(node);
            case "ParenthesizedExpressionSyntax":
                return this.VisitParenthesizedExpressionSyntax(node);
            case "NameExpressionSyntax" :
                return this.VisitNameExpressionSyntax(node);
            case "VariableDeclarationSyntax":
                return this.VisitVariableDeclarationSyntax(node);
            case "FunctionDeclarationStatementSyntax":
                return this.VisitFunctionDeclarationStatementSyntax(node);      
            case "ReturnStatementSyntax":
                return this.VisitReturnStatementSyntax(node);          
            default:
                return exhaustiveCheck(node);
        }
    }
    VisitReturnStatementSyntax(node : AST.ReturnStatementSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitVariableDeclarationSyntax(node : AST.VariableDeclarationSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitFunctionDeclarationStatementSyntax(node : AST.FunctionDeclarationStatementSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }    
    VisitNameExpressionSyntax(node : AST.NameExpressionSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitParenthesizedExpressionSyntax(node : AST.ParenthesizedExpressionSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitAssignmentExpressionSyntax(node : AST.AssignmentExpressionSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitBinaryExpressionSyntax(node : AST.BinaryExpressionSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitUnaryExpressionSyntax(node : AST.UnaryExpressionSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitBlockStatementSyntax(node : AST.BlockStatementSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitForStatementSyntax(node : AST.ForStatementSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitIfStatementSyntax(node : AST.IfStatementSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitElseStatementSyntax(node : AST.ElseStatementSyntax): void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitFloatLiteralStatementSyntax(node : AST.FloatLiteralExpressionSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitIntegerLiteralStatementSyntax(node : AST.IntegerLiteralExpressionSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitStringLiteralStatementSyntax(node : AST.StringLiteralExpressionSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    }
    VisitExpressionStatementSyntax(node : AST.ExpressionStatementSyntax) : void {
        this.indent++;
        this.write(node);
        this.indent--;
    } */
}