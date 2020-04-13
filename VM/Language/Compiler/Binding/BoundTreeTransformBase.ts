import * as Nodes from "./BoundNode";
import { isNonEmpty } from "../../../misc/NonEmptyArray";

export default class BoundTreeTransformBase
{
    protected _insideLoop : boolean = false; 
    protected _currentStatementList: Nodes.BoundStatement[][] = [];
    protected _currentVariableDeclarationList: Nodes.BoundVariableDeclaration[] = [];
    protected get currentStatementList() : Nodes.BoundStatement[]
    {
        return this._currentStatementList[this._currentStatementList.length - 1];
    }

    public transform(root : Nodes.BoundGlobalScope) : Nodes.BoundGlobalScope
    {
        this._currentStatementList = [];

        let newFuncs : boolean = false;
        const funcs = root.functions.map(f => {
            this._currentVariableDeclarationList = [];

            const newParameters = this.transformParameterDeclarations(f.parameters);            
            let newBody = this.transformBlockStatement(f.blockBody);

            if(newParameters === f.parameters && newBody === f.blockBody && this._currentVariableDeclarationList.length === 0)
                return f;

            newBody = new Nodes.BoundBlockStatement(
                [...this._currentVariableDeclarationList, ...newBody.statements]                
            );

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
                root.structs,
                funcs);
        }

        return root;
    }

