import { TextWriter } from "../../../misc/TextWriter";
import * as Nodes from "./BoundNode";
import { IndentedTextWriter } from "../../../misc/StringWriter";
import { BoundNodeKind } from "./BoundNode";
import { SyntaxType } from "../Syntax/SyntaxType";
import * as SyntaxFacts from "../Syntax/SyntaxFacts";
import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";

export class BoundNodePrinter
{
    public static WriteTo(node : Nodes.BoundNode, inputWriter : TextWriter)
    {
        let writer : IndentedTextWriter;

        if (!(inputWriter instanceof IndentedTextWriter))
            writer = new IndentedTextWriter(inputWriter);
        else
            writer = inputWriter;

        switch (node.kind)
        {
            case BoundNodeKind.BlockStatement:
                this.WriteBlockStatement(node as Nodes.BoundBlockStatement, writer);
                break;
            case BoundNodeKind.VariableDeclaration:
                this.WriteVariableDeclaration(node as Nodes.BoundVariableDeclaration, writer);
                break;
            case BoundNodeKind.IfStatement:
                this.WriteIfStatement(node as Nodes.BoundIfStatement, writer);
                break;
            case BoundNodeKind.WhileStatement:
                this.WriteWhileStatement(node as Nodes.BoundWhileStatement, writer);
                break;
            case BoundNodeKind.ForStatement:
                this.WriteForStatement(node as Nodes.BoundForStatement, writer);
                break;
            case BoundNodeKind.LabelStatement:
                this.WriteLabelStatement(node as Nodes.BoundLabelStatement, writer);
                break;
            case BoundNodeKind.GotoStatement:
                this.WriteGotoStatement(node as Nodes.BoundGotoStatement, writer);
                break;
            case BoundNodeKind.ConditionalGotoStatement:
                this.WriteConditionalGotoStatement(node as Nodes.BoundConditionalGotoStatement, writer);
                break;
            case BoundNodeKind.ReturnStatement:
                this.WriteReturnStatement(node as Nodes.BoundReturnStatement, writer);
                break;
            case BoundNodeKind.ExpressionStatement:
                this.WriteExpressionStatement(node as Nodes.BoundExpressionStatement, writer);
                break;
            case BoundNodeKind.ErrorExpression:
                this.WriteErrorExpression(node as Nodes.BoundErrorExpression, writer);
                break;
            case BoundNodeKind.LiteralExpression:
                this.WriteLiteralExpression(node as Nodes.BoundLiteralExpression, writer);
                break;
            case BoundNodeKind.VariableExpression:
                this.WriteVariableExpression(node as Nodes.BoundVariableExpression, writer);
                break;
            case BoundNodeKind.AssignmentStatement:
                this.WriteAssignmentExpression(node as Nodes.BoundAssignmentStatement, writer);
                break;
            case BoundNodeKind.UnaryExpression:
                this.WriteUnaryExpression(node as Nodes.BoundUnaryExpression, writer);
                break;
            case BoundNodeKind.BinaryExpression:
                this.WriteBinaryExpression(node as Nodes.BoundBinaryExpression, writer);
                break;
            case BoundNodeKind.CallExpression:
                this.WriteCallExpression(node as Nodes.BoundCallExpression, writer);
                break;
            case BoundNodeKind.ConversionExpression:
                this.WriteConversionExpression(node as Nodes.BoundConversionExpression, writer);
                break;
            default:
                throw Error(`Unexpected node ${node.kind}`);
        }
    }

    private static WriteNestedStatement(node : Nodes.BoundStatement, writer : IndentedTextWriter)
    {
        var needsIndentation = !(node instanceof Nodes.BoundBlockStatement);

        if (needsIndentation)
            writer.indent++;

        this.WriteTo(node, writer);

        if (needsIndentation)
            writer.indent--;
    }

    private static WriteNestedBinaryOrUnaryExpression(writer : IndentedTextWriter, parentPrecedence : number, expression : Nodes.BoundExpression)
    {
        if (expression instanceof Nodes.BoundUnaryExpression)
            this.WriteNestedExpression(writer, parentPrecedence, 
                SyntaxFacts.GetUnaryOperatorPrecedence(expression.operator.syntaxKind), expression);
        else if (expression instanceof Nodes.BoundBinaryExpression)
            this.WriteNestedExpression(writer, parentPrecedence, 
                SyntaxFacts.GetBinaryOperatorPrecedence(expression.operator.syntaxKind), expression);
        else
            this.WriteTo(expression, writer);
    }

