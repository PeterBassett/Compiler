import SourceText from "./Text/SourceText";
import CompilationUnit from "./CompilationUnit";
import { SyntaxType } from "./SyntaxType";
import * as SyntaxFacts from "./SyntaxFacts";
import * as AST from "./AST/ASTNode";
import { Diagnostics, DiagnosticType } from "../Diagnostics/Diagnostics";
import TextSpan from "./Text/TextSpan";
import Token from "./Token";
import Lexer from "./Lexer";
import SyntaxTrivia from "./SyntaxTrivia";
import { BoundErrorExpression } from "../Binding/BoundNode";

class ExpectedEofException extends Error
{
    constructor(public readonly value : Token)
    {
        super("Unexpected EOF encountered");
    }
}

export default class Parser
{
    private readonly _diagnostics : Diagnostics;
    private readonly lexer : Lexer;
    private readonly source : SourceText;
    private readonly tokens : Token[];
    private position : number;
    private isErrorRecovery : boolean;

    constructor(source : SourceText) {
        this.source = source;
        this.lexer = new Lexer(source);
        this.tokens = [];
        this.position = 0;
        this.isErrorRecovery = false;
        
        let token: Token;
        do
        {
            token = this.lexer.lex();

            let badTokens = [];
            while(token.kind == SyntaxType.BadToken)
            {
                badTokens.push(token);
                token = this.lexer.lex();
            }

            if(badTokens.length > 0)
            {
                const trivia = this.createSkippedTokensTrivia(badTokens);
                token = token.withLeadingTrivia(trivia);
            }

            if(SyntaxFacts.isTrivia(token.kind))
                continue;
            
            this.tokens.push(token);
        }while(token.kind != SyntaxType.Eof);   
        
        this._diagnostics = new Diagnostics(source, this.lexer.diagnostics);
    }

    private createSkippedTokensTrivia(tokens : Token []) : SyntaxTrivia[]
    {
        if(tokens.length == 0)
            throw new Error("Tokens no populated");

        let trivia : SyntaxTrivia[] = [];

        for(let i = 0; i < tokens.length; i++)
        {
            let token = tokens[i];

            trivia = trivia.concat(token.leadingTrivia);
            trivia.push(new SyntaxTrivia(SyntaxType.SkippedTokensTrivia, token.lexeme, token.span.start, token.span.end - token.span.start));
            trivia = trivia.concat(token.trailingTrivia);
        }

        return trivia;
    }

    private next() : Token
    {
        const current = this.tokens[this.position];
        this.position++;
        return current;
    }

    private peek(ahead:number) : Token
    {
        const index = this.position + ahead;

        if(index >= this.tokens.length)
            return this.tokens[index - 1];

        return this.tokens[index];
    }

    private peekType(ahead:number = 0) : SyntaxType
    {
        const token = this.peek(ahead);
        return token.kind;
    }

    private get current() : Token
    {
        return this.peek(0);
    }

    private match(type : SyntaxType) : Token
    {
        if(this.current.kind == type)
            return this.next();

        this.isErrorRecovery = true;
        this._diagnostics.reportUnexpectedToken(type, this.current.kind, this.current.span);

        const text = SyntaxFacts.GetText(type) || "";

        return new Token(type, text, this.current.position, this.current.line, this.current.character, [], []);
    }

    private matchAny(...types : SyntaxType[]) : Token
    {        
        if(this.peekAny(...types))
            return this.next();

        this.isErrorRecovery = true;
        this._diagnostics.reportUnexpectedToken(types, this.current.kind, this.current.span);

        const text = SyntaxFacts.GetText(types[0]);

        return new Token(types[0], text, this.current.position, this.current.line, this.current.character, [], []);    
    }
    
    private peekAny(...types : SyntaxType[]) : boolean
    {        
        return types.filter( t => t == this.current.kind).length > 0;
    }
    
    public parse() : CompilationUnit
    {
        try
        {
            const declarations = this.parseDeclarations(false);
            const eofToken = this.match(SyntaxType.Eof);
            
            const compilationUnitSyntax = AST.CompilationUnitSyntax(declarations, eofToken);

            return new CompilationUnit(compilationUnitSyntax, this._diagnostics);
        }        
        catch(e)
        {
            if(e.message != "Unexpected EOF encountered")                
                this._diagnostics.report("unexpected exception " + e.match, DiagnosticType.CompilerError, new TextSpan(this.source.length, 0));

            return new CompilationUnit(
                AST.CompilationUnitSyntax([], new Token(SyntaxType.Eof, "", 0, 0, 0, [], [])), 
                this._diagnostics);
        }                    
    }

