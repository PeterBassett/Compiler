import * as Nodes from "../Binding/BoundNode";
import { FunctionDeclarationStatementSyntax } from "../Syntax/AST/ASTNode";
import { Type } from "../../Types/TypeInformation";
import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { BoundBinaryOperator } from "../Binding/BoundNode";
import { SyntaxType } from "../Syntax/SyntaxType";
import { isNonEmpty } from "../../../misc/NonEmptyArray";
import { Identifier } from "../../Scope/DefinitionScope";
import BoundTreeTransformBase from "../Binding/BoundTreeTransformBase";

export default class Lowerer extends BoundTreeTransformBase
{
    lower(root : Nodes.BoundGlobalScope) : Nodes.BoundGlobalScope
    {
        return this.transform(root);
    }

    private _labelCount : number = 0;
    private generateLabel() : Nodes.BoundLabel
    {
        const name = `Label${++this._labelCount}`;
        return new Nodes.BoundLabel(name);
    }

    private _variableCount : number = 0;
    private generateVariable(name : string) : string
    {
        return `${name}${++this._variableCount}`;
    }

    transformIfStatement(node : Nodes.BoundIfStatement) : Nodes.BoundStatement
    {
        if (node.falseBranch == null)
        {
            // if <condition>
            //      <then>
            //
            // ---->
            //
            // gotoFalse <condition> end
            // <then>
            // end:
            const endLabel = this.generateLabel();
            const gotoFalse = new Nodes.BoundConditionalGotoStatement(endLabel, node.condition, false);
            const endLabelStatement = new Nodes.BoundLabelStatement(endLabel);
            const result = new Nodes.BoundBlockStatement([gotoFalse, node.trueBranch, endLabelStatement]);
            
            return this.transformStatement(result);
        }
        else
        {
            // if <condition>
            //      <then>
            // else
            //      <else>
            //
            // ---->
            //
            // gotoFalse <condition> else
            // <then>
            // goto end
            // else:
            // <else>
            // end:

            const elseLabel = this.generateLabel();
            const endLabel = this.generateLabel();

            const gotoFalse = new Nodes.BoundConditionalGotoStatement(elseLabel, node.condition, false);
            const gotoEndStatement = new Nodes.BoundGotoStatement(endLabel);
            const elseLabelStatement = new Nodes.BoundLabelStatement(elseLabel);
            const endLabelStatement = new Nodes.BoundLabelStatement(endLabel);
            const result = new Nodes.BoundBlockStatement([
                gotoFalse,
                node.trueBranch,
                gotoEndStatement,
                elseLabelStatement,
                node.falseBranch,
                endLabelStatement
            ]);

            return this.transformStatement(result);
        }
    }

    transformWhileStatement(node: Nodes.BoundWhileStatement) : Nodes.BoundStatement
    {
        // while <condition>
        //      <body>
        //
        // ----->
        //
        // goto continue
        // body:
        // <body>
        // continue:
        // gotoTrue <condition> body
        // break:

        const bodyLabel = this.generateLabel();

        const gotoContinue = new Nodes.BoundGotoStatement(node.continueLabel);
        const bodyLabelStatement = new Nodes.BoundLabelStatement(bodyLabel);
        const continueLabelStatement = new Nodes.BoundLabelStatement(node.continueLabel);
        const gotoTrue = new Nodes.BoundConditionalGotoStatement(bodyLabel, node.condition);
        const breakLabelStatement = new Nodes.BoundLabelStatement(node.breakLabel);

        const result = new Nodes.BoundBlockStatement([
            gotoContinue,
            bodyLabelStatement,
            node.body,
            continueLabelStatement,
            gotoTrue,
            breakLabelStatement
        ]);

        return this.transformStatement(result);
    }