    private static WriteNestedExpression(writer : IndentedTextWriter, parentPrecedence : number, currentPrecedence : number, expression : Nodes.BoundExpression)
    {
        var needsParenthesis = parentPrecedence >= currentPrecedence;

        if (needsParenthesis)
            this.WritePunctuation(writer, SyntaxType.LeftParen);

        this.WriteTo(expression, writer);

        if (needsParenthesis)
            this.WritePunctuation(writer, SyntaxType.RightParen);
    }

    private static WriteBlockStatement(node : Nodes.BoundBlockStatement, writer : IndentedTextWriter )
    {
        this.WritePunctuation(writer, SyntaxType.LeftBrace);
        writer.WriteLine();
        writer.indent++;

        for(let statement of node.statements)
            this.WriteTo(statement, writer);

        writer.indent--;
        this.WritePunctuation(writer, SyntaxType.RightBrace);
        writer.WriteLine();
    }

    private static WriteVariableDeclaration(node : Nodes.BoundVariableDeclaration, writer : IndentedTextWriter)
    {
        this.WriteKeyword(writer, node.variable.isReadOnly ? SyntaxType.LetKeyword : SyntaxType.VarKeyword);
        this.WriteSpace(writer);
        this.WriteIdentifier(writer, node.variable.name);
        this.WriteSpace(writer);
        this.WritePunctuation(writer, SyntaxType.Equals);
        this.WriteSpace(writer);
        this.WriteTo(node.initialiser, writer);
        this.WriteLine(writer);
    }

    private static WriteIfStatement(node : Nodes.BoundIfStatement, writer : IndentedTextWriter)
    {
        this.WriteKeyword(writer, SyntaxType.IfKeyword);
        this.WriteSpace(writer);
        this.WriteTo(node.condition, writer);
        this.WriteLine(writer);
        this.WriteNestedStatement(node.trueBranch, writer);

        if (node.falseBranch != null)
        {
            this.WriteKeyword(writer, SyntaxType.ElseKeyword);
            this.WriteLine(writer);
            this.WriteNestedStatement(node.falseBranch, writer);
        }
    }

    private static WriteWhileStatement(node : Nodes.BoundWhileStatement, writer : IndentedTextWriter)
    {
        this.WriteKeyword(writer, SyntaxType.WhileKeyword);
        this.WriteSpace(writer);
        this.WriteTo(node.condition, writer);
        this.WriteLine(writer);
        this.WriteNestedStatement(node.body, writer);
    }

    private static WriteForStatement(node : Nodes.BoundForStatement, writer : IndentedTextWriter)
    {
        this.WriteKeyword(writer, SyntaxType.ForKeyword);
        this.WriteSpace(writer);
        this.WriteIdentifier(writer, node.variable.name);
        this.WriteSpace(writer);
        this.WritePunctuation(writer, SyntaxType.Equals);
        this.WriteSpace(writer);
        this.WriteTo(node.lowerBound, writer);
        this.WriteSpace(writer);
        this.WriteKeyword(writer, SyntaxType.ToKeyword);
        this.WriteSpace(writer);
        this.WriteTo(node.upperBound, writer);
        this.WriteLine(writer);
        this.WriteNestedStatement(node.body, writer);
    }

    private static WriteLabelStatement(node : Nodes.BoundLabelStatement, writer : IndentedTextWriter)
    {
        var unindent = writer.indent > 0;
        if (unindent)
            writer.indent--;

        this.WriteString(writer, node.label.name);
        this.WritePunctuation(writer, SyntaxType.Colon);
        this.WriteLine(writer);

        if (unindent)
            writer.indent++;
    }

    private static WriteGotoStatement(node : Nodes.BoundGotoStatement, writer : IndentedTextWriter)
    {
        this.WriteString(writer, "goto ");
        this.WriteIdentifier(writer, node.label.name);
        this.WriteLine(writer);
    }

    private static WriteConditionalGotoStatement(node : Nodes.BoundConditionalGotoStatement, writer : IndentedTextWriter)
    {
        this.WriteString(writer, "goto ");
        this.WriteIdentifier(writer, node.label.name);
        this.WriteString(writer, node.jumpIfTrue ? " if " : " unless ");
        this.WriteTo(node.condition, writer);
        this.WriteLine(writer);
    }

    private static WriteReturnStatement(node : Nodes.BoundReturnStatement, writer : IndentedTextWriter)
    {
        this.WriteKeyword(writer, SyntaxType.ReturnKeyword);
        if (node.expression != null)
        {
            this.WriteSpace(writer);
            this.WriteTo(node.expression, writer);
        }
        this.WriteLine(writer);
    }

