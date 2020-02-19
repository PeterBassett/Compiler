import Token from "../Token";
import TextSpan from "../Text/TextSpan";
import { exhaustiveCheck } from "../../../../misc/exhaustive";
import { ClassDeclaration } from "estree";

function getSyntaxNodeFromPosition(root:SyntaxNode, line: number, ch: number) : SyntaxNode
{
    throw new Error("Not Impleemnted...Yet");
}

function spanCalculator(this:any) : TextSpan
{
    let node : any = this;
    let start : number = 999999999;
    let end : number = 0;

    for (const key in node) {
        if (node.hasOwnProperty(key)) {
            const element = (node as any)[key];

            if(!element)
                continue;
                            
            // it is a object with a span property? This will be a Token object?
            if(typeof element == "object" && typeof element.span == "object")
            {                
                start = Math.min(start, element.span.start);
                end = Math.max(end, element.span.end);
            } // it is an array? recurse down.
            else if(typeof element == "object" && typeof element.length == "number")
            {
                for(let i = 0; i < element.length; i++)
                {
                    let span = spanCalculator.call(element[i]);

                    start = Math.min(start, span.start);
                    end = Math.max(end, span.end);
                }
            } // it is an object with a span function? It'll be a SyntaxNode
            else if(typeof element == "object" && typeof element.span == "function") 
            {
                let span = element.span();

                start = Math.min(start, span.start);
                end = Math.max(end, span.end);
            }
        }
    }

    return new TextSpan(start, end - start);
};

export interface SyntaxNodeBase 
{
    span() : TextSpan;
};

export interface BooleanLiteralExpressionSyntax  extends SyntaxNodeBase { kind:"BooleanLiteralExpressionSyntax"; literalToken: Token; };
export interface IntegerLiteralExpressionSyntax  extends SyntaxNodeBase { kind:"IntegerLiteralExpressionSyntax"; literalToken: Token };
export interface FloatLiteralExpressionSyntax  extends SyntaxNodeBase { kind:"FloatLiteralExpressionSyntax"; literalToken: Token; };
export interface StringLiteralExpressionSyntax extends SyntaxNodeBase { kind:"StringLiteralExpressionSyntax"; literalToken: Token; };
export interface NullLiteralExpressionSyntax extends SyntaxNodeBase { kind:"NullLiteralExpressionSyntax"; nullLiteralToken: Token; };
export interface UnaryExpressionSyntax extends SyntaxNodeBase { kind:"UnaryExpressionSyntax"; operatorToken: Token; operand:ExpressionNode; };
export interface BinaryExpressionSyntax extends SyntaxNodeBase { kind:"BinaryExpressionSyntax"; left:ExpressionNode; operatorToken: Token; right:ExpressionNode; };
export interface AssignmentExpressionSyntax extends SyntaxNodeBase { kind:"AssignmentExpressionSyntax"; identifierToken:Token; equalsToken : Token; expression : ExpressionNode; };
export interface ParenthesizedExpressionSyntax extends SyntaxNodeBase { kind:"ParenthesizedExpressionSyntax"; leftParen : Token, expression:ExpressionNode, rightParent:Token; };
export interface NameExpressionSyntax extends SyntaxNodeBase { kind:"NameExpressionSyntax"; identifierToken : Token; };
export interface CallExpressionSyntax extends SyntaxNodeBase { kind:"CallExpressionSyntax"; nameExpression : NameExpressionSyntax, leftParenToken : Token, callArguments : ExpressionNode[], rightParenToken : Token; };

export interface CompilationUnitSyntax extends SyntaxNodeBase { kind: "CompilationUnitSyntax"; declarations : DeclarationSyntax[], eofToken:Token; };
export interface ExpressionStatementSyntax extends SyntaxNodeBase { kind : "ExpressionStatementSyntax"; expression: ExpressionNode; semiColonToken:Token; };
export interface BlockStatementSyntax extends SyntaxNodeBase { kind: "BlockStatementSyntax", openBraceToken:Token; statements : StatementNode[]; closeBraceToken:Token; };
export interface IfStatementSyntax extends SyntaxNodeBase { kind: "IfStatementSyntax", ifKeyword : Token; condition : ExpressionNode; trueBranch : StatementNode; falseBranch: ElseStatementSyntax|null };
export interface ElseStatementSyntax extends SyntaxNodeBase { kind: "ElseStatementSyntax", elseKeyword : Token; body : StatementNode; };
export interface ForStatementSyntax extends SyntaxNodeBase { kind: "ForStatementSyntax", forKeyword:Token; letKeyword:Token; identifier:Token; inKeyword:Token; lowerBound : ExpressionNode; toKeyword:Token; upperBound : ExpressionNode; body : StatementNode};
export interface WhileStatementSyntax extends SyntaxNodeBase { kind: "WhileStatementSyntax", whileKeyword:Token; condition : ExpressionNode; body : StatementNode};
export interface BreakStatementSyntax extends SyntaxNodeBase { kind: "BreakStatementSyntax", breakKeyword:Token; };
export interface ContinueStatementSyntax extends SyntaxNodeBase { kind: "ContinueStatementSyntax", continueKeyword:Token; };
export interface SetStatementSyntax extends SyntaxNodeBase { kind:"SetStatementSyntax"; left:GetExpressionSyntax; equalsToken:Token; right:ExpressionNode; };
export interface DereferenceAssignmentStatementSyntax extends SyntaxNodeBase { kind:"DereferenceAssignmentStatementSyntax"; left:ExpressionNode; equalsToken:Token; right:ExpressionNode; };