    private synchronise(...expectedTokenTypes : SyntaxType[]) : Token[]
    {
        const skippedTokens : Token[] = [];

        while(expectedTokenTypes.filter( t => t == this.current.kind).length === 0 )
        {
            this._diagnostics.reportUnexpectedToken(expectedTokenTypes, this.current.kind, this.current.span );

            const skippedToken = this.next();
            skippedTokens.push(skippedToken);
        }

        if(skippedTokens.length > 0)
        {
            
            const trivia = this.createSkippedTokensTrivia(skippedTokens);
            this.tokens[this.position] = this.current.withLeadingTrivia(trivia);            
        }

        this.isErrorRecovery = false;

        return skippedTokens;
    }
    
    private parseStructMemberDeclarations() : AST.StructMemberDeclarationStatementSyntax[]
    {
        const members : AST.StructMemberDeclarationStatementSyntax[] = [];
        
        while(this.peekType() !== SyntaxType.RightBrace)
        {
            members.push(this.parseStructMemberDeclaration());
        }

        return members;
    }

    private parseStructMemberDeclaration() : AST.StructMemberDeclarationStatementSyntax
    {
        const identifier = this.match(SyntaxType.Identifier);

        const colonToken = this.match(SyntaxType.Colon);
        
        const typeDeclaration = this.parsePredefinedTypeOrIdentifier();

        const semiColon = this.match(SyntaxType.SemiColon);

        return AST.StructMemberDeclarationStatementSyntax(identifier, colonToken, typeDeclaration, semiColon);
    }

    private parseDeclarations(insideClass : boolean) : AST.DeclarationSyntax[]
    {
        const declarations : AST.DeclarationSyntax[] = [];

        let lastTokenPosition : number = -1;
        
        while(true)
        {
            const d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;

            const expectedTokens = [SyntaxType.Eof, SyntaxType.StructKeyword, SyntaxType.UnionKeyword, SyntaxType.ClassKeyword, SyntaxType.FuncKeyword, SyntaxType.LetKeyword, SyntaxType.VarKeyword];
            if(insideClass)
                expectedTokens.push(SyntaxType.RightBrace);
            this.synchronise(...expectedTokens);

            switch(this.current.kind)
            {
                case SyntaxType.ClassKeyword:
                    declarations.push( this.parseClassDeclaration() );
                    break;
                case SyntaxType.StructKeyword:
                case SyntaxType.UnionKeyword:
                    declarations.push( this.parseStructOrUnionDeclaration() );
                break;                
                case SyntaxType.FuncKeyword:
                    declarations.push( this.parseFunctionDeclaration() );
                    break;
                case SyntaxType.LetKeyword:
                case SyntaxType.VarKeyword:
                    declarations.push( this.parseVariableDeclarationStatement() );
                    break;
                default:
                    return declarations;
            }                    
        }        
    }

    parseClassDeclaration(): AST.ClassDeclarationStatementSyntax {
        
        const classKeyword = this.match(SyntaxType.ClassKeyword);
        const name = this.match(SyntaxType.Identifier);
        const leftBrace = this.match(SyntaxType.LeftBrace);
        
        const declarations : AST.DeclarationSyntax[] = this.parseDeclarations(true);
        
        const rightBrace = this.match(SyntaxType.RightBrace);
        
        return AST.ClassDeclarationStatementSyntax(classKeyword, name, leftBrace, declarations, rightBrace);
    }

    parseStructOrUnionDeclaration(): AST.StructOrUnionDeclarationStatementSyntax
    {
        const keyword = this.matchAny(SyntaxType.StructKeyword, SyntaxType.UnionKeyword);

        const name = this.match(SyntaxType.Identifier);
        const leftBrace = this.match(SyntaxType.LeftBrace);
        
        const declarations = this.parseStructMemberDeclarations();
        
        const rightBrace = this.match(SyntaxType.RightBrace);
        
        return AST.StructOrUnionDeclarationStatementSyntax(keyword, name, leftBrace, declarations, rightBrace);
    }

