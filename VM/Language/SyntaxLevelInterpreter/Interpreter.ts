import * as AST from "../Compiler/Syntax/AST/ASTNode";
import SyntaxTreeVisitor from "../Compiler/Binding/BindingVisitor";
import { Type } from "../Types/TypeInformation";
import { ValueType } from "../Types/ValueType";
import { using } from "../../misc/disposable";
import { exhaustiveCheck } from "../../misc/exhaustive";
import { ExecutionScope, Value } from "../Scope/ExecutionScope";
import TypeQuery from "../Types/TypeInspection";
import Token from "../Compiler/Syntax/Token";

class ReturnStatementException extends Error
{
    public isReturnStatementException : boolean = true;
    public value:Value;
    constructor(value:Value)
    {
        super("Return statement encountered");
        this.value = value;
    }
}

class BreakStatementException extends Error
{
    public isBreakStatementException : boolean = true;
}

class ContinueStatementException extends Error
{
    public isContinueStatementException : boolean = true;
}

class UndefinedIdentifierException extends Error
{
    constructor(message : string)
    {
        super(message);
    }
}

class InvalidCastException extends Error
{
    constructor(message : string)
    {
        super(message);
    }
}

class UnexpectedOperatorException extends Error
{
    constructor(message : string)
    {
        super(message);
    }
}

class InvalidLiteralValueTokenException extends Error
{
    constructor(invalidLiteralValueToken : Token)
    {
        super("Invalid literal value token " + invalidLiteralValueToken.lexeme);
    }
}

export default class Interpreter
{
    private scope : ExecutionScope;
    
    constructor()
    {
        this.scope = new ExecutionScope();
    }

    public Execute(root : AST.CompilationUnitSyntax) : Value 
    {
        let decs : any[] = [];

        for (const declarationSyntax of root.declarations) {
            this.VisitDeclarationSyntax(declarationSyntax);
        }

        let main = this.scope.FindIdentifier("main");

        return this.executeFunction(this.scope, main.Value.ToCallable(), []);
    }

    private executeFunction(scope : ExecutionScope, func : AST.CallableExpressionNode, args : Value[]) : Value
    {
        var retVal : Value = Value.Unit;
        
        using(scope.PushArguments(func.parameterList.params.map( p => p.identifier.lexeme ), args), (popper) => {
            retVal = this.runFunction(func, scope)
        });      

        return retVal;
    }

    private runFunction(func : AST.CallableExpressionNode, scope:ExecutionScope) : Value
    {
        try
        {
            if(func.kind  === "LambdaDeclarationStatementSyntax")
                return this.VisitExpressionNode(func.body);

            if(func.kind  === "FunctionDeclarationStatementSyntax")
                return this.VisitBlockStatementSyntax(func.body);

            throw exhaustiveCheck(func);
        }
        catch(ex)
        {
            if(ex.isReturnStatementException)
                return ex.value;

            throw ex;
        }
    }

    VisitDeclarationSyntax(node: AST.DeclarationSyntax): Value {
        switch(node.kind )
        {
            case "VariableDeclarationSyntax":
                return this.VisitVariableDeclarationSyntax(node);
            case "FunctionDeclarationStatementSyntax":
                return this.VisitFunctionDeclarationStatementSyntax(node);
            case "LambdaDeclarationStatementSyntax":
                return this.VisitLambdaDeclarationStatementSyntax(node);
            case "StructOrUnionDeclarationStatementSyntax" :
            case "ClassDeclarationStatementSyntax" :
                throw new Error("Class execution not impletmented yet");
            default: 
            {
                exhaustiveCheck(node, true);
                throw RangeError("JUST HERE TO CLEAR A COMPILER ERROR. The call above will throw before this");
            }
        }
    }

