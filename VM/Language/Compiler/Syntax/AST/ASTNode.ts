import Token from "../Token";
import TextSpan from "../Text/TextSpan";
import { exhaustiveCheck } from "../../../../misc/exhaustive";
import { ClassDeclaration } from "estree";
import { Value } from "../../../Scope/ExecutionScope";
import { spanCalculator } from "./spanCalculator";

function getSyntaxNodeFromPosition(root:SyntaxNode, line: number, ch: number) : SyntaxNode
{
    throw new Error("Not Impleemnted...Yet");
}

;

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
export interface DereferenceExpressionSyntax extends SyntaxNodeBase { kind:"DereferenceExpressionSyntax"; operatorToken: Token; operand:ExpressionNode; };
export interface BinaryExpressionSyntax extends SyntaxNodeBase { kind:"BinaryExpressionSyntax"; left:ExpressionNode; operatorToken: Token; right:ExpressionNode; };
export interface AssignmentStatementSyntax extends SyntaxNodeBase { kind:"AssignmentStatementSyntax"; target:AddressableExpressionNode; equalsToken : Token; expression : ExpressionNode; };
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

export interface TypeSyntaxBase extends SyntaxNodeBase
{
    rootIdentifier() : Token;
};

export interface NamedTypeSyntax extends TypeSyntaxBase { kind: "NamedTypeSyntax"; identifier:Token; isPredefined:boolean; };
export interface PointerTypeSyntax extends TypeSyntaxBase { kind: "PointerTypeSyntax"; starToken : Token; pointerToType : TypeSyntax };
export interface ArrayTypeSyntax extends TypeSyntaxBase { kind: "ArrayTypeSyntax"; leftBracket:Token; length:ExpressionNode; rightBracket : Token; elementType : TypeSyntax; };

export type TypeSyntax =  NamedTypeSyntax |
                            PointerTypeSyntax |
                            ArrayTypeSyntax;

export interface ParameterDeclarationSyntax extends SyntaxNodeBase { kind: "ParameterDeclarationSyntax"; identifier:Token; colonToken:Token; typeName:TypeSyntax; comma?:Token; };
export interface ParameterDeclarationListSyntax extends SyntaxNodeBase { kind: "ParameterDeclarationListSyntax"; leftParen : Token; params:ParameterDeclarationSyntax[]; rightParen : Token };
export interface VariableDeclarationSyntax extends SyntaxNodeBase { kind: "VariableDeclarationSyntax"; declarationTypeToken : Token; identifier:Token; colonToken?: Token; typeName?:TypeSyntax; equalsToken?:Token; initialiserExpression?: ExpressionNode; comma?:Token; };
export interface VariableDeclarationListSyntax extends SyntaxNodeBase { kind: "VariableDeclarationListSyntax"; params:VariableDeclarationSyntax[] };
export interface FunctionDeclarationStatementSyntax extends SyntaxNodeBase { kind: "FunctionDeclarationStatementSyntax"; funcKeyword : Token; identifier:Token; parameterList: ParameterDeclarationListSyntax; colonToken :Token; returnValue: TypeSyntax; body:BlockStatementSyntax; };
export interface LambdaDeclarationStatementSyntax extends SyntaxNodeBase { kind: "LambdaDeclarationStatementSyntax"; funcKeyword : Token; identifier:Token; parameterList: ParameterDeclarationListSyntax; colonToken : Token; returnValue:TypeSyntax; arrowToken :Token; body:ExpressionNode; };
export interface ReturnStatementSyntax extends SyntaxNodeBase { kind: "ReturnStatementSyntax"; returnKeyword : Token; expression?:ExpressionNode; semiColonToken:Token; };
export interface ClassDeclarationStatementSyntax extends SyntaxNodeBase { kind: "ClassDeclarationStatementSyntax"; classKeyword : Token; identifier:Token; leftBrace: Token; declarations : DeclarationSyntax []; rightBrace: Token; };

export interface StructOrUnionDeclarationStatementSyntax extends SyntaxNodeBase { kind: "StructOrUnionDeclarationStatementSyntax"; keyword : Token; identifier:Token; leftBrace: Token; declarations : StructMemberDeclarationStatementSyntax []; rightBrace: Token; };
export interface StructMemberDeclarationStatementSyntax extends SyntaxNodeBase { kind: "StructMemberDeclarationStatementSyntax"; identifier:Token; colonToken: Token; typeName:TypeSyntax; semiColonToken: Token; };

export interface GetExpressionSyntax extends SyntaxNodeBase { kind:"GetExpressionSyntax"; left:ExpressionNode; dotToken:Token; name:Token; };
export interface ArrayIndexExpressionSyntax extends SyntaxNodeBase { kind:"ArrayIndexExpressionSyntax"; left:AddressableExpressionNode; leftBracket:Token; index:ExpressionNode; rightBracket:Token; };

// things that declare names to be used elsewhere in the program
export type DeclarationSyntax = ClassDeclarationStatementSyntax |
                                StructOrUnionDeclarationStatementSyntax |
                                FunctionDeclarationStatementSyntax |
                                LambdaDeclarationStatementSyntax |
                                VariableDeclarationSyntax;