    private parseFunctionDeclaration() : AST.DeclarationSyntax
    {
        const funcKeyword = this.match(SyntaxType.FuncKeyword);
        const name = this.match(SyntaxType.Identifier);
        const parameterList = this.parseFuncionParameterList();

        const colonToken = this.match(SyntaxType.Colon);
        const returnType = this.parsePredefinedTypeOrIdentifier();

        if(this.current.kind == SyntaxType.LeftBrace)
        {
            const body = this.parseBlockStatement();
            return AST.FunctionDeclarationStatementSyntax(funcKeyword, name, parameterList, colonToken, returnType, body );
        }
        else if(this.current.kind == SyntaxType.FatArrow)        
        {
            const fatArrow = this.match(SyntaxType.FatArrow);
            const expression = this.parseExpression();
            const semiColon = this.match(SyntaxType.SemiColon);

            return AST.LambdaDeclarationStatementSyntax(funcKeyword, name, parameterList, colonToken, returnType, fatArrow, expression );
        }
        else
        {
            this._diagnostics.reportInvalidFunctionDefinition(name, funcKeyword, this.current);

            return AST.FunctionDeclarationStatementSyntax(funcKeyword,
                new Token(SyntaxType.Identifier, name.lexeme + "<CONTAINS ERRORS>", name.position, name.line, name.character),
                parameterList, 
                new Token(SyntaxType.Colon, ":", 0, 0, 0),
                AST.NamedTypeSyntax(new Token(SyntaxType.IntKeyword, "int", 0, 0, 0), true),
                AST.BlockStatementSyntax(
                    new Token(SyntaxType.LeftBrace, "{", 0,0,0),
                    [
                        AST.ReturnStatementSyntax(
                            new Token(SyntaxType.ReturnKeyword, "return", 0, 0, 0),
                            AST.IntegerLiteralExpressionSyntax(
                                new Token(SyntaxType.IntKeyword, "1", 0, 0, 0)
                            ),
                            new Token(SyntaxType.SemiColon, ";", 0, 0, 0)
                        )
                    ],
                    new Token(SyntaxType.RightBrace, "}", 0,0,0),
                ));
        }
    }

    parsePredefinedTypeOrIdentifier() : AST.TypeSyntax {
        const token = this.peek(0);

        switch(token.kind)
        {
            case SyntaxType.Identifier:
                return AST.NamedTypeSyntax(this.match(SyntaxType.Identifier), false);
            case SyntaxType.IntKeyword:
            case SyntaxType.FloatKeyword:
            case SyntaxType.StringKeyword:
            case SyntaxType.BoolKeyword:
            case SyntaxType.ByteKeyword:
                this.next();
                return AST.NamedTypeSyntax(token, true);
            case SyntaxType.Star:
            {
                const starToken = this.next();
                const type = this.parsePredefinedTypeOrIdentifier();
            
                return AST.PointerTypeSyntax(starToken, type);
            }
            case SyntaxType.LeftSquareBracket:
            {
                const leftBracket = this.next();
                const length = this.parseExpression();
                const rightBracket = this.next();
                const elementType = this.parsePredefinedTypeOrIdentifier();

                return AST.ArrayTypeSyntax(leftBracket, length, rightBracket, elementType);
            }
            default:
                this.next();
                this._diagnostics.reportInvalidTypeName(token);
                return AST.NamedTypeSyntax(new Token(SyntaxType.Identifier, 
                    token.lexeme, 
                    token.position, 
                    token.line, 
                    token.character, 
                    token.leadingTrivia, 
                    token.trailingTrivia), false)
        }
    }

