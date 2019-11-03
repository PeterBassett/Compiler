import * as Nodes from "../Binding/BoundNode";
import { FunctionDeclarationStatementSyntax } from "../Syntax/AST/ASTNode";
import { Type } from "../../Types/TypeInformation";
import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { BoundBinaryOperator } from "../Binding/BoundNode";
import { SyntaxType } from "../Syntax/SyntaxType";
import { isNonEmpty } from "../../../misc/NonEmptyArray";
import { Identifier } from "../../Scope/DefinitionScope";
import BoundTreeTransformBase from "../Binding/BoundTreeTransformBase";
import { ValueType } from "../../Types/ValueType";

export default class ExpressionOptimiser extends BoundTreeTransformBase
{
    optimise(root : Nodes.BoundGlobalScope) : Nodes.BoundGlobalScope
    {
        return this.transform(root);
    }

    transformBinaryExpression(expression: Nodes.BoundBinaryExpression) : Nodes.BoundExpression
    {
        return this.simplyifyBinaryExpressionWithTwoLiterals(expression);
    }

    transformUnaryExpression(expression: Nodes.BoundUnaryExpression) : Nodes.BoundExpression
    {
        return this.simplyifyUnaryExpressionWithLiterals(expression);
    }

    simplyifyUnaryExpressionWithLiterals(expression: Nodes.BoundUnaryExpression) : Nodes.BoundExpression
    {
        function enforce(v:any, t:ValueType) : any {
            if(t == ValueType.Int && Math.floor(v) !== v)
                return Math.floor(v);

            return v;
        }

        let operandExpression = this.transformExpression(expression.operand);

        if(operandExpression.kind != Nodes.BoundNodeKind.LiteralExpression)
            return expression;

        let operand = operandExpression as Nodes.BoundLiteralExpression;
     
        switch(expression.operator.kind)
        {
            case Nodes.BoundUnaryOperatorKind.Identity:
                return expression;
            case Nodes.BoundUnaryOperatorKind.LogicalNegation:
                if(operand.type.type == ValueType.Boolean)            
                    return new Nodes.BoundLiteralExpression(!operand.value, PredefinedValueTypes.Boolean);
            case Nodes.BoundUnaryOperatorKind.Negation:
                if(operand.type.type == ValueType.Int || operand.type.type == ValueType.Float)
                    return new Nodes.BoundLiteralExpression(enforce(-operand.value, operand.type.type), operand.type);                
        }

        return expression;
    }

    simplyifyBinaryExpressionWithTwoLiterals(expression: Nodes.BoundBinaryExpression) : Nodes.BoundExpression
    {
        function enforce(v:any, t:ValueType) : any {
            if(t == ValueType.Int && Math.floor(v) !== v)
                return Math.floor(v);

            return v;
        }

        let leftExpression = this.transformExpression(expression.left);
        let rightExpression = this.transformExpression(expression.right);

        if(leftExpression.kind != Nodes.BoundNodeKind.LiteralExpression || 
            rightExpression.kind != Nodes.BoundNodeKind.LiteralExpression)
            return expression;

        let left = leftExpression as Nodes.BoundLiteralExpression;
        let right = rightExpression as Nodes.BoundLiteralExpression;

        if(right.type.type != right.type.type)
            return expression;
     
        if(left.type.type == ValueType.Int ||
            left.type.type == ValueType.Float)
        {
            switch(expression.operator.operatorKind)
            {
                case Nodes.BoundBinaryOperatorKind.Addition:
                    return new Nodes.BoundLiteralExpression(enforce(left.value + right.value, left.type.type), left.type);
                case Nodes.BoundBinaryOperatorKind.Subtraction:
                    return new Nodes.BoundLiteralExpression(enforce(left.value - right.value, left.type.type), left.type);
                case Nodes.BoundBinaryOperatorKind.Multiplication:
                    return new Nodes.BoundLiteralExpression(enforce(left.value * right.value, left.type.type), left.type);                
                case Nodes.BoundBinaryOperatorKind.Division:
                    return new Nodes.BoundLiteralExpression(enforce(left.value / right.value, left.type.type), left.type);           
            }
        }

        if(left.type.type == ValueType.String && 
            expression.operator.operatorKind == Nodes.BoundBinaryOperatorKind.Addition)
            return new Nodes.BoundLiteralExpression(left.value + right.value, left.type);        
        
        if(left.type.type == ValueType.Int ||
            left.type.type == ValueType.Float ||
            left.type.type == ValueType.Boolean ||
            left.type.type == ValueType.String)
        {
            switch(expression.operator.operatorKind)
            {        
                case Nodes.BoundBinaryOperatorKind.Equals:
                    return new Nodes.BoundLiteralExpression(left.value === right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.NotEquals:
                    return new Nodes.BoundLiteralExpression(left.value !== right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.GreaterThan:
                    return new Nodes.BoundLiteralExpression(left.value > right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.GreaterThan:
                    return new Nodes.BoundLiteralExpression(left.value > right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.GreaterThan:
                    return new Nodes.BoundLiteralExpression(left.value > right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.LessThan:
                    return new Nodes.BoundLiteralExpression(left.value < right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.GreaterThanOrEquals:
                    return new Nodes.BoundLiteralExpression(left.value >= right.value, PredefinedValueTypes.Boolean);
                case Nodes.BoundBinaryOperatorKind.LessThanOrEquals:
                    return new Nodes.BoundLiteralExpression(left.value <= right.value, PredefinedValueTypes.Boolean);
                default:
                    return expression;
            }        
        }        

        return expression;
    }
}