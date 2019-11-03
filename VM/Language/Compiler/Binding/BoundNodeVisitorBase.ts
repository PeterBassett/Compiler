import * as Nodes from "./BoundNode";
import { IBoundNodeVisitor } from "./IBoundNodeVisitor";

export class BoundNodeVisitorBase implements IBoundNodeVisitor
{
    visit(node: Nodes.BoundGlobalScope): void {        
        node.variables.forEach(v => v.accept(this));        
        node.classes.forEach(c => c.accept(this));
        node.functions.forEach( f => f.accept(this));    
    }    
    
    visitBinaryExpression(node: Nodes.BoundBinaryExpression): void {
        
    }

    visitBoundUnaryExpression(node: Nodes.BoundUnaryExpression): void {
        throw new Error("Method not implemented.");
    }
    visitBoundBlockStatement(node: Nodes.BoundBlockStatement): void {
        throw new Error("Method not implemented.");
    }
    visitBoundLiteralExpression(node: Nodes.BoundLiteralExpression): void {
        throw new Error("Method not implemented.");
    }
    visitBoundFunctionDeclaration(node: Nodes.BoundFunctionDeclaration): void {
        throw new Error("Method not implemented.");
    }
    visitBoundVariableDeclaration(node: Nodes.BoundVariableDeclaration): void {
        throw new Error("Method not implemented.");
    }
    visitBoundIfStatement(node: Nodes.BoundIfStatement): void {
        throw new Error("Method not implemented.");
    }
    visitBoundExpressionStatement(node: Nodes.BoundExpressionStatement): void {
        throw new Error("Method not implemented.");
    }
    visitBoundReturnStatement(node: Nodes.BoundReturnStatement): void {
        throw new Error("Method not implemented.");
    }
    visitBoundForStatement(node: Nodes.BoundForStatement): void {
        throw new Error("Method not implemented.");
    }
    visitBoundWhileStatement(node: Nodes.BoundWhileStatement): void {
        throw new Error("Method not implemented.");
    }
    visitBoundVariableExpression(node: Nodes.BoundVariableExpression): void {
        throw new Error("Method not implemented.");
    }
    visitBoundCallExpression(node: Nodes.BoundCallExpression): void {
        throw new Error("Method not implemented.");
    }
    visitBoundAssignmentExpression(node: Nodes.BoundAssignmentExpression): void {
        throw new Error("Method not implemented.");
    }
    visitBoundClassDeclaration(node: Nodes.BoundClassDeclaration): void {
        throw new Error("Method not implemented.");
    }
    visitBoundErrorExpression(node: Nodes.BoundErrorExpression): void {
        throw new Error("Method not implemented.");
    }


}