    VisitNode(node : AST.SyntaxNode) : Value 
    {
        switch (node.kind )
        {
            case "BinaryExpressionSyntax":
                return this.VisitBinaryExpressionSyntax(node);
            case "UnaryExpressionSyntax" :
                return this.VisitUnaryExpressionSyntax(node);
            case "BlockStatementSyntax":
                return this.VisitBlockStatementSyntax(node); 
            case "ForStatementSyntax":
                return this.VisitForStatementSyntax(node); 
            case "WhileStatementSyntax":
                return this.VisitWhileStatementSyntax(node);                 
            case "IfStatementSyntax" :
                return this.VisitIfStatementSyntax(node);
            case "ElseStatementSyntax" :
                return this.VisitElseStatementSyntax(node);                
            case "BooleanLiteralExpressionSyntax" :
                return this.VisitBooleanLiteralStatementSyntax(node);                
            case "IntegerLiteralExpressionSyntax" :
                return this.VisitIntegerLiteralStatementSyntax(node);
            case "FloatLiteralExpressionSyntax" :
                return this.VisitFloatLiteralStatementSyntax(node);                
            case "StringLiteralExpressionSyntax" :
                return this.VisitStringLiteralStatementSyntax(node);
            case "NullLiteralExpressionSyntax" :
                return this.VisitNullLiteralStatementSyntax(node);                
            case "ExpressionStatementSyntax" :
                return this.VisitExpressionStatementSyntax(node);
            case "ParenthesizedExpressionSyntax":
                return this.VisitParenthesizedExpressionSyntax(node);
            case "NameExpressionSyntax" :
                return this.VisitNameExpressionSyntax(node);
            case "VariableDeclarationSyntax":
                return this.VisitVariableDeclarationSyntax(node);
            case "FunctionDeclarationStatementSyntax":
                return this.VisitFunctionDeclarationStatementSyntax(node); 
            case "LambdaDeclarationStatementSyntax":
                return this.VisitLambdaDeclarationStatementSyntax(node);                      
            case "ReturnStatementSyntax":
                return this.VisitReturnStatementSyntax(node);
            case "BreakStatementSyntax":
                return this.VisitBreakStatementSyntax(node);                   
            case "ContinueStatementSyntax":
                return this.VisitContinueStatementSyntax(node);                                   
            case "ParameterDeclarationListSyntax":
                return this.VisitParameterDeclarationListSyntax(node);
            case "ParameterDeclarationSyntax":
                return this.VisitParameterDeclarationSyntax(node);
            case "CallExpressionSyntax":
                return this.VisitCallExpressionSyntax(node);    
            case "NamedTypeSyntax":
            case "PointerTypeSyntax":
            case "ArrayTypeSyntax":
                return this.VisitTypeSyntax(node);
            case "AssignmentStatementSyntax":                       
                return this.VisitAssignmentStatementSyntax(node);                
            case "StructOrUnionDeclarationStatementSyntax" :   
            case "StructMemberDeclarationStatementSyntax" :             
            case "ClassDeclarationStatementSyntax" :           
            case "GetExpressionSyntax":                    
            case "ArrayIndexExpressionSyntax":
            case "DereferenceExpressionSyntax":               
                throw new Error("Class execution not impletmented yet");                                
            default:
                return exhaustiveCheck(node);
        }
    }
    
    VisitNullLiteralStatementSyntax(node: AST.NullLiteralExpressionSyntax): Value {
        return new Value(ValueType.Null, null);
    }

    VisitGetExpressionSyntax(syntax: AST.GetExpressionSyntax): Value {
        throw new Error("Method not implemented.");
    }

    VisitPointerTypeSyntax(node: AST.PointerTypeSyntax): Value {
        this.VisitTypeSyntax(node.pointerToType);
        throw new Error("Method not implemented.");
    }

    VisitArrayTypeSyntax(node: AST.ArrayTypeSyntax): Value {
        this.VisitExpressionNode(node.length);
        this.VisitTypeSyntax(node.elementType);
        throw new Error("Method not implemented.");
    }

    VisitNamedTypeSyntax(node: AST.NamedTypeSyntax): Value {
        throw new Error("Method not implemented.");
    }

    VisitTypeSyntax(node: AST.TypeSyntax): Value {
        switch (node.kind)
        {
            case "ArrayTypeSyntax":
                return this.VisitArrayTypeSyntax(node);
            case "PointerTypeSyntax":
                return this.VisitPointerTypeSyntax(node);
            case "NamedTypeSyntax":
                return this.VisitNamedTypeSyntax(node);
            default:
                return exhaustiveCheck(node);
        }
    }

    VisitParameterDeclarationSyntax(node: AST.ParameterDeclarationSyntax) : Value
    {
        throw new Error("Method not implemented.");
    }