export interface TypeNameSyntax extends SyntaxNodeBase { kind: "TypeNameSyntax"; starToken:Token|null, identifier:Token; isPredefined:boolean; pointerToType : TypeNameSyntax|null; };
export interface ParameterDeclarationSyntax extends SyntaxNodeBase { kind: "ParameterDeclarationSyntax"; identifier:Token; colonToken:Token; typeName:TypeNameSyntax; comma?:Token; };
export interface ParameterDeclarationListSyntax extends SyntaxNodeBase { kind: "ParameterDeclarationListSyntax"; leftParen : Token; params:ParameterDeclarationSyntax[]; rightParen : Token };
export interface VariableDeclarationSyntax extends SyntaxNodeBase { kind: "VariableDeclarationSyntax"; declarationTypeToken : Token; identifier:Token; colonToken?: Token; typeName?:TypeNameSyntax; equalsToken?:Token; initialiserExpression?: ExpressionNode; comma?:Token; };
export interface VariableDeclarationListSyntax extends SyntaxNodeBase { kind: "VariableDeclarationListSyntax"; params:VariableDeclarationSyntax[] };
export interface FunctionDeclarationStatementSyntax extends SyntaxNodeBase { kind: "FunctionDeclarationStatementSyntax"; funcKeyword : Token; identifier:Token; parameterList: ParameterDeclarationListSyntax; colonToken :Token; returnValue: TypeNameSyntax; body:BlockStatementSyntax; };
export interface LambdaDeclarationStatementSyntax extends SyntaxNodeBase { kind: "LambdaDeclarationStatementSyntax"; funcKeyword : Token; identifier:Token; parameterList: ParameterDeclarationListSyntax; colonToken : Token; returnValue:TypeNameSyntax; arrowToken :Token; body:ExpressionNode; };
export interface ReturnStatementSyntax extends SyntaxNodeBase { kind: "ReturnStatementSyntax"; returnKeyword : Token; expression?:ExpressionNode; semiColonToken:Token; };
export interface ClassDeclarationStatementSyntax extends SyntaxNodeBase { kind: "ClassDeclarationStatementSyntax"; classKeyword : Token; identifier:Token; leftBrace: Token; declarations : DeclarationSyntax []; rightBrace: Token; };
export interface StructDeclarationStatementSyntax extends SyntaxNodeBase { kind: "StructDeclarationStatementSyntax"; structKeyword : Token; identifier:Token; leftBrace: Token; declarations : StructMemberDeclarationStatementSyntax []; rightBrace: Token; };
export interface StructMemberDeclarationStatementSyntax extends SyntaxNodeBase { kind: "StructMemberDeclarationStatementSyntax"; identifier:Token; colonToken: Token; typeName:TypeNameSyntax; semiColonToken: Token; };
export interface GetExpressionSyntax extends SyntaxNodeBase { kind:"GetExpressionSyntax"; left:ExpressionNode; dotToken:Token; name:Token; };

export type DeclarationSyntax = ClassDeclarationStatementSyntax |
                                StructDeclarationStatementSyntax |
                                FunctionDeclarationStatementSyntax |
                                LambdaDeclarationStatementSyntax |
                                VariableDeclarationSyntax;

export type StatementNode  =    DeclarationSyntax |
                                ExpressionStatementSyntax |
                                BlockStatementSyntax |
                                IfStatementSyntax |
                                ElseStatementSyntax |
                                ForStatementSyntax |
                                WhileStatementSyntax |
                                BreakStatementSyntax |
                                ContinueStatementSyntax |
                                ReturnStatementSyntax |
                                ParameterDeclarationSyntax |
                                ParameterDeclarationListSyntax |
                                StructMemberDeclarationStatementSyntax |
                                SetStatementSyntax |
                                DereferenceAssignmentStatementSyntax;

