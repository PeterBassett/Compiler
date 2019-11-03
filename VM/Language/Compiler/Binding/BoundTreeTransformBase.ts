import * as Nodes from "./BoundNode";
import { FunctionDeclarationStatementSyntax } from "../Syntax/AST/ASTNode";
import { Type } from "../../Types/TypeInformation";
import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { BoundBinaryOperator } from "./BoundNode";
import { SyntaxType } from "../Syntax/SyntaxType";
import { isNonEmpty } from "../../../misc/NonEmptyArray";
import { Identifier } from "../../Scope/DefinitionScope";

export default class BoundTreeTransformBase
{
    public transform(root : Nodes.BoundGlobalScope) : Nodes.BoundGlobalScope
    {
        let newFuncs : boolean = false;
        let funcs = root.functions.map(f => {
            let newParameters = this.transformParameterDeclarations(f.parameters);            
            let newBody = this.transformBlockStatement(f.blockBody);

            if(newParameters === f.parameters && newBody === f.blockBody)
                return f;
 
            newBody = this.flatten(newBody);
        
            let func = new Nodes.BoundFunctionDeclaration(
                f.identifier,
                f.parameters,
                f.returnType,
                newBody);

            newFuncs = true;
            return func;
        });

        if(newFuncs)
        {
            return new Nodes.BoundGlobalScope(
                root.diagnostics,
                root.variables,
                root.classes,
                funcs);
        }

        /// do more here
        return root;
    }

    protected transformParameterDeclarations(parameters: Nodes.ParameterDeclaration[]) : Nodes.ParameterDeclaration[] 
    {
        let output : Nodes.ParameterDeclaration[] = [];
        let changesFound : boolean = false;

        output = parameters.map(p => {
            let newP = this.transformParameterDeclaration(p);

            if(newP === p)
                return p;
            
            changesFound = true;
            return newP;
        });

        if(changesFound)
            return output;
        else
            return parameters;
    }

    protected transformParameterDeclaration(p: Nodes.ParameterDeclaration) : Nodes.ParameterDeclaration 
    {
        return p;
    }

    private flatten(statement : Nodes.BoundStatement) : Nodes.BoundBlockStatement
    {
        let builder : Nodes.BoundStatement[] = [];
        let stack : Nodes.BoundStatement[] = [];
        
        stack.push(statement);

        while (stack.length > 0)
        {            
            if (isNonEmpty(stack)) {
                let current : Nodes.BoundStatement = stack.pop();

                if (current.kind === Nodes.BoundNodeKind.BlockStatement)
                {
                    let block = current as Nodes.BoundBlockStatement;
                    for(let i = block.statements.length - 1; i >= 0; i--)
                    {
                        let s = block.statements[i];
                        stack.push(s);
                    }
                }
                else
                {
                    builder.push(current);
                }
            }
        }

        return new Nodes.BoundBlockStatement(builder);
    }

    protected transformIfStatement(node : Nodes.BoundIfStatement) : Nodes.BoundStatement
    {
        let transformedCondition = this.transformExpression(node.condition);
        let transformedTrueBranch = this.transformStatement(node.trueBranch);
        let transformedFalseBranch : Nodes.BoundStatement | null = null;
        
        if(!!node.falseBranch)
            transformedFalseBranch = this.transformStatement(node.falseBranch);


        if(transformedCondition !== node.condition ||
            transformedTrueBranch !== node.trueBranch ||
            transformedFalseBranch !== node.falseBranch )
            return new Nodes.BoundIfStatement(transformedCondition, transformedTrueBranch, transformedFalseBranch);
            
        return node;
    }

    protected transformWhileStatement(statement: Nodes.BoundWhileStatement): Nodes.BoundStatement 
    {
        let condition = this.transformExpression(statement.condition);
        let body = this.transformStatement(statement.body);

        if(condition != statement.condition ||
            body !== statement.body)
            return new Nodes.BoundWhileStatement(condition, body, statement.breakLabel, statement.continueLabel);

        return statement;
    }