    VisitParameterDeclarationListSyntax(node: AST.ParameterDeclarationListSyntax) : Value {
        throw new Error("Method not implemented.");
    }
    
    VisitReturnStatementSyntax(node : AST.ReturnStatementSyntax) : Value {
        let value : Value = Value.Unit;
        
        if(node.expression)
            value = this.VisitExpressionNode(node.expression);

        throw new ReturnStatementException(value);
    }

    VisitBreakStatementSyntax(node : AST.BreakStatementSyntax) : Value {
        throw new BreakStatementException();
    }

    VisitContinueStatementSyntax(node : AST.ContinueStatementSyntax) : Value {
        throw new ContinueStatementException();
    }

    VisitVariableDeclarationSyntax(stmt : AST.VariableDeclarationSyntax): Value {
        let value : Value;

        if(stmt.initialiserExpression != null)
            value = this.VisitExpressionNode(stmt.initialiserExpression);
        else
            value = Value.Unit;

        this.scope.DefineIdentifier(stmt.identifier.lexeme, value, TypeQuery.getValueTypeFromName(stmt.typeName!.rootIdentifier().lexeme));

        return value;
    }

    VisitFunctionDeclarationStatementSyntax(node : AST.FunctionDeclarationStatementSyntax): Value {
        let value = new Value(ValueType.Function, node);
        this.scope.DefineIdentifier(node.identifier.lexeme, value, TypeQuery.getValueTypeFromName(node.returnValue.rootIdentifier().lexeme));
        return value;
    }
    
    VisitLambdaDeclarationStatementSyntax(node: AST.LambdaDeclarationStatementSyntax): Value {
        let value = new Value(ValueType.Function, node);
        this.scope.DefineIdentifier(node.identifier.lexeme, value, TypeQuery.getValueTypeFromName(node.identifier.lexeme));
        return value;
    }

    VisitNameExpressionSyntax(node : AST.NameExpressionSyntax): Value {
        return this.scope.FindIdentifier(node.identifierToken.lexeme).Value;
    }

    VisitCallExpressionSyntax(node : AST.CallExpressionSyntax): Value {
        var args = [];

        for(let i = 0; i < node.callArguments.length; i++)
        {
            args.push(this.VisitExpressionNode(node.callArguments[i]));
        }

        var func = this.scope.FindIdentifier(node.nameExpression.identifierToken.lexeme);

        if(func.Value.IsFunction)
            return this.executeFunction(this.scope, func.Value.ToCallable(), args);

        return this.ConvertionExpression(node, args[0]);
    }

    ConvertionExpression(node : AST.CallExpressionSyntax, argument : Value) : Value
    {
        const type = node.nameExpression.identifierToken.lexeme;

        switch(type)
        {
            case "int":
                return new Value(ValueType.Int, parseInt(argument.ToObject()));
            case "float":
                return new Value(ValueType.Float, parseFloat(argument.ToObject()));                
            case "string":
                return new Value(ValueType.String, argument.ToObject().toString());
            case "bool":
            {
                switch(argument.Type)
                {
                    case ValueType.Int:
                        return new Value(ValueType.Boolean, argument.ToObject() !== 0);
                    case ValueType.Float:
                        return new Value(ValueType.Boolean, argument.ToObject() !== 0);
                    case ValueType.String:
                        return new Value(ValueType.Boolean, argument.ToObject() !== 0);
                    case ValueType.Boolean:
                        return argument;
                }    
            }                                
        }

        throw new Error ("Unexpected");
    }

    VisitParenthesizedExpressionSyntax(node : AST.ParenthesizedExpressionSyntax): Value {
        return this.VisitExpressionNode(node.expression);
    }

    VisitAssignmentStatementSyntax(node : AST.AssignmentStatementSyntax): Value {
        switch(node.target.kind)
        {
            case "NameExpressionSyntax":
                return this.VisitAssignToVariableStatement(node.target, node.expression);
            case "GetExpressionSyntax":
                return this.VisitAssignToGetExpressionStatement(node.target, node.expression);
            case "DereferenceExpressionSyntax":
                return this.VisitAssignToDereferenceExpressionStatement(node.target, node.expression);                
            case "ArrayIndexExpressionSyntax":
                return this.VisitAssignToArrayIndexExpressionSyntax(node.target, node.expression);                
            default: 
            {
                //exhaustiveCheck(node, true);
                throw RangeError("JUST HERE TO CLEAR A COMPILER ERROR. The call above will throw before this");
            }
        }
    }