// things that can be assigned to, a subset of things that produce
// values. when used here they produce the address of those values. 
export type AddressableExpressionNode = NameExpressionSyntax |
                                    DereferenceExpressionSyntax |
                                    GetExpressionSyntax | 
                                    ArrayIndexExpressionSyntax;

export function isAddressable(value: SyntaxNode): value is AddressableExpressionNode
{
    // walk down the tree to find the root of a parenthesised expression
    value = stripParentheses(value);

    // remember to add to this when you make a new member of AddressableExpressionNode
    switch(value.kind)
    {
        case "NameExpressionSyntax":
        case "DereferenceExpressionSyntax":
        case "GetExpressionSyntax":
        case "ArrayIndexExpressionSyntax":
            return true;
    }

    return false;
}

export function stripParentheses(value : SyntaxNode) : SyntaxNode
{
    while(value.kind == "ParenthesizedExpressionSyntax")
        value = value.expression;

    return value;
}

// things that do not produce a value
// and are generally held in lists by their parents
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
                                AssignmentStatementSyntax;

// things that produce values and are generally held in trees
// by their ancestors.
export type ExpressionNode  =   BooleanLiteralExpressionSyntax |
                                IntegerLiteralExpressionSyntax |
                                FloatLiteralExpressionSyntax |
                                StringLiteralExpressionSyntax |
                                NullLiteralExpressionSyntax |
                                DereferenceExpressionSyntax | 
                                UnaryExpressionSyntax |
                                BinaryExpressionSyntax |
                                ParenthesizedExpressionSyntax |
                                NameExpressionSyntax |
                                CallExpressionSyntax | 
                                TypeSyntax |
                                GetExpressionSyntax |
                                AddressableExpressionNode;

// things that can be executed
export type CallableExpressionNode = LambdaDeclarationStatementSyntax |
                                     FunctionDeclarationStatementSyntax;

// All possible things
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
export const DereferenceExpressionSyntax = (operatorToken:Token, operand:ExpressionNode): DereferenceExpressionSyntax => ({kind:"DereferenceExpressionSyntax", operatorToken, operand, span:spanCalculator });
export const BinaryExpressionSyntax = (left:ExpressionNode, operatorToken:Token, right:ExpressionNode): BinaryExpressionSyntax => ({kind:"BinaryExpressionSyntax", left, operatorToken, right, span:spanCalculator });                
export const ParenthesizedExpressionSyntax = (leftParen : Token, expression:ExpressionNode, rightParent:Token) : ParenthesizedExpressionSyntax => ({kind:"ParenthesizedExpressionSyntax", leftParen, expression, rightParent, span:spanCalculator });
export const NameExpressionSyntax = (identifierToken : Token) : NameExpressionSyntax => ({kind:"NameExpressionSyntax", identifierToken, span:spanCalculator });
export const CallExpressionSyntax = (nameExpression : NameExpressionSyntax, leftParenToken : Token, callArguments : ExpressionNode[], rightParenToken : Token)  : CallExpressionSyntax => ({kind:"CallExpressionSyntax", nameExpression, leftParenToken, callArguments, rightParenToken, span:spanCalculator });

export const AssignmentStatementSyntax = (target:AddressableExpressionNode, equalsToken : Token, expression : ExpressionNode): AssignmentStatementSyntax => ({kind:"AssignmentStatementSyntax", target, equalsToken, expression, span:spanCalculator });
export const ExpressionStatementSyntax = (expression:ExpressionNode, semiColonToken:Token): ExpressionStatementSyntax => ({kind:"ExpressionStatementSyntax", expression, semiColonToken, span:spanCalculator });
export const BlockStatementSyntax = (openBraceToken : Token, statements:StatementNode[], closeBraceToken:Token): BlockStatementSyntax => ({kind:"BlockStatementSyntax", openBraceToken, statements, closeBraceToken, span:spanCalculator });                
export const IfStatementSyntax = (ifKeyword : Token, condition:ExpressionNode, trueBranch:StatementNode, falseBranch:ElseStatementSyntax | null): IfStatementSyntax => ({kind:"IfStatementSyntax", ifKeyword, condition, trueBranch, falseBranch, span:spanCalculator });                
export const ElseStatementSyntax = (elseKeyword : Token, body:StatementNode ): ElseStatementSyntax => ({kind:"ElseStatementSyntax", elseKeyword, body, span:spanCalculator });                
export const ForStatementSyntax = ( forKeyword:Token, letKeyword:Token, identifier:Token, inKeyword:Token, lowerBound : ExpressionNode, toKeyword:Token, upperBound : ExpressionNode, body : StatementNode): ForStatementSyntax => ({kind:"ForStatementSyntax", forKeyword, letKeyword, identifier, inKeyword, lowerBound, toKeyword, upperBound, body, span:spanCalculator });
export const WhileStatementSyntax = ( whileKeyword:Token, condition : ExpressionNode, body : StatementNode): WhileStatementSyntax => ({kind:"WhileStatementSyntax", whileKeyword, condition, body, span:spanCalculator });
export const BreakStatementSyntax = ( breakKeyword:Token ): BreakStatementSyntax => ({kind:"BreakStatementSyntax", breakKeyword, span:spanCalculator });
export const ContinueStatementSyntax = ( continueKeyword:Token ): ContinueStatementSyntax => ({kind:"ContinueStatementSyntax", continueKeyword, span:spanCalculator });

