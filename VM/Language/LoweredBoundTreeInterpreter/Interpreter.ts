import * as Nodes from "../Compiler/Binding/BoundNode";
import { Value } from "../Scope/ExecutionScope";
import { ValueType } from "../Types/ValueType";
import { PredefinedValueTypes } from "../Types/PredefinedValueTypes";
import { Identifier } from "../Scope/DefinitionScope";
import Stack from "../../misc/Stack";

export default class Evaluator
{
    private _locals : Stack< { [index:string] : Value } >;
    private _globals : { [index:string] : Value } = {};
    private _lastValue : Value;
    private _program! : Nodes.BoundGlobalScope;
    
    constructor()
    {
        this._lastValue = Value.Unit;
        this._globals = {};
        this._locals = new Stack< { [index:string] : Value } >();
    }

    public Execute(root : Nodes.BoundGlobalScope) : Value 
    {
        this._program = root;

        let decs : any[] = [];

        for (const variable of root.variables) {            
            let value = this.EvaluateExpression(variable.initialiser);
            this._globals[variable.variable.name] = value;
        }

        let main = root.functions.filter( v => v.identifier == "main")[0];
        let call = new Nodes.BoundCallExpression(main.identifier, main.returnType);
        call.populate(new Identifier(main.identifier, main.returnType), []);
        return this.EvaluateCallExpression(call);
    }

    private EvaluateStatement(body : Nodes.BoundBlockStatement) : Value
    {
        var labelToIndex : { [index: number] : number } = {};

        for (var i = 0; i < body.statements.length; i++)
        {
            if (body.statements[i].kind === Nodes.BoundNodeKind.LabelStatement)
            {
                let l = body.statements[i] as Nodes.BoundLabelStatement;

                labelToIndex[l.label.id] = i + 1;
            }
        }

        var index = 0;

        while (index < body.statements.length)
        {
            var s = body.statements[index];

            switch (s.kind)
            {
                case Nodes.BoundNodeKind.VariableDeclaration:
                    this.EvaluateVariableDeclaration(s as Nodes.BoundVariableDeclaration);
                    index++;
                    break;
                case Nodes.BoundNodeKind.ExpressionStatement:
                    this.EvaluateExpressionStatement(s as Nodes.BoundExpressionStatement);
                    index++;
                    break;
                case Nodes.BoundNodeKind.AssignmentStatement:
                    this.EvaluateAssignmentStatement(s as Nodes.BoundAssignmentStatement);
                    index++;
                    break;                    
                case Nodes.BoundNodeKind.GotoStatement:
                    var gs = s as Nodes.BoundGotoStatement;
                    index = labelToIndex[gs.label.id];
                    break;
                case Nodes.BoundNodeKind.ConditionalGotoStatement:
                    var cgs = s as Nodes.BoundConditionalGotoStatement;
                    var condition = this.EvaluateExpression(cgs.condition).ToBoolean();
                    if (condition == cgs.jumpIfTrue)
                        index = labelToIndex[cgs.label.id];
                    else
                        index++;
                    break;
                case Nodes.BoundNodeKind.LabelStatement:
                    index++;
                    break;
                case Nodes.BoundNodeKind.ReturnStatement:
                    var rs = s as Nodes.BoundReturnStatement;
                    this._lastValue = rs.expression == null ? Value.Unit : this.EvaluateExpression(rs.expression);
                    return this._lastValue;                    
                default:
                    throw new Error(`Unexpected node {s.kind}`);
            }
        }

        return this._lastValue;
    }

    private EvaluateVariableDeclaration(node : Nodes.BoundVariableDeclaration) : void
    {
        var value = this.EvaluateExpression(node.initialiser);
        this._lastValue = value;
        this.Assign(node.variable, value);
    }

    private Assign(variable: Nodes.VariableSymbol, value : Value) : void
    {
        if (variable.isGlobal)
        {
            this._globals[variable.name] = value;
        }
        else
        {
            var locals = this._locals.peek();
            locals[variable.name] = value;
        }
    }

    private EvaluateExpressionStatement(node : Nodes.BoundExpressionStatement) : void
    {
        this._lastValue = this.EvaluateExpression(node.expression);
    }