    parseFuncionParameterList(): AST.ParameterDeclarationListSyntax {
        const leftParen = this.match(SyntaxType.LeftParen);

        const parameters : AST.ParameterDeclarationSyntax[] = [];

        let previousParam : AST.ParameterDeclarationSyntax | null = null;

        if(this.current.kind != SyntaxType.RightParen)
        {
            const p = this.parseParameterDeclaration();
            previousParam = p;
            parameters.push(p);
        }
        
        let lastTokenPosition : number = -1;        
        while(this.current.kind != SyntaxType.RightParen)
        {        
            const d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;

            if(this.current.kind == SyntaxType.Eof)
                throw new ExpectedEofException(this.current);    
            
            const commaToken = this.match(SyntaxType.Comma);
            if(!!previousParam)
                previousParam.comma = commaToken;

            const parameterDeclaration = this.parseParameterDeclaration();
            parameters.push(parameterDeclaration);
            previousParam = parameterDeclaration;
        }

        const rightParen = this.match(SyntaxType.RightParen);

        return AST.ParameterDeclarationListSyntax(leftParen, parameters, rightParen);
    }

    parseParameterDeclaration(): AST.ParameterDeclarationSyntax {
        const identifier = this.match(SyntaxType.Identifier);
        const colonToken = this.match(SyntaxType.Colon);
        const typeDeclaration = this.parsePredefinedTypeOrIdentifier();
        return AST.ParameterDeclarationSyntax(identifier, colonToken, typeDeclaration);
    }

    private parseStatement() : AST.StatementNode
    {
        switch(this.current.kind)
        {
            case SyntaxType.LeftBrace:
                return this.parseBlockStatement();
            case SyntaxType.IfKeyword:
                return this.parseIfStatement();
            case SyntaxType.ForKeyword:
                return this.parseForStatement();
            case SyntaxType.WhileKeyword:
                return this.parseWhileStatement();                               
            case SyntaxType.ContinueKeyword:
                return this.parseContinueStatement();
            case SyntaxType.BreakKeyword:
                return this.parseBreakStatement();                
            case SyntaxType.ReturnKeyword:
                return this.parseReturnStatement();
            case SyntaxType.VarKeyword:
            case SyntaxType.LetKeyword:                        
                return this.parseVariableDeclarationStatement();                                                
            default:
                return this.parseExpressionStatement();
        }
    }

    parseVariableDeclarationStatement(): AST.VariableDeclarationSyntax {
        const typeQualifier = this.matchAny(SyntaxType.LetKeyword, SyntaxType.VarKeyword);
        const identifier = this.match(SyntaxType.Identifier);

        let typeDeclaration : AST.TypeSyntax | undefined = undefined;
        let colonToken : Token | undefined = undefined;
        
        if(this.current.kind == SyntaxType.Colon)
        {
            colonToken = this.match(SyntaxType.Colon);
            // we have a type declaration
            typeDeclaration = this.parsePredefinedTypeOrIdentifier();
        }

        let equalsToken : Token | undefined = undefined;
        let initialisationExpression : AST.ExpressionNode | undefined = undefined;

        if(this.current.kind == SyntaxType.Equals)
        {
            equalsToken = this.match(SyntaxType.Equals);
            // we have a type declaration
            initialisationExpression = this.parseExpression();
        }

        this.match(SyntaxType.SemiColon);

        return AST.VariableDeclarationSyntax(typeQualifier, identifier, colonToken, typeDeclaration, equalsToken, initialisationExpression, undefined );
    }
    
    parseReturnStatement(): AST.StatementNode {
        const returnToken = this.match(SyntaxType.ReturnKeyword);
        
        if(this.current.kind == SyntaxType.SemiColon)
        {
            const semiColonToken = this.match(SyntaxType.SemiColon);
            return AST.ReturnStatementSyntax(returnToken, undefined, semiColonToken);
        }

        const expression = this.parseExpression();
        const semiColonToken = this.match(SyntaxType.SemiColon);
        return AST.ReturnStatementSyntax(returnToken, expression, semiColonToken);
    }

    private parseBlockStatement(): AST.BlockStatementSyntax {
        const statements : AST.StatementNode[] = [];

        const openBraceToken = this.match(SyntaxType.LeftBrace);
        let lastTokenPosition : number = -1;        
        
        while(this.current.kind != SyntaxType.Eof &&
              this.current.kind != SyntaxType.RightBrace)
        {
            const d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;

            const startToken = this.current;
            
            const statement = this.parseStatement();
            statements.push(statement);

            if(this.current == startToken)
                this.next();
        }

        const closingBrace = this.match(SyntaxType.RightBrace);

        return AST.BlockStatementSyntax(openBraceToken, statements, closingBrace);
    }