    protected transformBlockStatement(body: Nodes.BoundBlockStatement): Nodes.BoundBlockStatement {
        let statements : Nodes.BoundStatement[] = [];
        let newStatement : boolean = false;

        statements = body.statements.map(s => {
            let newS = this.transformStatement(s);

            if(newS === s)
                return s;
            
            newStatement = true;
            return newS;
        });

        if(newStatement)
            return new Nodes.BoundBlockStatement(statements);
        else
            return body;
    }

    protected transformStatement(statement: Nodes.BoundStatement): Nodes.BoundStatement {
        switch(statement.kind)
        {
            case Nodes.BoundNodeKind.BlockStatement:
                return this.transformBlockStatement(statement as Nodes.BoundBlockStatement);
            case Nodes.BoundNodeKind.VariableDeclaration:
                return this.transformVariableDeclarationStatement(statement as Nodes.BoundVariableDeclaration);
            case Nodes.BoundNodeKind.ForStatement:
                return this.transformForStatement(statement as Nodes.BoundForStatement);
            case Nodes.BoundNodeKind.ExpressionStatement:
                return this.transformExpressionStatement(statement as Nodes.BoundExpressionStatement);
            case Nodes.BoundNodeKind.IfStatement:
                return this.transformIfStatement(statement as Nodes.BoundIfStatement);
            case Nodes.BoundNodeKind.IfStatement:
                    return this.transformIfStatement(statement as Nodes.BoundIfStatement);
            case Nodes.BoundNodeKind.ReturnStatement:
                return this.transformReturnStatement(statement as Nodes.BoundReturnStatement);
            case Nodes.BoundNodeKind.WhileStatement:
                return this.transformWhileStatement(statement as Nodes.BoundWhileStatement);            
            case Nodes.BoundNodeKind.ConditionalGotoStatement:
                return this.transformConditionalGotoStatement(statement as Nodes.BoundConditionalGotoStatement);
            case Nodes.BoundNodeKind.GotoStatement:
                return this.transformGotoStatement(statement as Nodes.BoundGotoStatement);
            case Nodes.BoundNodeKind.LabelStatement:
                return this.transformLabelStatement(statement as Nodes.BoundLabelStatement);

            default:
                return statement;
        }
    }

    protected transformVariableDeclarationStatement(declaration: Nodes.BoundVariableDeclaration): Nodes.BoundStatement {
        let initialiser = this.transformExpression(declaration.initialiser);

        if(initialiser != declaration.initialiser)
            return new Nodes.BoundVariableDeclaration(declaration.variable, initialiser);

        return declaration;
    }

    protected transformLabelStatement(statement: Nodes.BoundLabelStatement): Nodes.BoundStatement {    
        let label = this.transformLabel(statement.label);

        if(label !== statement.label)
            return new Nodes.BoundLabelStatement(label);

        return statement;
    }

    protected transformGotoStatement(statement: Nodes.BoundGotoStatement): Nodes.BoundStatement {
        let label = this.transformLabel(statement.label);

        if(label !== statement.label)
            return new Nodes.BoundGotoStatement(label);

        return statement;
    }

    protected transformLabel(label: Nodes.BoundLabel) {
        return label;
    }

    protected transformConditionalGotoStatement(statement: Nodes.BoundConditionalGotoStatement): Nodes.BoundStatement {
        let condition = this.transformExpression(statement.condition);
        let label = this.transformLabel(statement.label);

        if(condition !== statement.condition ||
            label !== statement.label)
            return new Nodes.BoundConditionalGotoStatement(label, condition, statement.jumpIfTrue);

        return statement;
    }
    
    protected transformForStatement(forStatement: Nodes.BoundForStatement): Nodes.BoundStatement {        
        let transformedLowerBound = this.transformExpression(forStatement.lowerBound);
        let transformedUpperBound = this.transformExpression(forStatement.upperBound);
        let transformedBody = this.transformStatement(forStatement.body);
                
        if(transformedLowerBound !== forStatement.lowerBound ||
            transformedUpperBound !== forStatement.upperBound ||
            transformedBody !== forStatement.body )
            return new Nodes.BoundForStatement(
                forStatement.variable,
                transformedLowerBound,
                transformedUpperBound,
                transformedBody,
                forStatement.breakLabel,
                forStatement.continueLabel
            );
            
        return forStatement;
    }