    protected transformParameterDeclarations(parameters: Nodes.ParameterDeclaration[]) : Nodes.ParameterDeclaration[] 
    {
        let output : Nodes.ParameterDeclaration[] = [];
        let changesFound : boolean = false;

        output = parameters.map(p => {
            const newP = this.transformParameterDeclaration(p);

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
        const builder : Nodes.BoundStatement[] = [];
        const stack : Nodes.BoundStatement[] = [];
        
        stack.push(statement);

        while (stack.length > 0)
        {            
            if (isNonEmpty(stack)) {
                const current : Nodes.BoundStatement = stack.pop();

                if (current.kind === Nodes.BoundNodeKind.BlockStatement)
                {
                    const block = current as Nodes.BoundBlockStatement;
                    for(let i = block.statements.length - 1; i >= 0; i--)
                    {
                        stack.push(block.statements[i]);
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
        const transformedCondition = this.transformExpression(node.condition);
        const transformedTrueBranch = this.transformStatement(node.trueBranch);
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
        this._insideLoop = true;

        const condition = this.transformExpression(statement.condition);        
        const body = this.transformStatement(statement.body);

        if(condition != statement.condition ||
            body !== statement.body)
            return new Nodes.BoundWhileStatement(condition, body, statement.breakLabel, statement.continueLabel);

        this._insideLoop = false;        
        return statement;
    }

    protected transformBlockStatement(body: Nodes.BoundBlockStatement): Nodes.BoundBlockStatement {
        const statements : Nodes.BoundStatement[] = [];
        let newStatement : boolean = false;

        this.pushCurrentStatementList(statements);

        for(let s of body.statements)
        {
            const newS = this.transformStatement(s);

            statements.push(newS);

            if(newS !== s)
                newStatement = true;
        }
        
        this.popCurrentStatementList();

        if(newStatement)
            return new Nodes.BoundBlockStatement(statements);
        else
            return body;
    }
    
    pushCurrentStatementList(statements: Nodes.BoundStatement[]) {
        this._currentStatementList.push(statements);
    }

    popCurrentStatementList() {
        this._currentStatementList.pop();
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

    protected transformVariableDeclarationStatement(declaration: Nodes.BoundVariableDeclaration): Nodes.BoundStatement 
    {        
        if(declaration.initialiser)
        {
            const initialiser = this.transformExpression(declaration.initialiser);

            if(initialiser != declaration.initialiser)
                return new Nodes.BoundVariableDeclaration(declaration.variable, initialiser);
        }
        
        return declaration;
    }

    protected transformLabelStatement(statement: Nodes.BoundLabelStatement): Nodes.BoundStatement {    
        const label = this.transformLabel(statement.label);

        if(label !== statement.label)
            return new Nodes.BoundLabelStatement(label);

        return statement;
    }

    protected transformGotoStatement(statement: Nodes.BoundGotoStatement): Nodes.BoundStatement {
        const label = this.transformLabel(statement.label);

        if(label !== statement.label)
            return new Nodes.BoundGotoStatement(label);

        return statement;
    }

    protected transformLabel(label: Nodes.BoundLabel) {
        return label;
    }

    protected transformConditionalGotoStatement(statement: Nodes.BoundConditionalGotoStatement): Nodes.BoundStatement {
        const condition = this.transformExpression(statement.condition);
        const label = this.transformLabel(statement.label);

        if(condition !== statement.condition ||
            label !== statement.label)
            return new Nodes.BoundConditionalGotoStatement(label, condition, statement.jumpIfTrue);

        return statement;
    }
    
    protected transformForStatement(forStatement: Nodes.BoundForStatement): Nodes.BoundStatement {        
        this._insideLoop = true;

        const transformedLowerBound = this.transformExpression(forStatement.lowerBound);
        const transformedUpperBound = this.transformExpression(forStatement.upperBound);
        const transformedBody = this.transformStatement(forStatement.body);
                
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
        
        this._insideLoop = false;        
        return forStatement;
    }

    protected transformExpressionStatement(statement: Nodes.BoundExpressionStatement): Nodes.BoundStatement 
    {
        const expression = this.transformExpression(statement.expression);

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
    
    public transformExpression(expression: Nodes.BoundExpression) : Nodes.BoundExpression {
        switch(expression.kind)
        {
            case Nodes.BoundNodeKind.AssignmentStatement:
            {
                const expr = this.transformAssignmentExpression(expression as Nodes.BoundAssignmentStatement);
                return (expr !== expression) ? expr : expression;
            }                
            case Nodes.BoundNodeKind.BinaryExpression:
            {
                const expr = this.transformBinaryExpression(expression as Nodes.BoundBinaryExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.UnaryExpression:
            {
                const expr = this.transformUnaryExpression(expression as Nodes.BoundUnaryExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.CallExpression:
            {
                const expr = this.transformCallExpression(expression as Nodes.BoundCallExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.LiteralExpression:
            {
                const expr = this.transformLiteralExpression(expression as Nodes.BoundLiteralExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.VariableExpression:
            {
                const expr = this.transformVariableExpression(expression as Nodes.BoundVariableExpression);
                return (expr !== expression) ? expr : expression;
            }
            case Nodes.BoundNodeKind.ConversionExpression:
            {
                const expr = this.transformConversionExpression(expression as Nodes.BoundConversionExpression);
                return (expr !== expression) ? expr : expression;                
            }
            case Nodes.BoundNodeKind.GetExpression:
            {
                const expr = this.transformGetExpression(expression as Nodes.BoundGetExpression);
                return (expr !== expression) ? expr : expression;                
            }
            case Nodes.BoundNodeKind.DereferenceExpression:
            {
                const expr = this.transformDereferenceExpression(expression as Nodes.BoundDereferenceExpression);
                return (expr !== expression) ? expr : expression;                                
            }
            default:
                throw new Error(`Unhandled expression type ${expression.kind}`);
        }
    }    

    protected transformAssignmentExpression(expression: Nodes.BoundAssignmentStatement) : Nodes.BoundExpression {
        let target = this.transformExpression(expression.target);
        let exp = this.transformExpression(expression.expression);

        if(target !== expression.target ||
           exp !== expression.expression)
            return new Nodes.BoundAssignmentStatement(target, exp);

        return expression;
    }

    protected transformBinaryExpression(expression: Nodes.BoundBinaryExpression) : Nodes.BoundExpression
    {
        const left = this.transformExpression(expression.left);
        const right = this.transformExpression(expression.right);

        if(left !== expression.left ||
            right !== expression.right)
            return new Nodes.BoundBinaryExpression(left, expression.operator, right);

        return expression;
    }

    protected transformUnaryExpression(expression: Nodes.BoundUnaryExpression) : Nodes.BoundExpression {
        const operand = this.transformExpression(expression.operand);

        if(operand !== expression.operand)
            return new Nodes.BoundUnaryExpression(expression.operator, operand);

        return expression;
    }

    protected transformCallExpression(expression: Nodes.BoundCallExpression) : Nodes.BoundExpression {
        const callCargs = this.transformExpressions(expression.callArguments);

        if(callCargs !== expression.callArguments)
        {
            const callExpression = new Nodes.BoundCallExpression(expression.name, expression.returnType)
            callExpression.populate(expression.identifier, callCargs);
            return callExpression;
        }

        return expression;
    }

    protected transformExpressions(expressions: Nodes.BoundExpression[]) : Nodes.BoundExpression[]
    {
        let changesFound : boolean = false;

        const output = expressions.map(e => {
            const newE = this.transformExpression(e);

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

    protected transformConversionExpression(expression: Nodes.BoundConversionExpression) : Nodes.BoundExpression {
        return expression;
    }

    protected transformGetExpression(expression: Nodes.BoundGetExpression) : Nodes.BoundExpression {
        const left = this.transformExpression(expression.left);        

        if(left !== expression.left)
            return new Nodes.BoundGetExpression(left, expression.type, expression.member);

        return expression;
    }

    protected transformDereferenceExpression(expression: Nodes.BoundDereferenceExpression) : Nodes.BoundExpression 
    {
        const operand = this.transformExpression(expression.operand);        

        if(operand !== expression.operand)
            return new Nodes.BoundDereferenceExpression(operand, operand.type);

        return expression;
    }
}