    private parseIfStatement(): AST.IfStatementSyntax {
        const keyword = this.match(SyntaxType.IfKeyword);
        const condition = this.parseExpression();
        const trueBranch = this.parseStatement();
        const falseBranch = this.parseElseClause();

        return AST.IfStatementSyntax(keyword, condition, trueBranch, falseBranch);
    }

    private parseExpression(): AST.ExpressionNode {
        return this.parseBinaryExpression();
    }

    private parseAssignmentExpression(): { statement : AST.StatementNode|null, expression : AST.ExpressionNode|null } 
    {
        const left = this.parseExpression();

        // are we doing an assignment?
        if(this.peek(0).kind == SyntaxType.Equals)
        {
            let expression : AST.AddressableExpressionNode;

            // make sure the expression is addressable
            if(AST.isAddressable(left))
                expression = left;
            else
            {
                this._diagnostics.reportAssignmentRequiresLValue(left.kind, left.span());
                return { expression: left, statement:null };
            }
    
            // parse out the remainder of the assignment
            const operatorToken = this.next();
            const right = this.parseExpression();
            const semiColon = this.match(SyntaxType.SemiColon);

            return {
                expression : null,
                statement : AST.AssignmentStatementSyntax(expression, operatorToken, right)
            };
        }
        
        return {
            expression : left,
            statement : null
        };
    }

    /*
    private parseAssignmentExpression(): { statement : AST.StatementNode|null, expression : AST.ExpressionNode|null } {
        // are we doing a straight variable assignment?
        // this is the fast path.
        if(this.peek(0).kind == SyntaxType.Identifier && 
           this.peek(1).kind == SyntaxType.Equals)
        {
            const identifierToken = this.next();
            const operatorToken = this.next();
            const right = this.parseBinaryExpression();
            const semiColon = this.match(SyntaxType.SemiColon);

            return {
                expression : null,
                statement : AST.AssignmentStatementSyntax(identifierToken, operatorToken, right)
            };
        }

        // either a more complex assignment or an expression statement of some type.
        const expression = this.parseBinaryExpression();

        // are we are assigning to the expression returned?                
        if(this.peek(0).kind == SyntaxType.Equals)
        {
        
            switch(expression.kind)
            {
                // if we did one or more dot expressions
                case "GetExpressionSyntax":
                {
                    // convert the get expression into a set expression
                    const equalsToken = this.next();
                    const right = this.parseExpression();
                    const semiColon = this.match(SyntaxType.SemiColon);
                    return {
                        expression : null,
                        statement : AST.SetStatementSyntax(expression, equalsToken, right)
                    };                    
                }
                case "UnaryExpressionSyntax":
                {
                    const equalsToken = this.next();

                    // if we are dereferencing some pointer arithmatic
                    if(expression.operatorToken.lexeme === "*")
                    {
                        const right = this.parseBinaryExpression();
                        const semiColon = this.match(SyntaxType.SemiColon);
                        
                        return {
                            expression : null,
                            statement : AST.DereferenceAssignmentStatementSyntax(expression, equalsToken, right)
                        };
                    }
                }
                default:
                {
                    this._diagnostics.reportAssignmentRequiresLValue(expression.kind, expression.span());                    
                }
            }
        }

        return {
            expression : expression,
            statement : null
        };
    }*/

    private parseBinaryExpression(parentPrecedence : number = 0): AST.ExpressionNode {
        let left : AST.ExpressionNode;

        const unaryOperatorPrecedence = SyntaxFacts.GetUnaryOperatorPrecedence(this.current.kind);

        if(unaryOperatorPrecedence != 0 && unaryOperatorPrecedence >= parentPrecedence)
        {
            const operatorToken = this.next();
            const operand = this.parseBinaryExpression(unaryOperatorPrecedence);

            // is this a dereference?
            if(operatorToken.kind === SyntaxType.Star)
                // we give dereferences their own ast node type to track
                // assignments more easily.
                left = AST.DereferenceExpressionSyntax(operatorToken, operand);
            else
                // all other unary operators are handled by the same node.
                left = AST.UnaryExpressionSyntax(operatorToken, operand);
        }
        else
        {
            left = this.parsePrimaryExpression();
        }

        let lastTokenPosition : number = -1;        

        while(true)
        {
            const d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;
    
            const precedence = SyntaxFacts.GetBinaryOperatorPrecedence(this.current.kind); 

            if(precedence == 0 || precedence <= parentPrecedence)
                break;

            const operatorToken = this.next();

            if (operatorToken.kind == SyntaxType.Dot) 
            {              
                let name = this.match(SyntaxType.Identifier);

                left = AST.GetExpressionSyntax(left, operatorToken, name);       
            }
            else
            {
                const right = this.parseBinaryExpression(precedence);
                left = AST.BinaryExpressionSyntax(left, operatorToken, right);
            }
        }

        return left;
    }