    protected transformExpressionStatement(statement: Nodes.BoundExpressionStatement): Nodes.BoundStatement 
    {
        let expression = this.transformExpression(statement.expression);

        if(expression !== statement.expression)
            return new Nodes.BoundExpressionStatement(expression);

        return statement;
    }

    protected transformReturnStatement(statement: Nodes.BoundReturnStatement): Nodes.BoundStatement 
    {
        let expression :Nodes.BoundExpression | null = null;
        
        if(statement.expression)
            expression = this.transformExpression(statement.expression);

        if(expression !== statement.expression)
            return new Nodes.BoundReturnStatement(expression, statement.span);

        return statement;
    }
    
    protected transformExpression(expression: Nodes.BoundExpression) : Nodes.BoundExpression {
        switch(expression.kind)
        {
            case Nodes.BoundNodeKind.AssignmentExpression:
            {
                let expr = this.transformAssignmentExpression(expression as Nodes.BoundAssignmentExpression);
                return (expr !== expression) ? expr : expression;
            }                
            case Nodes.BoundNodeKind.BinaryExpression:
            {
                let expr = this.transformBinaryExpression(expression as Nodes.BoundBinaryExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.UnaryExpression:
            {
                let expr = this.transformUnaryExpression(expression as Nodes.BoundUnaryExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.CallExpression:
            {
                let expr = this.transformCallExpression(expression as Nodes.BoundCallExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.LiteralExpression:
            {
                let expr = this.transformLiteralExpression(expression as Nodes.BoundLiteralExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.VariableExpression:
            {
                let expr = this.transformVariableExpression(expression as Nodes.BoundVariableExpression);
                return (expr !== expression) ? expr : expression;
            }                            
            default:
                throw new Error(`Unhandled expression type ${expression.kind}`);
        }
    }    

    protected transformAssignmentExpression(expression: Nodes.BoundAssignmentExpression) : Nodes.BoundExpression {
        let exp = this.transformExpression(expression.expression);

        if(exp !== expression.expression)
            return new Nodes.BoundAssignmentExpression(expression.identifier, exp);

        return expression;
    }

    protected transformBinaryExpression(expression: Nodes.BoundBinaryExpression) : Nodes.BoundExpression
    {
        let left = this.transformExpression(expression.left);
        let right = this.transformExpression(expression.right);

        if(left !== expression.left ||
            right !== expression.right)
            return new Nodes.BoundBinaryExpression(left, expression.operator, right);

        return expression;
    }

    protected transformUnaryExpression(expression: Nodes.BoundUnaryExpression) : Nodes.BoundExpression {
        let operand = this.transformExpression(expression.operand);

        if(operand !== expression.operand)
            return new Nodes.BoundUnaryExpression(expression.operator, operand);

        return expression;
    }

    protected transformCallExpression(expression: Nodes.BoundCallExpression) : Nodes.BoundExpression {
        let callCargs = this.transformExpressions(expression.callArguments);

        if(callCargs !== expression.callArguments)
        {
            let callExpression = new Nodes.BoundCallExpression(expression.name, expression.returnType)
            callExpression.populate(expression.identifier, callCargs);
            return callExpression;
        }

        return expression;
    }

    protected transformExpressions(expressions: Nodes.BoundExpression[]) : Nodes.BoundExpression[]
    {
        let output : Nodes.BoundExpression[] = [];
        let changesFound : boolean = false;

        output = expressions.map(e => {
            let newE = this.transformExpression(e);

            if(newE === e)
                return e;
            
            changesFound = true;
            return newE;
        });

        if(changesFound)
            return output;
        else
            return expressions;        
    }

    protected transformLiteralExpression(expression: Nodes.BoundLiteralExpression) : Nodes.BoundExpression {
        return expression;
    }

    protected transformVariableExpression(expression: Nodes.BoundVariableExpression) : Nodes.BoundVariableExpression {
        return expression;
    }
}