    VisitAssignToArrayIndexExpressionSyntax(target: AST.ArrayIndexExpressionSyntax, expression: AST.ExpressionNode): Value {
        throw new Error("Method not implemented.");
    }

    VisitAssignToVariableStatement(target: AST.NameExpressionSyntax, expression: AST.ExpressionNode): Value {
        let name = target.identifierToken.lexeme;
        let variable = this.scope.FindIdentifier(name);

        if(!variable.IsDefined)
            throw new UndefinedIdentifierException("Identifier is not defined " + name);

        let value = this.VisitExpressionNode(expression);

        this.scope.AssignIdentifierValue(name, value);

        return Value.Unit;
    }

    VisitAssignToDereferenceExpressionStatement(target: any, expression: any): Value {
        throw new Error("Method not implemented.");
    }

    VisitAssignToGetExpressionStatement(target: any, expression: any): Value {
        throw new Error("Method not implemented.");
    }
    
    VisitBinaryExpressionSyntax(node : AST.BinaryExpressionSyntax) : Value {
        let left = this.VisitExpressionNode(node.left);
        let right = this.VisitExpressionNode(node.right);

        let l = left.ToFloat();
        let r = right.ToFloat();
        let a : number = 0;

        switch(node.operatorToken.lexeme)
        {
            case "+":
                a = l + r;
                break;
            case "-":
                a = l - r;
                break;
            case "*":
                a = l * r;
                break;
            case "/":
                a = l / r;
                break;
            case ">":
                return new Value(ValueType.Boolean, l > r);   
            case "<":
                return new Value(ValueType.Boolean, l < r);    
            case "<=":
                return new Value(ValueType.Boolean, l <= r);                                                
            case ">=":
                return new Value(ValueType.Boolean, l >= r);                                                
            case "==":
                return new Value(ValueType.Boolean, l == r);        
            case "!=":
                return new Value(ValueType.Boolean, l != r);                        
            case "||":
                return new Value(ValueType.Boolean, l || r);
            case "&&":
                return new Value(ValueType.Boolean, l && r);                
            default:
                throw new UnexpectedOperatorException(node.operatorToken.lexeme);
        }

        return new Value(ValueType.Float, a);        
    }

    VisitUnaryExpressionSyntax(node : AST.UnaryExpressionSyntax) : Value {
        let value = this.VisitExpressionNode(node.operand);        

        let v = value.ToFloat();

        switch(node.operatorToken.lexeme)
        {
            case "-":
                v = -v;
                break;
            case "!":
                return new Value(ValueType.Boolean, !v);     
        }

        return new Value(ValueType.Float, v);        
    }

    VisitBlockStatementSyntax(node : AST.BlockStatementSyntax): Value 
    {
        using(this.scope.PushScope(), (popper) => {
            node.statements.forEach(statement => {
                this.VisitNode(statement);
            });
        });

        return Value.Unit;
    }

    VisitForStatementSyntax(node : AST.ForStatementSyntax) : Value 
    {    
        let lowerBoundValue = this.VisitExpressionNode(node.lowerBound);        
        let value = lowerBoundValue.ToInt();
        
        using(this.scope.PushScope(), (popper) => {
            let upperBoundValue = this.VisitExpressionNode(node.upperBound);

            this.scope.DefineIdentifier(node.identifier.lexeme, new Value(ValueType.Int, value), ValueType.Int);

            while(value <= upperBoundValue.ToInt())
            {
                this.scope.AssignIdentifierValue(node.identifier.lexeme, new Value(ValueType.Int, value));

                try
                {
                    this.VisitNode(node.body);
                }
                catch(ex)
                {
                    // if it is a break statement, exit the loop
                    if(ex.isBreakStatementException)
                        break;
                    
                    // if it is a continue,
                    if(ex.isContinueStatementException)
                    {
                        // do nothing, exit the try/catch and increment as normal.
                    }
                    else
                        throw ex;
                }

                upperBoundValue = this.VisitExpressionNode(node.upperBound);

                value++;
            }
        });  
        
        return new Value(ValueType.Int, value);
    }

