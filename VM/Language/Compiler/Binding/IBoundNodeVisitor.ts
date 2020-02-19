import * as Nodes from "./BoundNode";

export interface IBoundNodeVisitor {
    visit(node: Nodes.BoundGlobalScope): void;
    visitBinaryExpression(node: Nodes.BoundBinaryExpression): void;
    visitBoundUnaryExpression(node: Nodes.BoundUnaryExpression): void;
    visitBoundBlockStatement(node: Nodes.BoundBlockStatement): void;
    visitBoundLiteralExpression(node: Nodes.BoundLiteralExpression): void;
    visitBoundFunctionDeclaration(node: Nodes.BoundFunctionDeclaration): void;
    visitBoundVariableDeclaration(node: Nodes.BoundVariableDeclaration): void;
    visitBoundIfStatement(node: Nodes.BoundIfStatement): void;
    visitBoundExpressionStatement(node: Nodes.BoundExpressionStatement): void;
    visitBoundReturnStatement(node: Nodes.BoundReturnStatement): void;
    visitBoundForStatement(node: Nodes.BoundForStatement): void;
    visitBoundWhileStatement(node: Nodes.BoundWhileStatement): void;
    visitBoundVariableExpression(node: Nodes.BoundVariableExpression): void;
    visitBoundCallExpression(node: Nodes.BoundCallExpression): void;
    visitBoundAssignmentStatement(node: Nodes.BoundAssignmentStatement): void;
    visitBoundClassDeclaration(node: Nodes.BoundClassDeclaration): void;
    visitBoundErrorExpression(node: Nodes.BoundErrorExpression): void;
}