    transformForStatement(forStatement: Nodes.BoundForStatement): Nodes.BoundStatement {        
         // for <var> = <lower> to <upper>
        //      <body>
        //
        // ---->
        //
        // {
        //      let <var> = <lower>
        //      let upperBound = <upper>
        //      while (<var> <= upperBound)
        //      {
        //          <body>
        //          continue:
        //          <var> = <var> + 1
        //      }
        // }

        const loopVariable = new Identifier(forStatement.variable.name, forStatement.variable.type, forStatement.variable);
        const variableDeclaration = new Nodes.BoundVariableDeclaration(loopVariable.variable!, forStatement.lowerBound);
        const varianleInitStatement = new Nodes.BoundAssignmentStatement(loopVariable, forStatement.lowerBound);
        const variableExpression = new Nodes.BoundVariableExpression(loopVariable);
        const upperboundSymbolName = this.generateVariable("upperBound");
        const upperBoundSymbol = new Nodes.VariableSymbol(upperboundSymbolName, true, PredefinedValueTypes.Integer, false);
        const upperBoundDeclaration = new Nodes.BoundVariableDeclaration(upperBoundSymbol, forStatement.upperBound);

        const condition = new Nodes.BoundBinaryExpression(
            variableExpression,
            BoundBinaryOperator.Bind(SyntaxType.LessThanOrEqual, PredefinedValueTypes.Integer, PredefinedValueTypes.Integer)!,
            new Nodes.BoundVariableExpression(new Identifier(upperBoundSymbol.name, upperBoundSymbol.type, upperBoundSymbol))
        );

        const continueLabelStatement = new Nodes.BoundLabelStatement(forStatement.continueLabel);
        const increment = new Nodes.BoundAssignmentStatement(
            new Identifier(forStatement.variable.name, forStatement.variable.type, forStatement.variable),
            new Nodes.BoundBinaryExpression(
                variableExpression,
                BoundBinaryOperator.Bind(SyntaxType.Plus, PredefinedValueTypes.Integer, PredefinedValueTypes.Integer)!,
                new Nodes.BoundLiteralExpression(1, PredefinedValueTypes.Integer)
            )            
        );

        const whileBody = new Nodes.BoundBlockStatement(
            [
                forStatement.body,
                continueLabelStatement,
                increment
            ]
        );

        const whileStatement = new Nodes.BoundWhileStatement(condition, whileBody, forStatement.breakLabel, this.generateLabel());

        const result = new Nodes.BoundBlockStatement(
            [
                variableDeclaration,
                varianleInitStatement,
                upperBoundDeclaration,
                whileStatement
            ]
        );

        return this.transformBlockStatement(result);
    }    

    transformGetExpression(expression: Nodes.BoundGetExpression) : Nodes.BoundExpression {
        // if we are performing a get from a function call return value
        if(expression.left.kind === Nodes.BoundNodeKind.CallExpression)
            return this.transformGetExpressionOnCall(expression);
            
        const left = this.transformExpression(expression.left);        

        if(left !== expression.left)
            return new Nodes.BoundGetExpression(left, expression.type, expression.member);

        return expression;
    }

    transformGetExpressionOnCall(expression: Nodes.BoundGetExpression): Nodes.BoundExpression {
        // get expression directly off a call expression.
        // lets introduce a temporary variable to make things simpler
        // in the code generator. An explicit variable declaration
        // means we dont have to deal with this mechanisim as it will be 
        // dealt with in existing code.
        const statements = this.currentStatementList;

        const callExpression = expression.left as Nodes.BoundCallExpression;
        const functionName = callExpression.name;

        // double underscores are reserved in this language. As of now.
        const temporaryName = `__${functionName}_${callExpression.id}`;
        const variableSymbol = new Nodes.VariableSymbol(temporaryName, false, callExpression.returnType, false, false);        
        const variable = new Identifier(temporaryName, callExpression.returnType, variableSymbol);

        const variableDeclaration = new Nodes.BoundVariableDeclaration(variableSymbol, callExpression);

        statements.push(variableDeclaration);

        const variableExpression = new Nodes.BoundVariableExpression(variable);
        
        const getExpression = new Nodes.BoundGetExpression(variableExpression, expression.type, expression.member);

        return getExpression;
    }
}