    VisitWhileStatementSyntax(node : AST.WhileStatementSyntax) : Value 
    {
        while(true)
        {
            let condition = this.VisitExpressionNode(node.condition);        
            let value = condition.ToBoolean();
            
            if(!value)
                break;

            using(this.scope.PushScope(), (popper) => {
                this.VisitNode(node.body);
            });              
        }

        return new Value(ValueType.Unit, null);
    }

    VisitIfStatementSyntax(node : AST.IfStatementSyntax) : Value {
        let condition = this.VisitExpressionNode(node.condition);

        if(condition.Type !== ValueType.Boolean)
            throw new InvalidCastException("HERE");
    
        if(condition.ToBoolean())
            return this.VisitNode(node.trueBranch);

        if(node.falseBranch)
            return this.VisitNode(node.falseBranch);

        return Value.Unit;
    }

    VisitElseStatementSyntax(node : AST.ElseStatementSyntax): Value {
        return this.VisitNode(node.body);
    }

    VisitFloatLiteralStatementSyntax(node : AST.FloatLiteralExpressionSyntax) : Value {
        return new Value(ValueType.Float, parseFloat(node.literalToken.lexeme));
    }

    VisitBooleanLiteralStatementSyntax(node : AST.BooleanLiteralExpressionSyntax) : Value {
        let lexeme = node.literalToken.lexeme.toLowerCase();

        switch(lexeme)
        {
            case "true":
                return new Value(ValueType.Boolean, true);
            case "false":
                return new Value(ValueType.Boolean, false);
            default:
                throw new InvalidLiteralValueTokenException(node.literalToken);
        }        
    }

    VisitIntegerLiteralStatementSyntax(node : AST.IntegerLiteralExpressionSyntax) : Value {
        return new Value(ValueType.Int, parseInt(node.literalToken.lexeme));
    }

    VisitStringLiteralStatementSyntax(node : AST.StringLiteralExpressionSyntax) : Value {
        return new Value(ValueType.String, node.literalToken.lexeme);
    }
    
    VisitExpressionStatementSyntax(node : AST.ExpressionStatementSyntax) : Value {
        return this.VisitNode(node.expression);
    }

    VisitExpressionNode(node : AST.ExpressionNode) : Value {
        switch(node.kind )
        {
            case "UnaryExpressionSyntax":
                return this.VisitUnaryExpressionSyntax(node);
            case "BinaryExpressionSyntax":
                return this.VisitBinaryExpressionSyntax(node);
            case "BooleanLiteralExpressionSyntax":
                return this.VisitBooleanLiteralStatementSyntax(node);
            case "IntegerLiteralExpressionSyntax":
                return this.VisitIntegerLiteralStatementSyntax(node);                                
            case "FloatLiteralExpressionSyntax":
                return this.VisitFloatLiteralStatementSyntax(node);        
            case "StringLiteralExpressionSyntax":
                return this.VisitStringLiteralStatementSyntax(node); 
            case "NullLiteralExpressionSyntax":
                return this.VisitNullLiteralStatementSyntax(node);                                
            case "ParenthesizedExpressionSyntax":
                return this.VisitParenthesizedExpressionSyntax(node);                         
            case "NameExpressionSyntax":                       
                return this.VisitNameExpressionSyntax(node);            
            case "CallExpressionSyntax":                       
                return this.VisitCallExpressionSyntax(node);      
            case "NamedTypeSyntax":                
            case "PointerTypeSyntax":                
            case "ArrayTypeSyntax":
                return this.VisitTypeSyntax(node);
            case "GetExpressionSyntax":               
                return this.VisitGetExpressionSyntax(node);     
            case "ArrayIndexExpressionSyntax":
                return this.VisitArrayIndexExpressionSyntax(node);                                                                                                        
            case "DereferenceExpressionSyntax":
                return this.VisitDereferenceExpressionSyntax(node);
            default :
                exhaustiveCheck(node, true);
                throw RangeError("JUST HERE TO CLEAR A COMPILER ERROR. The call above will throw before this");
        }
    }

    VisitDereferenceExpressionSyntax(node: AST.DereferenceExpressionSyntax): Value {
        throw new Error("Method not implemented.");
    }

    VisitArrayIndexExpressionSyntax(node: AST.ArrayIndexExpressionSyntax): Value {
        throw new Error("Method not implemented.");
    }
}