    private parsePrimaryExpression(): AST.ExpressionNode {
        switch(this.current.kind)
        {
            case SyntaxType.LeftParen : 
            {
                const expr = this.parseParenthesizedExpression();

                if(this.peekType() === SyntaxType.LeftSquareBracket)
                    return this.parseArrayIndexExpressionSyntax(expr); 
                
                return expr;
            }
            case SyntaxType.TrueKeyword : 
            case SyntaxType.FalseKeyword : 
                return this.parseBooleanLiteral();                
            case SyntaxType.IntegerLiteral : 
                return this.parseIntegerLiteral();
            case SyntaxType.FloatLiteral : 
                return this.parseFloatLiteral();
            case SyntaxType.StringLiteral :
                return this.parseStringLiteral();
            case SyntaxType.NullKeyword :
                return this.parseNullLiteral();                
            case SyntaxType.Identifier:
            case SyntaxType.StringKeyword:
            case SyntaxType.IntKeyword:
            case SyntaxType.FloatKeyword:
            case SyntaxType.BoolKeyword:
            case SyntaxType.ByteKeyword:
                return this.parseCallExpression();
            default :
                return this.parseNameExpression();
        }
    }

    private parseParenthesizedExpression(): AST.ExpressionNode {
        const left = this.match(SyntaxType.LeftParen);
        const expression = this.parseExpression();
        const right = this.match(SyntaxType.RightParen);
        return AST.ParenthesizedExpressionSyntax(left, expression, right);
    }

    private parseBooleanLiteral(): AST.ExpressionNode {
        const token = this.matchAny(SyntaxType.TrueKeyword, SyntaxType.FalseKeyword);
        return AST.BooleanLiteralExpressionSyntax(token);
    }

    private parseFloatLiteral(): AST.ExpressionNode {
        const token = this.match(SyntaxType.FloatLiteral);
        return AST.FloatLiteralExpressionSyntax(token);
    }

    private parseIntegerLiteral(): AST.ExpressionNode {
        const token = this.match(SyntaxType.IntegerLiteral);
        return AST.IntegerLiteralExpressionSyntax(token);
    }

    private parseStringLiteral(): AST.ExpressionNode {
        const token = this.match(SyntaxType.StringLiteral);
        return AST.StringLiteralExpressionSyntax(token);
    }

    private parseNullLiteral(): AST.ExpressionNode {
        const token = this.match(SyntaxType.NullKeyword);
        return AST.NullLiteralExpressionSyntax(token);
    } 
    
    private parseCallExpression(): AST.ExpressionNode {        
        
        const identifier = this.matchAny(
            SyntaxType.Identifier,
            SyntaxType.IntKeyword,
            SyntaxType.FloatKeyword,
            SyntaxType.BoolKeyword,
            SyntaxType.StringKeyword,
            SyntaxType.ByteKeyword,
        );

        let expr : AST.ExpressionNode = AST.NameExpressionSyntax(identifier);

        let lastTokenPosition : number = -1;        

        while(true)
        {
            const d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;
    
            if(this.peekType() == SyntaxType.LeftParen)
            {
                expr = this.parseCallExpressionRemainder(expr as AST.NameExpressionSyntax);
            } 
            else if (this.peekType() == SyntaxType.Dot) 
            {              
                let dotToken = this.match(SyntaxType.Dot);
                let name = this.match(SyntaxType.Identifier);

                expr = AST.GetExpressionSyntax(expr, dotToken, name);       
            }
            else if (this.peekType() == SyntaxType.LeftSquareBracket) 
            {              
                expr = this.parseArrayIndexExpressionSyntax(expr);                
            }            
            else
                break;  
        } 

        return expr;
    }