    private EvaluateExpression(node : Nodes.BoundExpression) : Value
    {
        switch (node.kind)
        {
            case Nodes.BoundNodeKind.LiteralExpression:
                return this.EvaluateLiteralExpression(node as Nodes.BoundLiteralExpression);
            case Nodes.BoundNodeKind.VariableExpression:
                return this.EvaluateVariableExpression(node as Nodes.BoundVariableExpression);
            case Nodes.BoundNodeKind.UnaryExpression:
                return this.EvaluateUnaryExpression(node as Nodes.BoundUnaryExpression);
            case Nodes.BoundNodeKind.BinaryExpression:
                return this.EvaluateBinaryExpression(node as Nodes.BoundBinaryExpression);
            case Nodes.BoundNodeKind.CallExpression:
                return this.EvaluateCallExpression(node as Nodes.BoundCallExpression);
            //case Nodes.BoundNodeKind.ConversionExpression:
              //  return this.EvaluateConversionExpression(node as Nodes.BoundConversionExpression);
            default:
                throw new Error(`Unexpected node {node.kind}`);
        }
    }

    private EvaluateLiteralExpression(n : Nodes.BoundLiteralExpression) : Value
    {
        return new Value(n.type.type, n.value);
    }

    private EvaluateVariableExpression(v : Nodes.BoundVariableExpression) : Value
    {
        let isGlobal = v.variable.variable && v.variable.variable.isGlobal || false;

        if (isGlobal)
        {
            return this._globals[v.variable.name];
        }
        else
        {
            var locals = this._locals.peek();
            return locals[v.variable.name];
        }
    }

    private EvaluateAssignmentStatement(a : Nodes.BoundAssignmentStatement) : Value
    {
        var value = this.EvaluateExpression(a.expression);

        let isGlobal = a.identifier.variable && a.identifier.variable.isGlobal || false;

        if (isGlobal)
        {
            this._globals[a.identifier.name] = value;
        }
        else
        {
            var locals = this._locals.peek();
            locals[a.identifier.name] = value;
        }
        
        return value;
    }

    private EvaluateUnaryExpression(u : Nodes.BoundUnaryExpression) : Value
    {
        var operand = this.EvaluateExpression(u.operand);

        switch (u.operator.operatorKind)
        {
            case Nodes.BoundUnaryOperatorKind.Identity:
                return operand;
            case Nodes.BoundUnaryOperatorKind.Negation:
                if(u.type.type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Int, -operand.ToInt());
                else if(u.type.type == PredefinedValueTypes.Float.type)
                    return new Value(ValueType.Float, -operand.ToFloat());
                else
                    throw new Error(`Invalid Type For unary Operator${u.operator}`);

            case Nodes.BoundUnaryOperatorKind.LogicalNegation:
                return new Value(ValueType.Boolean, !operand.ToBoolean());             
            default:
                throw new Error(`Unexpected unary operator {u.operator}`);
        }
    }