export type ExpressionNode  =   BooleanLiteralExpressionSyntax |
                                IntegerLiteralExpressionSyntax |
                                FloatLiteralExpressionSyntax |
                                StringLiteralExpressionSyntax |
                                NullLiteralExpressionSyntax |
                                UnaryExpressionSyntax |
                                BinaryExpressionSyntax |
                                AssignmentExpressionSyntax |
                                ParenthesizedExpressionSyntax |
                                NameExpressionSyntax |
                                CallExpressionSyntax | 
                                TypeNameSyntax |
                                GetExpressionSyntax;

export type CallableExpressionNode = LambdaDeclarationStatementSyntax |
                                     FunctionDeclarationStatementSyntax;

export type SyntaxNode =    DeclarationSyntax | 
                            ExpressionNode |  
                            StatementNode;

export const CompilationUnitSyntax = (declarations : DeclarationSyntax [], eofToken:Token) : CompilationUnitSyntax => ({kind:"CompilationUnitSyntax", declarations, eofToken, span:spanCalculator});
export const BooleanLiteralExpressionSyntax = (literalToken:Token): BooleanLiteralExpressionSyntax => ({kind:"BooleanLiteralExpressionSyntax", literalToken, span:spanCalculator });
export const IntegerLiteralExpressionSyntax = (literalToken:Token): IntegerLiteralExpressionSyntax => ({kind:"IntegerLiteralExpressionSyntax", literalToken, span:spanCalculator });
export const FloatLiteralExpressionSyntax = (literalToken:Token): FloatLiteralExpressionSyntax => ({kind:"FloatLiteralExpressionSyntax", literalToken, span:spanCalculator });
export const StringLiteralExpressionSyntax = (literalToken:Token): StringLiteralExpressionSyntax => ({kind:"StringLiteralExpressionSyntax", literalToken, span:spanCalculator });
export const NullLiteralExpressionSyntax = (nullLiteralToken:Token): NullLiteralExpressionSyntax => ({kind:"NullLiteralExpressionSyntax", nullLiteralToken, span:spanCalculator });
export const UnaryExpressionSyntax = (operatorToken:Token, operand:ExpressionNode): UnaryExpressionSyntax => ({kind:"UnaryExpressionSyntax", operatorToken, operand, span:spanCalculator });
export const BinaryExpressionSyntax = (left:ExpressionNode, operatorToken:Token, right:ExpressionNode): BinaryExpressionSyntax => ({kind:"BinaryExpressionSyntax", left, operatorToken, right, span:spanCalculator });                
export const AssignmentExpressionSyntax = (identifierToken:Token, equalsToken : Token, expression : ExpressionNode): AssignmentExpressionSyntax => ({kind:"AssignmentExpressionSyntax", identifierToken, equalsToken, expression, span:spanCalculator });                
export const ParenthesizedExpressionSyntax = (leftParen : Token, expression:ExpressionNode, rightParent:Token) : ParenthesizedExpressionSyntax => ({kind:"ParenthesizedExpressionSyntax", leftParen, expression, rightParent, span:spanCalculator });
export const NameExpressionSyntax = (identifierToken : Token) : NameExpressionSyntax => ({kind:"NameExpressionSyntax", identifierToken, span:spanCalculator });
export const CallExpressionSyntax = (nameExpression : NameExpressionSyntax, leftParenToken : Token, callArguments : ExpressionNode[], rightParenToken : Token)  : CallExpressionSyntax => ({kind:"CallExpressionSyntax", nameExpression, leftParenToken, callArguments, rightParenToken, span:spanCalculator });

export const ExpressionStatementSyntax = (expression:ExpressionNode, semiColonToken:Token): ExpressionStatementSyntax => ({kind:"ExpressionStatementSyntax", expression, semiColonToken, span:spanCalculator });
export const BlockStatementSyntax = (openBraceToken : Token, statements:StatementNode[], closeBraceToken:Token): BlockStatementSyntax => ({kind:"BlockStatementSyntax", openBraceToken, statements, closeBraceToken, span:spanCalculator });                
export const IfStatementSyntax = (ifKeyword : Token, condition:ExpressionNode, trueBranch:StatementNode, falseBranch:ElseStatementSyntax | null): IfStatementSyntax => ({kind:"IfStatementSyntax", ifKeyword, condition, trueBranch, falseBranch, span:spanCalculator });                
export const ElseStatementSyntax = (elseKeyword : Token, body:StatementNode ): ElseStatementSyntax => ({kind:"ElseStatementSyntax", elseKeyword, body, span:spanCalculator });                
export const ForStatementSyntax = ( forKeyword:Token, letKeyword:Token, identifier:Token, inKeyword:Token, lowerBound : ExpressionNode, toKeyword:Token, upperBound : ExpressionNode, body : StatementNode): ForStatementSyntax => ({kind:"ForStatementSyntax", forKeyword, letKeyword, identifier, inKeyword, lowerBound, toKeyword, upperBound, body, span:spanCalculator });
export const WhileStatementSyntax = ( whileKeyword:Token, condition : ExpressionNode, body : StatementNode): WhileStatementSyntax => ({kind:"WhileStatementSyntax", whileKeyword, condition, body, span:spanCalculator });
export const BreakStatementSyntax = ( breakKeyword:Token ): BreakStatementSyntax => ({kind:"BreakStatementSyntax", breakKeyword, span:spanCalculator });
export const ContinueStatementSyntax = ( continueKeyword:Token ): ContinueStatementSyntax => ({kind:"ContinueStatementSyntax", continueKeyword, span:spanCalculator });
export const SetStatementSyntax = (left:GetExpressionSyntax, equalsToken:Token, right:ExpressionNode) : SetStatementSyntax => ({kind:"SetStatementSyntax", left, equalsToken, right, span:spanCalculator});
export const DereferenceAssignmentStatementSyntax = (left:ExpressionNode, equalsToken:Token, right:ExpressionNode) : DereferenceAssignmentStatementSyntax => ({kind:"DereferenceAssignmentStatementSyntax", left, equalsToken, right, span:spanCalculator});