export const VariableDeclarationSyntax = (declarationTypeToken : Token, identifier:Token, colonToken?: Token, typeName?:TypeSyntax, equalsToken? : Token, initialiserExpression?: ExpressionNode, comma?:Token) : VariableDeclarationSyntax => ({ kind:"VariableDeclarationSyntax", declarationTypeToken, identifier, colonToken, typeName, equalsToken, initialiserExpression, comma, span:spanCalculator });
export const FunctionDeclarationStatementSyntax = (funcKeyword : Token, identifier:Token, parameterList: ParameterDeclarationListSyntax, colonToken :Token, returnValue: TypeSyntax, body:BlockStatementSyntax) : FunctionDeclarationStatementSyntax => ({ kind:"FunctionDeclarationStatementSyntax", funcKeyword, identifier, parameterList, colonToken , returnValue, body, span:spanCalculator });
export const LambdaDeclarationStatementSyntax = (funcKeyword : Token, identifier:Token, parameterList: ParameterDeclarationListSyntax, colonToken : Token, returnValue: TypeSyntax, arrowToken :Token, body:ExpressionNode ) : LambdaDeclarationStatementSyntax => ({kind: "LambdaDeclarationStatementSyntax", funcKeyword, identifier, parameterList, colonToken, returnValue, arrowToken, body, span:spanCalculator });
export const ParameterDeclarationSyntax = (identifier:Token, colonToken : Token, typeName:TypeSyntax, comma?:Token): ParameterDeclarationSyntax =>  ({kind: "ParameterDeclarationSyntax", identifier, colonToken, typeName, comma, span:spanCalculator });
export const ParameterDeclarationListSyntax = (leftParen : Token, params:ParameterDeclarationSyntax[], rightParen : Token) : ParameterDeclarationListSyntax => ({kind: "ParameterDeclarationListSyntax", leftParen, params, rightParen, span:spanCalculator });
export const ReturnStatementSyntax = (returnKeyword : Token, expression:ExpressionNode|undefined, semiColonToken:Token) : ReturnStatementSyntax => ({kind: "ReturnStatementSyntax", returnKeyword, expression, semiColonToken, span:spanCalculator });

export const NamedTypeSyntax = (identifier:Token, isPredefined:boolean) : NamedTypeSyntax => ({kind:"NamedTypeSyntax", identifier, isPredefined, span:spanCalculator, rootIdentifier:() => identifier });
export const PointerTypeSyntax = (starToken: Token, pointerToType : TypeSyntax) : PointerTypeSyntax => ({kind:"PointerTypeSyntax", starToken, pointerToType, span:spanCalculator, rootIdentifier:() => pointerToType.rootIdentifier() });
export const ArrayTypeSyntax = (leftBracket: Token, length:ExpressionNode, rightBracket:Token, elementType : TypeSyntax) : ArrayTypeSyntax => ({kind:"ArrayTypeSyntax", leftBracket, length, rightBracket, elementType, span:spanCalculator, rootIdentifier:() => elementType.rootIdentifier() });

export const ClassDeclarationStatementSyntax = (classKeyword : Token, identifier:Token, leftBrace: Token, declarations : DeclarationSyntax [], rightBrace: Token) : ClassDeclarationStatementSyntax => ({kind:"ClassDeclarationStatementSyntax", classKeyword, identifier, leftBrace, declarations, rightBrace, span:spanCalculator});
export const StructOrUnionDeclarationStatementSyntax = (keyword : Token, identifier:Token, leftBrace: Token, declarations : StructMemberDeclarationStatementSyntax [], rightBrace: Token) : StructOrUnionDeclarationStatementSyntax => ({kind:"StructOrUnionDeclarationStatementSyntax", keyword, identifier, leftBrace, declarations, rightBrace, span:spanCalculator});
export const StructMemberDeclarationStatementSyntax = (identifier:Token, colonToken: Token, typeName:TypeSyntax, semiColonToken: Token) : StructMemberDeclarationStatementSyntax => ({kind:"StructMemberDeclarationStatementSyntax", identifier, colonToken, typeName, semiColonToken, span:spanCalculator});
export const GetExpressionSyntax = (left:ExpressionNode, dotToken:Token, name:Token) : GetExpressionSyntax => ({kind:"GetExpressionSyntax", left, dotToken, name, span:spanCalculator});
export const ArrayIndexExpressionSyntax = (left:AddressableExpressionNode, leftBracket:Token, index:ExpressionNode, rightBracket:Token) : ArrayIndexExpressionSyntax => ({kind:"ArrayIndexExpressionSyntax", left, leftBracket, index, rightBracket, span:spanCalculator});