import * as AST from "../Compiler/Syntax/AST/ASTNode";
import SyntaxTreeVisitor from "../Compiler/Binding/BindingVisitor";
import { Type } from "../Types/TypeInformation";
import { ValueType } from "../Types/ValueType";
import { using } from "../../misc/disposable";
import { exhaustiveCheck } from "../../misc/exhaustive";
import { Token } from "../Compiler/Syntax/Lexer";
import { ExecutionScope, Value } from "../Scope/ExecutionScope";
import TypeQuery from "../Types/TypeInspection";

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
            case "TypeNameSyntax":
                return this.VisitTypeNameSyntax(node);    
            case "ClassDeclarationStatementSyntax" :                
            case "GetExpressionSyntax":                           
                throw new Error("Class execution not impletmented yet");                                
            default:
                return exhaustiveCheck(node);
        }
    }

    VisitGetExpressionSyntax(syntax: AST.GetExpressionSyntax): Value {
        throw new Error("Method not implemented.");
    }

    VisitTypeNameSyntax(node: AST.TypeNameSyntax): Value {
        throw new Error("Method not implemented.");
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

        this.scope.DefineIdentifier(stmt.identifier.lexeme, value, TypeQuery.getValueTypeFromName(stmt.typeName!.identifier.lexeme));

        return value;
    }

    VisitFunctionDeclarationStatementSyntax(node : AST.FunctionDeclarationStatementSyntax): Value {
        let value = new Value(ValueType.Function, node);
        this.scope.DefineIdentifier(node.identifier.lexeme, value, TypeQuery.getValueTypeFromName(node.returnValue.identifier.lexeme));
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

    VisitAssignmentExpressionSyntax(node : AST.AssignmentExpressionSyntax): Value {
        let name = node.identifierToken.lexeme;
        let variable = this.scope.FindIdentifier(name);

        if(!variable.IsDefined)
            throw new UndefinedIdentifierException("Identifier is not defined " + name);

        let value = this.VisitExpressionNode(node.expression);

        this.scope.AssignIdentifierValue(name, value);

        return value;
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
/*
    VisitExpressionSyntax(node: AST.ExpressionNode): any {
        return node;
    }
*/
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
            case "ParenthesizedExpressionSyntax":
                return this.VisitParenthesizedExpressionSyntax(node);
            case "AssignmentExpressionSyntax":                       
                return this.VisitAssignmentExpressionSyntax(node);                         
            case "NameExpressionSyntax":                       
                return this.VisitNameExpressionSyntax(node);            
            case "CallExpressionSyntax":                       
                return this.VisitCallExpressionSyntax(node);      
            case "TypeNameSyntax":
                return this.VisitTypeNameSyntax(node);     
            case "GetExpressionSyntax":               
                return this.VisitGetExpressionSyntax(node);                                                                                
            default :
                exhaustiveCheck(node, true);
                throw RangeError("JUST HERE TO CLEAR A COMPILER ERROR. The call above will throw before this");
        }
    }
    