export const VariableDeclarationSyntax = (declarationTypeToken : Token, identifier:Token, colonToken?: Token, typeName?:TypeNameSyntax, equalsToken? : Token, initialiserExpression?: ExpressionNode, comma?:Token) : VariableDeclarationSyntax => ({ kind:"VariableDeclarationSyntax", declarationTypeToken, identifier, colonToken, typeName, equalsToken, initialiserExpression, comma, span:spanCalculator });
export const FunctionDeclarationStatementSyntax = (funcKeyword : Token, identifier:Token, parameterList: ParameterDeclarationListSyntax, colonToken :Token, returnValue: TypeNameSyntax, body:BlockStatementSyntax) : FunctionDeclarationStatementSyntax => ({ kind:"FunctionDeclarationStatementSyntax", funcKeyword, identifier, parameterList, colonToken , returnValue, body, span:spanCalculator });
export const LambdaDeclarationStatementSyntax = (funcKeyword : Token, identifier:Token, parameterList: ParameterDeclarationListSyntax, colonToken : Token, returnValue: TypeNameSyntax, arrowToken :Token, body:ExpressionNode ) : LambdaDeclarationStatementSyntax => ({kind: "LambdaDeclarationStatementSyntax", funcKeyword, identifier, parameterList, colonToken, returnValue, arrowToken, body, span:spanCalculator });
export const ParameterDeclarationSyntax = (identifier:Token, colonToken : Token, typeName:TypeNameSyntax, comma?:Token): ParameterDeclarationSyntax =>  ({kind: "ParameterDeclarationSyntax", identifier, colonToken, typeName, comma, span:spanCalculator });
export const ParameterDeclarationListSyntax = (leftParen : Token, params:ParameterDeclarationSyntax[], rightParen : Token) : ParameterDeclarationListSyntax => ({kind: "ParameterDeclarationListSyntax", leftParen, params, rightParen, span:spanCalculator });
export const ReturnStatementSyntax = (returnKeyword : Token, expression:ExpressionNode|undefined, semiColonToken:Token) : ReturnStatementSyntax => ({kind: "ReturnStatementSyntax", returnKeyword, expression, semiColonToken, span:spanCalculator });
export const TypeNameSyntax = (starToken: Token|null, identifier:Token, isPredefined:boolean, pointerToType : TypeNameSyntax|null) : TypeNameSyntax => ({kind:"TypeNameSyntax", starToken, identifier, isPredefined, pointerToType, span:spanCalculator});
export const ClassDeclarationStatementSyntax = (classKeyword : Token, identifier:Token, leftBrace: Token, declarations : DeclarationSyntax [], rightBrace: Token) : ClassDeclarationStatementSyntax => ({kind:"ClassDeclarationStatementSyntax", classKeyword, identifier, leftBrace, declarations, rightBrace, span:spanCalculator});
export const StructDeclarationStatementSyntax = (structKeyword : Token, identifier:Token, leftBrace: Token, declarations : StructMemberDeclarationStatementSyntax [], rightBrace: Token) : StructDeclarationStatementSyntax => ({kind:"StructDeclarationStatementSyntax", structKeyword, identifier, leftBrace, declarations, rightBrace, span:spanCalculator});
export const StructMemberDeclarationStatementSyntax = (identifier:Token, colonToken: Token, typeName:TypeNameSyntax, semiColonToken: Token) : StructMemberDeclarationStatementSyntax => ({kind:"StructMemberDeclarationStatementSyntax", identifier, colonToken, typeName, semiColonToken, span:spanCalculator});
export const GetExpressionSyntax = (left:ExpressionNode, dotToken:Token, name:Token) : GetExpressionSyntax => ({kind:"GetExpressionSyntax", left, dotToken, name, span:spanCalculator});