    private EvaluateBinaryExpression(b : Nodes.BoundBinaryExpression) : Value
    {
        var left = this.EvaluateExpression(b.left);
        var right = this.EvaluateExpression(b.right);

        switch (b.operator.operatorKind)
        {
            case Nodes.BoundBinaryOperatorKind.Addition:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Int, left.ToInt() + right.ToInt());
                else if (left.Type == PredefinedValueTypes.Float.type)
                    return new Value(ValueType.Float, left.ToInt() + right.ToInt());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.String, left.toString() + right.toString());                    
                else
                    throw new Error("Unexpected Type");
            case Nodes.BoundBinaryOperatorKind.Subtraction:
                return new Value(ValueType.Int, left.ToInt() - right.ToInt());
            case Nodes.BoundBinaryOperatorKind.Multiplication:
                return new Value(ValueType.Int, left.ToInt() * right.ToInt());                
            case Nodes.BoundBinaryOperatorKind.Division:
                return new Value(ValueType.Int, left.ToInt() / right.ToInt());
            case Nodes.BoundBinaryOperatorKind.BitwiseAnd:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Int, left.ToInt() & right.ToInt());    
                else
                    throw new Error("Unexpected Type");
            case Nodes.BoundBinaryOperatorKind.BitwiseOr:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Int, left.ToInt() | right.ToInt());    
                else
                    throw new Error("Unexpected Type");
            case Nodes.BoundBinaryOperatorKind.BitwiseXor:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Int, left.ToInt() ^ right.ToInt());    
                else
                    throw new Error("Unexpected Type");
            case Nodes.BoundBinaryOperatorKind.LogicalAnd:
                if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() && right.ToBoolean());    
                else
                    throw new Error("Unexpected Type");
            case Nodes.BoundBinaryOperatorKind.LogicalOr:
                if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() || right.ToBoolean());    
                else
                    throw new Error("Unexpected Type");
            case Nodes.BoundBinaryOperatorKind.Equals:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Boolean, left.ToInt() === right.ToInt());    
                else if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() === right.ToBoolean());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.Boolean, left.toString() === right.toString());
                else
                    return new Value(ValueType.Int, left.ToBoolean() === right.ToBoolean());
            case Nodes.BoundBinaryOperatorKind.NotEquals:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Boolean, left.ToInt() !== right.ToInt());    
                else if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() !== right.ToBoolean());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.Boolean, left.toString() !== right.toString());
                else
                    return new Value(ValueType.Int, left.ToBoolean() !== right.ToBoolean());
            case Nodes.BoundBinaryOperatorKind.LessThan:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Boolean, left.ToInt() < right.ToInt());    
                else if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() < right.ToBoolean());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.Boolean, left.toString() < right.toString());
                else
                    return new Value(ValueType.Int, left.ToBoolean() < right.ToBoolean());
            case Nodes.BoundBinaryOperatorKind.LessThanOrEquals:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Boolean, left.ToInt() <= right.ToInt());    
                else if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() <= right.ToBoolean());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.Boolean, left.toString() <= right.toString());
                else
                    return new Value(ValueType.Int, left.ToBoolean() <= right.ToBoolean());
            case Nodes.BoundBinaryOperatorKind.GreaterThan:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Boolean, left.ToInt() > right.ToInt());    
                else if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() > right.ToBoolean());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.Boolean, left.toString() > right.toString());
                else
                    return new Value(ValueType.Int, left.ToBoolean() > right.ToBoolean());
            case Nodes.BoundBinaryOperatorKind.GreaterThanOrEquals:
                if (left.Type == PredefinedValueTypes.Integer.type)
                    return new Value(ValueType.Boolean, left.ToInt() >= right.ToInt());    
                else if (left.Type == PredefinedValueTypes.Boolean.type)
                    return new Value(ValueType.Boolean, left.ToBoolean() >= right.ToBoolean());
                else if (left.Type == PredefinedValueTypes.String.type)
                    return new Value(ValueType.Boolean, left.toString() >= right.toString());
                else
                    return new Value(ValueType.Int, left.ToBoolean() >= right.ToBoolean());
            default:
                throw new Error(`Unexpected binary operator {b.operator}`);
        }
    }

    private EvaluateCallExpression(node : Nodes.BoundCallExpression) : Value
    {
        let func = this._program.functionMap[node.identifier.name];
        let locals : { [index:string] : Value } = {};
        for (let i = 0; i < node.callArguments.length; i++)
        {
            var parameter = func.parameters[i];
            var value = this.EvaluateExpression(node.callArguments[i]);
            locals[parameter.name] = value;
        }

        this._locals.push(locals);

        var result = this.EvaluateStatement(func.blockBody);

        this._locals.pop();

        return result;
    }

    private EvaluateConversionExpression(node : Nodes.BoundConversionExpression) : Value
    {
        var value = this.EvaluateExpression(node.expression);
        if (node.type == PredefinedValueTypes.Boolean)
            return new Value(ValueType.Boolean, value.ToBoolean());
        else if (node.type == PredefinedValueTypes.Integer)
            return new Value(ValueType.Int, value.ToInt());
        else if (node.type == PredefinedValueTypes.String)
            return new Value(ValueType.String, value.toString());
        else
            throw new Error(`Unexpected type ${node.type}`);
    }
}