/*
    public Visit(root : AST.CompilationUnitSyntax) : AST.CompilationUnitSyntax 
    {
        let declarations : AST.DeclarationSyntax[] = [];

        for (const declaration of root.declarations) {
            declarations.push(this.VisitDeclarationSyntax(declaration));
        }

        return AST.CompilationUnitSyntax(declarations, root.eofToken);
    }

    Visit(IdentifierExpr expr, Scope scope)
    {
        var value = scope.FindIdentifier(expr.Name);
        return value.Value;
    }

     Visit(PlusExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a + b,
                                (a, b) => a + b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => a + b);
    }

     Visit(ConstantExpr expr, Scope scope)
    {
        return Value.FromObject(expr.Value);
    }

     Visit(DivExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a / b,
                                (a, b) => a / b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(MinusExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a - b,
                                (a, b) => a - b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(MultExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a * b,
                                (a, b) => a * b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(AssignmentExpr expr, Scope scope)
    {
        var name = expr.LValueExpression.Name;
        var variable = scope.FindIdentifier(name);

        if(!variable.IsDefined)
            throw new UndefinedIdentifierException("Identifier is not defined" + expr.LValueExpression.Name);
            
        var rvalue = expr.Right.Accept(this, scope);

        // HACK : Need to rationalise the type checking.
        // It's either in here or it's not!
        //if(variable.Value.Type != rvalue.Type)
            //   throw new InvalidCastException();

        scope.AssignIdentifierValue(name, rvalue);

        return rvalue;
    }

     Visit(PowExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => Math.Pow(a, b),
                                (a, b) => Math.Pow(a, b),
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(EqualsExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a.Equals(b),
                                (a, b) => a == b,
                                (a, b) => a == b,
                                (a, b) => a == b);
    }

     Visit(NotEqualsExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => !a.Equals(b),
                                (a, b) => a != b,
                                (a, b) => a != b,
                                (a, b) => a != b);
    }

     Visit(GreaterThanExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a > b,
                                (a, b) => a > b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => string.CompareOrdinal(a, b) > 0);
    }

     Visit(LessThanExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a < b,
                                (a, b) => a < b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => string.CompareOrdinal(a, b) < 0);
    }

     Visit(GreaterThanOrEqualsExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a >= b,
                                (a, b) => a >= b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => string.CompareOrdinal(a, b) >= 0);
    }

     Visit(LessThanOrEqualsExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => a <= b,
                                (a, b) => a <= b,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => string.CompareOrdinal(a, b) <= 0);
    }

     Visit(AndExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => a && b,
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(OrExpr expr, Scope scope)
    {
        return PerformOperation(expr.Left.Accept(this, scope),
                                expr.Right.Accept(this, scope),
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => a || b,
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(NotExpr expr, Scope scope)
    {
        return PerformOperation(new Value(true),
                                expr.Right.Accept(this, scope),
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => !b,
                                (a, b) => { throw new InvalidOperationException(); });
    }

     Visit(ConditionalExpr expr, Scope scope)
    {
        var condition = expr.Condition.Accept(this, scope);

        if(condition.Type != ValueType.Boolean)
            throw new InvalidCastException();

        if (condition.ToBoolean())
            return expr.ThenExpression.Accept(this, scope);

        return expr.ElseExpression.Accept(this, scope);
    }

     Visit(NegationExpr expr, Scope scope)
    {
        return PerformOperation(new Value(0), 
                                expr.Right.Accept(this, scope),
                                (a, b) => -b ,
                                (a, b) => -b ,
                                (a, b) => { throw new InvalidOperationException(); },
                                (a, b) => { throw new InvalidOperationException(); });
    }

    static ValueType PromoteToType(Value lhs, Value rhs)
    {
        var l = lhs.Type;
        var r = rhs.Type;

        if (lhs.IsNumericType() != rhs.IsNumericType())
            throw new InvalidCastException();

        if (lhs.IsNumericType() && rhs.IsNumericType())
        {
            if (l == ValueType.Float || r == ValueType.Float)
                return ValueType.Float;

            if (l == ValueType.Int || r == ValueType.Int)
                return ValueType.Int;

            throw new InvalidOperationException();
        }

        if (l == ValueType.String && r == ValueType.String)
            return ValueType.String;

        if (l == ValueType.Boolean && r == ValueType.Boolean)
            return ValueType.Boolean;

        throw new InvalidOperationException();
    }

    private static Value PerformOperation(Value lhs, Value rhs,
        Func<double, double, object> DoubleOp,
        Func<long, long, object> IntOp,
        Func<bool, bool, object> BoolOp,
        Func<string, string, object> StringOp)
    {
        var typeCode = PromoteToType(lhs, rhs);

        switch (typeCode)
        {
            case ValueType.Float:
                return Value.FromObject(DoubleOp(lhs.ToDouble(), rhs.ToDouble()));
            case ValueType.Int:
                return Value.FromObject(IntOp(lhs.ToInt(), rhs.ToInt()));
            case ValueType.Boolean:
                return Value.FromObject(BoolOp(lhs.ToBoolean(), rhs.ToBoolean()));
            case ValueType.String:
                return Value.FromObject(StringOp(lhs.ToString(), rhs.ToString()));
            default:
                throw new InvalidCastException();
        }
    }

     Visit(WhileStmt stmt, Scope scope)
    {
        while (stmt.Condition.Accept(this, scope).ToBoolean())
        {
            stmt.Block.Accept(this, scope);
        }

        return Value.Unit;
    }

     Visit(IfStmt stmt, Scope scope)
    {
        var condition = stmt.Condition.Accept(this, scope);

        if (condition.Type != ValueType.Boolean)
            throw new InvalidCastException();

        if (condition.ToBoolean())
            return stmt.ThenExpression.Accept(this, scope);
        
        return stmt.ElseExpression.Accept(this, scope);
    }

     Visit(ScopeBlockStmt stmt, Scope scope)
    {
        using (scope.PushScope())
        {
            foreach (var statement in stmt.Statements)
            {
                statement.Accept(this, scope);
            }
        }

        return Value.Unit;
    }

     Visit(NoOpStatement stmt, Scope scope)
    {
        return Value.Unit;;
    }

     Visit(DoWhileStmt stmt, Scope scope)
    {
        do
        {
            stmt.Block.Accept(this, scope);
        } while (stmt.Condition.Accept(this, scope).ToBoolean());

        return Value.Unit;;
    }

     Visit(FunctionDefinitionExpr expr, Scope scope)
    {
        var value = Value.FromObject(expr);
        scope.DefineIdentifier(expr.Name, value, value.Type.ToString());
        return new Value( expr );
    }

     Visit(ReturnStmt expr, Scope scope)
    {
        throw new ReturnStatementException(expr.ReturnExpression.Accept(this, scope));
    }

     Visit(VarDefinitionStmt stmt, Scope scope)
    {
        Value value = null;

        if(stmt.InitialValue != null)
            value = stmt.InitialValue.Accept(this, scope);

        scope.DefineIdentifier(stmt.Name.Name, value, stmt.Type.Name);
        return value;
    }

     Visit(FunctionCallExpr expr, Scope scope)
    {
        var function = scope.FindIdentifier(expr.FunctionName.Name);
        
        if(!function.IsDefined)
            throw new UndefinedIdentifierException("Undefined function " + expr.FunctionName.Name);

        if(!function.Value.IsFunction)
            throw new UndefinedIdentifierException("Identifier is not a function " + expr.FunctionName.Name);            

        var arguments = from argument in expr.Arguments
                        select argument.Accept(this, scope);

        return ExecuteFunction(scope, function.Value.ToFuntion(), arguments);
    }

    private Value ExecuteFunction(Scope scope, FunctionExpr func, IEnumerable<Value> arguments)
    {
        using (scope.PushArguments(func.Arguments, arguments.ToArray()))
        {
            return RunFunction((dynamic)func, scope);
        }
    }

    private Value RunFunction(FunctionDefinitionExpr func, Scope scope)
    {
        try
        {
            func.Body.Accept(this, scope);

            throw new ReturnStatementExpectedException("Function without a return statement encountered "  + func.Name);
        }
        catch (ReturnStatementException returnStatement)
        {
            return returnStatement.Value;
        }
    }

    private Value RunFunction(LambdaDefinitionExpr func, Scope scope)
    {
        return func.Body.Accept(this, scope);            
    }

     Visit(LambdaDefinitionExpr lambda, Scope scope)
    {
        var value = Value.FromObject(lambda);
        scope.DefineIdentifier(lambda.Name, value, value.Type.ToString());
        return value;
    }


     Visit(StatementList stmt, Scope scope)
    {
        // no new scope for a simple statement list.
        foreach (var statement in stmt.Statements)
        {
            statement.Accept(this, scope);
        }
        
        return Value.Unit;
    }


     Visit(ClassDefinitionStmt classDefinitionStmt, Scope context)
    {
        return Value.Unit;
    }
}
*/
}