    private static WriteExpressionStatement(node : Nodes.BoundExpressionStatement, writer : IndentedTextWriter)
    {
        this.WriteTo(node.expression, writer);
        this.WriteLine(writer);
    }

    private static WriteErrorExpression(node : Nodes.BoundErrorExpression, writer : IndentedTextWriter)
    {
        this.WriteString(writer, "?");
    }

    private static WriteLiteralExpression(node : Nodes.BoundLiteralExpression, writer : IndentedTextWriter)
    {
        var value = node.value.toString();

        if (node.type == PredefinedValueTypes.Boolean)
        {
            this.WriteKeyword(writer, node.value ? SyntaxType.TrueKeyword : SyntaxType.FalseKeyword);
        }
        else if (node.type == PredefinedValueTypes.Integer)
        {
            this.WriteNumber(writer, value);
        }
        else if (node.type == PredefinedValueTypes.String)
        {
            value = "\"" + value.replace("\"", "\"\"") + "\"";
            this.WriteString(writer, value);
        }
        else
        {
            throw Error(`Unexpected type ${node.type}`);
        }
    }

    private static WriteVariableExpression(node : Nodes.BoundVariableExpression, writer : IndentedTextWriter)
    {
        this.WriteIdentifier(writer, node.variable.name);
    }

    private static WriteAssignmentExpression(node : Nodes.BoundAssignmentStatement, writer : IndentedTextWriter)
    {
        this.WriteAssignmentTargetExpression(node.target, writer);
        this.WriteSpace(writer);
        this.WritePunctuation(writer, SyntaxType.Equals);
        this.WriteSpace(writer);
        this.WriteTo(node.expression, writer);
    }

    private static WriteAssignmentTargetExpression(node : Nodes.BoundExpression, writer : IndentedTextWriter)
    {
        this.WriteTo(node, writer);
    }

    private static WriteUnaryExpression(node : Nodes.BoundUnaryExpression, writer : IndentedTextWriter)
    {
        var precedence = SyntaxFacts.GetUnaryOperatorPrecedence(node.operator.syntaxKind);

        this.WritePunctuation(writer, node.operator.syntaxKind);
        this.WriteNestedBinaryOrUnaryExpression(writer, precedence, node.operand);
    }

    private static WriteBinaryExpression(node : Nodes.BoundBinaryExpression, writer : IndentedTextWriter)
    {
        var precedence = SyntaxFacts.GetBinaryOperatorPrecedence(node.operator.syntaxKind);

        this.WriteNestedBinaryOrUnaryExpression(writer, precedence, node.left);
        this.WriteSpace(writer);
        this.WritePunctuation(writer, node.operator.syntaxKind);
        this.WriteSpace(writer);
        this.WriteNestedBinaryOrUnaryExpression(writer, precedence, node.right);
    }

    private static WriteCallExpression(node : Nodes.BoundCallExpression, writer : IndentedTextWriter)
    {
        this.WriteIdentifier(writer, node.identifier.name);
        this.WritePunctuation(writer, SyntaxType.LeftParen);

        var isFirst = true;
        for(let argument of node.callArguments)
        {
            if (isFirst)
            {
                isFirst = false;
            }
            else
            {
                this.WritePunctuation(writer, SyntaxType.Comma);
                this.WriteSpace(writer);
            }

            this.WriteTo(argument, writer);
        }

        this.WritePunctuation(writer, SyntaxType.RightParen);
    }

    private static WriteConversionExpression(node : Nodes.BoundConversionExpression, writer : IndentedTextWriter)
    {
        this.WriteIdentifier(writer, node.type.name!);
        this.WritePunctuation(writer, SyntaxType.LeftBrace);
        this.WriteTo(node.expression, writer);
        this.WritePunctuation(writer, SyntaxType.RightBrace);
    }

    public static WritePunctuation(writer : TextWriter, kind : SyntaxType)
    {
        writer.Write(SyntaxFacts.GetText(kind));
    }

    public static WriteKeyword(writer : TextWriter, kind : SyntaxType)
    {
        writer.Write(SyntaxFacts.GetText(kind));
    }

    public static WriteIdentifier(writer : TextWriter, text : string)
    {
        writer.Write(text);
    }

    public static WriteNumber(writer : TextWriter, text : string)
    {
        writer.Write(text);
    }

    public static WriteLine(writer : TextWriter)
    {
        writer.WriteLine();
    }

    public static WriteString(writer : TextWriter, text : string)
    {
        writer.Write(text);
    }

    public static WriteSpace(writer : TextWriter)
    {
        this.WriteString(writer, " ");
    }
}