    private parseArrayIndexExpressionSyntax(expr: AST.ExpressionNode): AST.ExpressionNode  {
        let leftBracket = this.match(SyntaxType.LeftSquareBracket);
        let indexExpression = this.parseExpression();
        let rightBracket = this.match(SyntaxType.RightSquareBracket);
        // make sure the expression is addressable
        if (AST.isAddressable(expr))
            expr = AST.ArrayIndexExpressionSyntax(expr, leftBracket, indexExpression, rightBracket);
        else {
            this._diagnostics.reportAssignmentRequiresLValue(expr.kind, expr.span());
        }
        return expr;
    }

    private parseCallExpressionRemainder(name: AST.NameExpressionSyntax): AST.ExpressionNode {
        const leftParenToken = this.match(SyntaxType.LeftParen);

        const callArguments : AST.ExpressionNode[] = [];

        if(this.peekType() != SyntaxType.RightParen)
        {
            do
            {
                callArguments.push(this.parseExpression());
                
                if(this.peekType() == SyntaxType.Comma)
                    this.match(SyntaxType.Comma)
                else
                    break;
            } while(true);
        }

        const rightParenToken = this.match(SyntaxType.RightParen);

        return AST.CallExpressionSyntax(name, leftParenToken, callArguments, rightParenToken);
    }

    private parseNameExpression(): AST.ExpressionNode {
        const identifier = this.match(SyntaxType.Identifier);
        return AST.NameExpressionSyntax(identifier);
    }

    private parseElseClause(): AST.ElseStatementSyntax | null {
        if(this.current.kind != SyntaxType.ElseKeyword)
            return null;

        const keyword = this.next();
        const statement = this.parseStatement();
        return AST.ElseStatementSyntax(keyword, statement);
    }

    private parseForStatement(): AST.ForStatementSyntax {
        const forKeyword = this.match(SyntaxType.ForKeyword);
        const letToken = this.match(SyntaxType.LetKeyword);
        const identifier = this.match(SyntaxType.Identifier);
        const inToken = this.match(SyntaxType.InKeyword);
        const lowerBound = this.parseExpression();
        const toKeyword = this.match(SyntaxType.ToKeyword);
        const upperBound = this.parseExpression();
        const body = this.parseStatement();

        return AST.ForStatementSyntax(forKeyword, letToken, identifier, inToken, lowerBound, toKeyword, upperBound, body);
    }    

    private parseWhileStatement(): AST.WhileStatementSyntax {
        const whileKeyword = this.match(SyntaxType.WhileKeyword);
        const condition = this.parseExpression();
        const body = this.parseStatement();

        return AST.WhileStatementSyntax(whileKeyword, condition, body);
    } 

    private parseBreakStatement() : AST.BreakStatementSyntax
    {
        const keyword = this.match(SyntaxType.BreakKeyword);
        return AST.BreakStatementSyntax(keyword);
    }

    private parseContinueStatement() : AST.ContinueStatementSyntax
    {
        const keyword = this.match(SyntaxType.ContinueKeyword);
        return AST.ContinueStatementSyntax(keyword);
    }

    private parseExpressionStatement(): AST.StatementNode {
        const {statement, expression} = this.parseAssignmentExpression();

        if(expression)
        {
            switch(expression.kind)
            {
                case "CallExpressionSyntax":
                    break;
                default:
                    this._diagnostics.reportUnexpectedStatementExpression(expression.span());
            }

            const semiColonToken = this.match(SyntaxType.SemiColon);
            return AST.ExpressionStatementSyntax(expression, semiColonToken);
        }
        else if(statement)
        {
            switch(statement.kind)
            {                
                case "AssignmentStatementSyntax":               
                    break;
                default:
                    this._diagnostics.reportUnexpectedStatementExpression(statement.span());
            }

            return statement;

        }        
        else
            throw new Error("parseAssignmentExpression returned no valid objects");
    }
 
    isMakingProgress(lastTokenPosition : number) : { progress : boolean, newPosition : number }
    {
        const pos = this.current.position;

        if (pos > lastTokenPosition)
        {
            lastTokenPosition = pos;
            return { progress:true, newPosition:lastTokenPosition };
        }

        return { progress:false, newPosition:lastTokenPosition };
    }
}