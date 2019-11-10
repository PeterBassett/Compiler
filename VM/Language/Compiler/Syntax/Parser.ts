import { Lexer, Token, SyntaxTrivia } from "./Lexer";
import SourceText from "./Text/SourceText";
import CompilationUnit from "./CompilationUnit";
import { SyntaxType } from "./SyntaxType";
import * as SyntaxFacts from "./SyntaxFacts";
import * as AST from "./AST/ASTNode";
import { Diagnostics, DiagnosticType } from "../Diagnostics/Diagnostics";
import { symbol } from "prop-types";
import TextSpan from "./Text/TextSpan";
import { Identifier } from "../../Scope/DefinitionScope";

class ExpectedEofException extends Error
{
    public value:Token;
    constructor(value:Token)
    {
        super("Unexpected EOF encountered");
        this.value = value;
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
                var trivia = this.createSkippedTokensTrivia(badTokens);
                token = token.withLeadingTrivia(trivia);
            }

            if(SyntaxFacts.isTrivia(token.kind))
                continue;
            
            this.tokens.push(token);
        }while(token.kind!= SyntaxType.Eof);   
        
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
        let current = this.tokens[this.position];
        this.position++;
        return current;
    }

    private peek(ahead:number) : Token
    {
        let index = this.position + ahead;

        if(index >= this.tokens.length)
            return this.tokens[index - 1];

        return this.tokens[index];
    }

    private peekType(ahead:number = 0) : SyntaxType
    {
        let token = this.peek(ahead);
        return token.kind
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

        let text = SyntaxFacts.GetText(type) || "";
        // fabricate a synthetic token matching what we expect.
        return new Token(type, text, this.current.position, this.current.line, this.current.character, [], []);
    }

    private matchAny(...types : SyntaxType[]) : Token
    {        
        if(types.filter( t => t == this.current.kind))
            return this.next();

        this.isErrorRecovery = true;
        this._diagnostics.reportUnexpectedToken(types, this.current.kind, this.current.span);

        let text = SyntaxFacts.GetText(types[0]);
        // fabricate a synthetic token matching what we expect.
        return new Token(types[0], text, this.current.position, this.current.line, this.current.character, [], []);    
    } 

    public parse() : CompilationUnit
    {
        try
        {
            let declarations = this.parseDeclarations(false);
            let eofToken = this.match(SyntaxType.Eof);
            
            let compilationUnitSyntax = AST.CompilationUnitSyntax(declarations, eofToken);

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
        let skippedTokens : Token[] = [];

        while(expectedTokenTypes.filter( t => t == this.current.kind).length === 0 )
        {
            this._diagnostics.reportUnexpectedToken(expectedTokenTypes, this.current.kind, this.current.span );

            let skippedToken = this.next();
            skippedTokens.push(skippedToken);
        }

        if(skippedTokens.length > 0)
        {
            
            var trivia = this.createSkippedTokensTrivia(skippedTokens);
            this.tokens[this.position] = this.current.withLeadingTrivia(trivia);            
        }

        this.isErrorRecovery = false;

        return skippedTokens;
    }
    
    private parseStructMemberDeclarations() : AST.StructMemberDeclarationStatementSyntax[]
    {
        let members : AST.StructMemberDeclarationStatementSyntax[] = [];
        while(!this.peekType(SyntaxType.SemiColon))
        {
            members.push(this.parseStructMemberDeclaration());
        }
        return members;
    }

    private parseStructMemberDeclaration() : AST.StructMemberDeclarationStatementSyntax
    {
        let identifier = this.match(SyntaxType.Identifier);

        let colonToken = this.match(SyntaxType.Colon);
        
        let typeDeclaration = this.parsePredefinedTypeOrIdentifier();

        let semiColon = this.match(SyntaxType.SemiColon);

        return AST.StructMemberDeclarationStatementSyntax(identifier, colonToken, typeDeclaration, semiColon);
    }

    private parseDeclarations(insideClass : boolean) : AST.DeclarationSyntax[]
    {
        let declarations : AST.DeclarationSyntax[] = [];

        let lastTokenPosition : number = -1;
        
        while(true)
        {
            let d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;

            let expectedTokens = [SyntaxType.Eof, /*SyntaxType.StructKeyword,*/ SyntaxType.ClassKeyword, SyntaxType.FuncKeyword, SyntaxType.LetKeyword, SyntaxType.VarKeyword];
            if(insideClass)
                expectedTokens.push(SyntaxType.RightBrace);
            this.synchronise(...expectedTokens);

            switch(this.current.kind)
            {
                case SyntaxType.ClassKeyword:
                    declarations.push( this.parseClassDeclaration() );
                break;
               // case SyntaxType.StructKeyword:
                //    declarations.push( this.parseStructDeclaration() );
                //break;                
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
        
        let classKeyword = this.match(SyntaxType.ClassKeyword);
        let name = this.match(SyntaxType.Identifier);
        let leftBrace = this.match(SyntaxType.LeftBrace);
        
        let declarations : AST.DeclarationSyntax[] = this.parseDeclarations(true);
        
        let rightBrace = this.match(SyntaxType.RightBrace);
        
        return AST.ClassDeclarationStatementSyntax(classKeyword, name, leftBrace, declarations, rightBrace);
    }

    parseStructDeclaration(): AST.StructDeclarationStatementSyntax
    {        
        throw new Error("Not implemented");
        /*
        let structKeyword = this.match(SyntaxType.StructKeyword);
        let name = this.match(SyntaxType.Identifier);
        let leftBrace = this.match(SyntaxType.LeftBrace);
        
        let declarations : AST.DeclarationSyntax[] = this.parseStructMemberDeclarations();
        
        let rightBrace = this.match(SyntaxType.RightBrace);
        
        return AST.StructDeclarationStatementSyntax(structKeyword, name, leftBrace, declarations, rightBrace); */
    }

    private parseFunctionDeclaration() : AST.DeclarationSyntax
    {
        let funcKeyword = this.match(SyntaxType.FuncKeyword);
        let name = this.match(SyntaxType.Identifier);
        let parameterList = this.parseFuncionParameterList();

        let colonToken = this.match(SyntaxType.Colon);
        let returnType = this.parsePredefinedTypeOrIdentifier();

        if(this.current.kind == SyntaxType.LeftBrace)
        {
            let body = this.parseBlockStatement();
            return AST.FunctionDeclarationStatementSyntax(funcKeyword, name, parameterList, colonToken, returnType, body );
        }
        else if(this.current.kind == SyntaxType.FatArrow)        
        {
            let fatArrow = this.match(SyntaxType.FatArrow);
            let expression = this.parseExpression();
            let semiColon = this.match(SyntaxType.SemiColon);

            return AST.LambdaDeclarationStatementSyntax(funcKeyword, name, parameterList, colonToken, returnType, fatArrow, expression );
        }
        else
        {
            this._diagnostics.reportInvalidFunctionDefinition(name, funcKeyword, this.current);

            return AST.FunctionDeclarationStatementSyntax(funcKeyword,
                new Token(SyntaxType.Identifier, name.lexeme + "<CONTAINS ERRORS>", name.position, name.line, name.character),
                parameterList, 
                new Token(SyntaxType.Colon, ":", 0, 0, 0),
                AST.TypeNameSyntax(null, new Token(SyntaxType.IntKeyword, "int", 0, 0, 0), true),
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

    parsePredefinedTypeOrIdentifier() : AST.TypeNameSyntax {
        let token = this.peek(0);

        switch(token.kind)
        {
            case SyntaxType.Identifier:
                return AST.TypeNameSyntax(null, this.match(SyntaxType.Identifier), false);
            case SyntaxType.IntKeyword:
            case SyntaxType.FloatKeyword:
            case SyntaxType.StringKeyword:
            case SyntaxType.BoolKeyword:
                this.next();
                return AST.TypeNameSyntax(null, token, true);
            default:
                this.next();
                this._diagnostics.reportInvalidTypeName(token);
                return AST.TypeNameSyntax(null, new Token(SyntaxType.Identifier, 
                    token.lexeme, 
                    token.position, 
                    token.line, 
                    token.character, 
                    token.leadingTrivia, 
                    token.trailingTrivia), false)
        }
    }

    parseFuncionParameterList(): AST.ParameterDeclarationListSyntax {
        let leftParen = this.match(SyntaxType.LeftParen);

        let parameters : AST.ParameterDeclarationSyntax[] = [];

        let previousParam : AST.ParameterDeclarationSyntax | null = null;

        if(this.current.kind!= SyntaxType.RightParen)
        {
            let p = this.parseParameterDeclaration();
            previousParam = p;
            parameters.push(p);
        }
        
        let lastTokenPosition : number = -1;        
        while(this.current.kind!= SyntaxType.RightParen)
        {        
            let d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;

            if(this.current.kind== SyntaxType.Eof)
                throw new ExpectedEofException(this.current);    
            
            let commaToken = this.match(SyntaxType.Comma);
            if(!!previousParam)
                previousParam.comma = commaToken;

            let parameterDeclaration = this.parseParameterDeclaration();
            parameters.push(parameterDeclaration);
            previousParam = parameterDeclaration;
        }

        let rightParen = this.match(SyntaxType.RightParen);

        return AST.ParameterDeclarationListSyntax(leftParen, parameters, rightParen);
    }

    parseParameterDeclaration(): AST.ParameterDeclarationSyntax {
        let identifier = this.match(SyntaxType.Identifier);
        let colonToken = this.match(SyntaxType.Colon);
        let typeDeclaration = this.parsePredefinedTypeOrIdentifier();
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
        let typeQualifier = this.matchAny(SyntaxType.LetKeyword, SyntaxType.VarKeyword);
        let identifier = this.match(SyntaxType.Identifier);

        let typeDeclaration : AST.TypeNameSyntax | undefined = undefined;
        let colonToken : Token | undefined = undefined;
        if(this.current.kind== SyntaxType.Colon)
        {
            colonToken = this.match(SyntaxType.Colon);
            // we have a type declaration
            typeDeclaration = this.parsePredefinedTypeOrIdentifier();
        }
        let equalsToken : Token | undefined = undefined;
        let initialiseationExpression : AST.ExpressionNode | undefined = undefined;
        if(this.current.kind == SyntaxType.Equals)
        {
            equalsToken = this.match(SyntaxType.Equals);
            // we have a type declaration
            initialiseationExpression = this.parseExpression();
        }
        this.match(SyntaxType.SemiColon);

        return AST.VariableDeclarationSyntax(typeQualifier, identifier, colonToken, typeDeclaration, equalsToken, initialiseationExpression, undefined );
    }
    
    parseReturnStatement(): AST.StatementNode {
        let returnToken = this.match(SyntaxType.ReturnKeyword);
        
        if(this.current.kind== SyntaxType.SemiColon)
        {
            let semiColonToken = this.match(SyntaxType.SemiColon);
            return AST.ReturnStatementSyntax(returnToken, undefined, semiColonToken);
        }

        let expression = this.parseExpression();
        let semiColonToken = this.match(SyntaxType.SemiColon);
        return AST.ReturnStatementSyntax(returnToken, expression, semiColonToken);
    }

    private parseBlockStatement(): AST.BlockStatementSyntax {
        let statements : AST.StatementNode[] = [];

        let openBraceToken = this.match(SyntaxType.LeftBrace);
        let lastTokenPosition : number = -1;        
        
        while(this.current.kind!= SyntaxType.Eof &&
              this.current.kind!= SyntaxType.RightBrace)
        {
            let d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;

            let startToken = this.current;
            
            let statement = this.parseStatement();
            statements.push(statement);

            if(this.current == startToken)
                this.next();
        }

        let closingBrace = this.match(SyntaxType.RightBrace);

        return AST.BlockStatementSyntax(openBraceToken, statements, closingBrace);
    }

    private parseIfStatement(): AST.IfStatementSyntax {
        let keyword = this.match(SyntaxType.IfKeyword);
        let condition = this.parseExpression();
        let trueBranch = this.parseStatement();
        let falseBranch = this.parseElseClause();

        return AST.IfStatementSyntax(keyword, condition, trueBranch, falseBranch);
    }

    private parseExpression(): AST.ExpressionNode {
        return this.parseAssignmentExpression();
    }

    private parseAssignmentExpression(): AST.ExpressionNode {
        if(this.peek(0).kind== SyntaxType.Identifier && 
           this.peek(1).kind== SyntaxType.Equals)
        {
            let identifierToken = this.next();
            let operatorToken = this.next();
            let right = this.parseAssignmentExpression();

            return AST.AssignmentExpressionSyntax(identifierToken, operatorToken, right);
        }

        return this.parseBinaryExpression();
    }

    private parseBinaryExpression(parentPrecedence : number = 0): AST.ExpressionNode {
        let left : AST.ExpressionNode;

        var unaryOperatorPrecedence = SyntaxFacts.GetUnaryOperatorPrecedence(this.current.kind);

        if(unaryOperatorPrecedence != 0 && unaryOperatorPrecedence >= parentPrecedence)
        {
            let operatorToken = this.next();
            let operand = this.parseBinaryExpression(unaryOperatorPrecedence);
            left = AST.UnaryExpressionSyntax(operatorToken, operand);
        }
        else
        {
            left = this.parsePrimaryExpression();
        }

        let lastTokenPosition : number = -1;        

        while(true)
        {
            let d = this.isMakingProgress(lastTokenPosition);
            if(!d.progress)            
                throw new Error("NO PROGRESS");   
            lastTokenPosition = d.newPosition;
    
            let precedence = SyntaxFacts.GetBinaryOperatorPrecedence(this.current.kind); 

            if(precedence == 0 || precedence <= parentPrecedence)
                break;

            let operatorToken = this.next();
            let right = this.parseBinaryExpression(precedence);
            left = AST.BinaryExpressionSyntax(left, operatorToken, right);
        }

        return left;
    }

    private parsePrimaryExpression(): AST.ExpressionNode {
        switch(this.current.kind)
        {
            case SyntaxType.LeftParen : 
                return this.parseParenthesizedExpression();
            case SyntaxType.TrueKeyword : 
            case SyntaxType.FalseKeyword : 
                return this.parseBooleanLiteral();                
            case SyntaxType.IntegerLiteral : 
                return this.parseIntegerLiteral();
            case SyntaxType.FloatLiteral : 
                return this.parseFloatLiteral();
            case SyntaxType.StringLiteral :
                return this.parseStringLiteral();
            case SyntaxType.Identifier:
            case SyntaxType.StringKeyword:
            case SyntaxType.IntKeyword:
            case SyntaxType.FloatKeyword:
            case SyntaxType.BoolKeyword:
                return this.parseCallExpression();
            default :
                return this.parseNameExpression();
        }
    }

    private parseParenthesizedExpression(): AST.ExpressionNode {
        let left = this.match(SyntaxType.LeftParen);
        let expression = this.parseExpression();
        let right = this.match(SyntaxType.RightParen);
        return AST.ParenthesizedExpressionSyntax(left, expression, right);
    }

    private parseBooleanLiteral(): AST.ExpressionNode {
        let token = this.matchAny(SyntaxType.TrueKeyword, SyntaxType.FalseKeyword);
        return AST.BooleanLiteralExpressionSyntax(token);
    }

    private parseFloatLiteral(): AST.ExpressionNode {
        let token = this.match(SyntaxType.FloatLiteral);
        return AST.FloatLiteralExpressionSyntax(token);
    }

    private parseIntegerLiteral(): AST.ExpressionNode {
        let token = this.match(SyntaxType.IntegerLiteral);
        return AST.IntegerLiteralExpressionSyntax(token);
    }

    private parseStringLiteral(): AST.ExpressionNode {
        let token = this.match(SyntaxType.StringLiteral);
        return AST.StringLiteralExpressionSyntax(token);
    }
    
    private parseCallExpression(): AST.ExpressionNode {        
        
        let identifier = this.matchAny(
            SyntaxType.Identifier,
            SyntaxType.IntKeyword,
            SyntaxType.FloatKeyword,
            SyntaxType.BoolKeyword,
            SyntaxType.StringKeyword
        );

        let expr : AST.ExpressionNode = AST.NameExpressionSyntax(identifier);

        let lastTokenPosition : number = -1;        

        while(true)
        {
            let d = this.isMakingProgress(lastTokenPosition);
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
            else
                break;  
        } 

        return expr;
    }

    private parseCallExpressionRemainder(name: AST.NameExpressionSyntax): AST.ExpressionNode {
        let leftParenToken = this.match(SyntaxType.LeftParen);

        let callArguments : AST.ExpressionNode[] = [];

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

        let rightParenToken = this.match(SyntaxType.RightParen);

        return AST.CallExpressionSyntax(name, leftParenToken, callArguments, rightParenToken);
    }

    private parseNameExpression(): AST.ExpressionNode {
        let identifier = this.match(SyntaxType.Identifier);
        return AST.NameExpressionSyntax(identifier);
    }

    private parseElseClause(): AST.ElseStatementSyntax | null {
        if(this.current.kind!= SyntaxType.ElseKeyword)
            return null;

        let keyword = this.next();
        let statement = this.parseStatement();
        return AST.ElseStatementSyntax(keyword, statement);
    }

    private parseForStatement(): AST.ForStatementSyntax {
        let forKeyword = this.match(SyntaxType.ForKeyword);
        let letToken = this.match(SyntaxType.LetKeyword);
        let identifier = this.match(SyntaxType.Identifier);
        let inToken = this.match(SyntaxType.InKeyword);
        let lowerBound = this.parseExpression();
        let toKeyword = this.match(SyntaxType.ToKeyword);
        let upperBound = this.parseExpression();
        let body = this.parseStatement();

        return AST.ForStatementSyntax(forKeyword, letToken, identifier, inToken, lowerBound, toKeyword, upperBound, body);
    }    

    private parseWhileStatement(): AST.WhileStatementSyntax {
        let whileKeyword = this.match(SyntaxType.WhileKeyword);
        let condition = this.parseExpression();
        let body = this.parseStatement();

        return AST.WhileStatementSyntax(whileKeyword, condition, body);
    } 

    private parseBreakStatement() : AST.BreakStatementSyntax
    {
        var keyword = this.match(SyntaxType.BreakKeyword);
        return AST.BreakStatementSyntax(keyword);
    }

    private parseContinueStatement() : AST.ContinueStatementSyntax
    {
        var keyword = this.match(SyntaxType.ContinueKeyword);
        return AST.ContinueStatementSyntax(keyword);
    }

    private parseExpressionStatement(): AST.ExpressionStatementSyntax {
        let expression = this.parseExpression();

        switch(expression.kind)
        {
            case "CallExpressionSyntax":
            case "AssignmentExpressionSyntax":
                break;
            default:
                this._diagnostics.reportUnexpectedStatementExpression(expression.span());
        }        

        let semiColonToken = this.match(SyntaxType.SemiColon);
        return AST.ExpressionStatementSyntax(expression, semiColonToken);
    }
 
    isMakingProgress(lastTokenPosition : number) : { progress : boolean, newPosition : number }
    {
        var pos = this.current.position;

        if (pos > lastTokenPosition)
        {
            lastTokenPosition = pos;
            return { progress:true, newPosition:lastTokenPosition };
        }

        return { progress:false, newPosition:lastTokenPosition };
    }
}