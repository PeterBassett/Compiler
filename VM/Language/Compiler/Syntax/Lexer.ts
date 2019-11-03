import { ILexer } from "./ILexer";
import SourceText from "./Text/SourceText";
import { SyntaxType } from "./SyntaxType";
import * as SyntaxFacts from "./SyntaxFacts";
import { Diagnostics } from "../Diagnostics/Diagnostics";
import TextSpan from "../Syntax/Text/TextSpan";
import { char, Char } from "./CharType";
import SyntaxTreeVisitor from "../Binding/BindingVisitor";

export class Token
{    
    public readonly kind : SyntaxType;
    public readonly lexeme : string;
    public readonly position : number;
    public readonly line : number;
    public readonly character :number;
    public readonly leadingTrivia:SyntaxTrivia[];
    public readonly trailingTrivia:SyntaxTrivia[];

    constructor(kind : SyntaxType, lexeme: string, 
        position:number, line: number, character: number, 
        leadingTrivia?:SyntaxTrivia[], trailingTrivia?:SyntaxTrivia[]) 
    {
        //if(lexeme == null)
        //console.log();
        this.kind = kind;
        this.lexeme = lexeme;
        this.position = position;
		this.line = line;
        this.character = character;
        this.leadingTrivia = leadingTrivia || [];
        this.trailingTrivia = trailingTrivia || [];
    }

    public get span() : TextSpan
    {
        return new TextSpan(this.position, this.lexeme.length);
    }

    public withLeadingTrivia(trivia : SyntaxTrivia[]) : Token
    {
        if (trivia == null || trivia.length == 0)
            return this;

        return new Token(this.kind,
            this.lexeme,
            this.position,
            this.line,
            this.character,
            trivia.concat(this.leadingTrivia),
            this.trailingTrivia);
    }
}   

export class SyntaxTrivia
{
    public readonly kind : SyntaxType;
    public readonly lexeme : string;
    public readonly start : number;
    public readonly length : number;

    public get span(): TextSpan
    {
        return new TextSpan(this.start, this.length);
    }

    constructor(kind : SyntaxType, lexeme : string, start : number, length : number)
    {
        this.kind = kind;
        this.lexeme = lexeme;
        this.start = start;
        this.length = length;
    }
}

export class Lexer implements ILexer
{
    private readonly _diagnostics : Diagnostics;
    private readonly source : SourceText;
    private position : number;
    private start : number;
    private line : number;
    private character : number;

    constructor(source : SourceText) {
        this._diagnostics = new Diagnostics(source);
        this.source = source;
        this.position = 0;
        this.line = 0;
        this.character = 0;
        this.start = this.position;
    } 

    public get diagnostics()
    {
        return this._diagnostics;
    }

    public lex() : Token
    {
        this.start = this.position;

        let leadingTrivia = this.readLeadingTrivia();

        let syntaxType = this.readToken();

        let lexeme = this.currentLexeme;
        let start = this.start;
        let position = this.position;
        let line = this.line
        let character = this.character;

        lexeme = this.amendLexeme(lexeme, syntaxType);

        //var span = TextSpan.FromBounds(_start, end);
        //var text = _text.GetText(span);
        //var diagnostics = _diagnostics.ToImmutableArray();

        this.start = this.position;
        let trailingTrivia = this.readTrailingTrivia();

        return new Token(syntaxType, lexeme, start, line, character, leadingTrivia, trailingTrivia);
    }
    
    amendLexeme(lexeme: string, syntaxType: SyntaxType): string {
        if(syntaxType == SyntaxType.StringLiteral)
            return lexeme.substring(1, lexeme.length - 1);

        return lexeme;
    }

    //public readToken() : Token
    public readToken() : SyntaxType
    {
        this.start = this.position;

        const c = this.advance();

        switch(c)
        {
            case '\0':
                //return new Token(SyntaxType.Eof, "", this.position, this.line, this.character);
                return SyntaxType.Eof;
            case '\r':
            case '\n':
                this.line++;
            case '\t':
            case ' ':                
                return this.whitespace();
            case '+' :
                //return this.token(this.match(char("+")) ? SyntaxType.PlusPlus : SyntaxType.Plus);
                return this.match(char("+")) ? SyntaxType.PlusPlus : SyntaxType.Plus;
            case '-' :
                //return this.token(this.match(char("-")) ? SyntaxType.MinusMinus : SyntaxType.Minus);
                return this.match(char("-")) ? SyntaxType.MinusMinus : SyntaxType.Minus;
            case '*' :
                return SyntaxType.Star;
            case '~' :
                return SyntaxType.Tilde;                
            case '^' :
                return SyntaxType.Hat;                
            case '\\' :
                return SyntaxType.BackSlash;
            case '/' :
                return SyntaxType.Slash;                
            case '=' :                
                return this.match(char("=")) ? 
                        SyntaxType.EqualsEquals : 
                        (
                            this.match(char(">")) ? 
                            SyntaxType.FatArrow : 
                            SyntaxType.Equals
                        );
            case '>' :
                //return this.token(this.match(char("=")) ? SyntaxType.GreaterThanOrEqual : SyntaxType.GreaterThan);
                return this.match(char("=")) ? SyntaxType.GreaterThanOrEqual : SyntaxType.GreaterThan;
            case '<' :
                //return this.token(this.match(char("=")) ? SyntaxType.LessThanOrEqual : SyntaxType.LessThan);
                return this.match(char("=")) ? SyntaxType.LessThanOrEqual : SyntaxType.LessThan;
            case '!' :
                //return this.token(this.match(char("=")) ? SyntaxType.BangEquals : SyntaxType.Bang);    
                return this.match(char("=")) ? SyntaxType.BangEquals : SyntaxType.Bang;    
            case '&' :
                //return this.token(this.match(char("&")) ? SyntaxType.AmpersandAmpersand : SyntaxType.Ampersand);
                return this.match(char("&")) ? SyntaxType.AmpersandAmpersand : SyntaxType.Ampersand;
            case '|' :
                //return this.token(this.match(char("|")) ? SyntaxType.PipePipe : SyntaxType.Pipe);                         
                return this.match(char("|")) ? SyntaxType.PipePipe : SyntaxType.Pipe;                         
            case '1': case '2': case '3': case '4' : case '5' : case '6' : case '7': case '8' : case '9' : case '0':
                return this.number();    
            case "\"":
                return this.string();
            case '{' :
                return SyntaxType.LeftBrace;
            case '}' :
                return SyntaxType.RightBrace;
            case '(' :
                return SyntaxType.LeftParen;
            case ')' :
                return SyntaxType.RightParen;
            case ';' :
                return SyntaxType.SemiColon;                
            case ':' :
                return SyntaxType.Colon;
            case ',' :
                return SyntaxType.Comma;
            case '.' :
                return SyntaxType.Dot;                                                                
            default:
                if(this.isLetter(c))
                    return this.identifierOrKeyword();
                
                this._diagnostics.reportUnexpectedCharacter(c.toString(), this.start);
                return SyntaxType.BadToken;
        }
    }    
    
    readLeadingTrivia(): SyntaxTrivia[] {
        return this.readTrivia(false);
    }

    readTrailingTrivia(): SyntaxTrivia[] {
        return this.readTrivia(true);
    }

    readTrivia(isTrailing:boolean) : SyntaxTrivia[]
    {
        let target : SyntaxTrivia[] = [];
        while (true)
        {
            switch (this.char)
            {
                case '\n':
                case '\r':
                    {
                        this.readEndOfLine();
                        this.addTrivia(target, SyntaxType.EndOfLineTrivia);
                        if (isTrailing)
                            return target;
                    }
                    break;
                case '/':
                    if (this.peekChar == '/')
                    {
                        this.readSinglelineComment();
                        this.addTrivia(target, SyntaxType.SingleLineCommentTrivia);
                    }
                    else if (this.peekChar == '*')
                    {
                        this.readMultilineComment();
                        this.addTrivia(target, SyntaxType.MultiLineCommentTrivia);
                    }
                    else
                    {
                        return target;
                    }
                    break;
                default:
                    if (this.isWhitespace(this.char))
                    {
                        this.whitespace();
                        this.addTrivia(target, SyntaxType.WhitespaceTrivia);
                    }
                    else
                    {
                        return target;
                    }
                    break;
            }
        }
    }
  
    addTrivia(target: SyntaxTrivia[], type: SyntaxType): void {    
        var start = this.start;
        var end = this.position;
        var lexeme = this.currentLexeme;
        var trivia = new SyntaxTrivia(type, lexeme, start, end - start);

        target.push(trivia);
        this.start = this.position;        
    }
    
    readMultilineComment(): void
    {
        this.advance(); // Skip 
        this.advance(); // Skip 
        
        while (true)
        {
            let c = this.advance();
            switch (c)
            {
                case '\0':
                    this._diagnostics.reportUnterminatedComment(this.start, this.position);
                    return;
                case '*':
                    if (this.match(char('/')))
                        return;
                    break;
            }
        }
    }

    readEndOfLine(): any {
        this.match(char('\r'));        
        this.match(char('\n'));
    }

    readSinglelineComment(): void {
        
        while (true)
        {
            let c = this.char;
                        
            switch (c)
            {
                case '\0':                    
                case '\r':
                case '\n':
                    return;
            }

            this.advance();
        }
    }
    
    whitespace(): SyntaxType {
        while(this.isWhitespace(this.char))
            this.advance();

        return SyntaxType.WhitespaceTrivia;
    }

    number(): SyntaxType {
        let type : SyntaxType | null = null;

        while(this.isDigit(this.char))
            this.advance();

        type = SyntaxType.IntegerLiteral;

        if(this.match(char(".")))
        {
            while(this.isDigit(this.char))
                this.advance();

            type = SyntaxType.FloatLiteral;
        }

        return type;
    }

    identifierOrKeyword(): SyntaxType {
        this.identifier();

        return SyntaxFacts.GetKeywordType(this.currentLexeme);
    }

    identifier(): SyntaxType {
        while(this.isLetter(this.char) || this.isDigit(this.char))
            this.advance();

        return SyntaxType.Identifier;
    }

    string(): SyntaxType {        
        while(this.char != "\0" && this.char != "\"")
            this.advance();

        this.match(char("\""));

        return SyntaxType.StringLiteral;
    }

    private get char() : Char
    {
        if(this.position >= this.source.length)
            return char('\0');

        return char(this.source.charAt(this.position));
    }

    private get peekChar() : Char
    {
        if(this.position + 1 >= this.source.length)
            return char('\0');

        return char(this.source.charAt(this.position + 1));
    }

    private get currentLexeme() : string
    {
        return this.source.toString(this.start, this.position);
    }

    isWhitespace(char: Char): any {
        switch(char.toString())
        {
            case '\t':
            case ' ':
                return true;
            default :
                return false;
        } 
    }

    isDigit(char: Char): boolean {
        switch(char.toString())
        {
            case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '7': case '8': case '9': case '0':
                return true;
            default :
                return false;
        } 
    }

    isLetter(char: Char): boolean {
        const letter = char.toString().toUpperCase()[0];

        return (letter >= 'A' && letter <= 'Z');
    }

    private advance() : Char
    {
        let c = this.char;
        this.position++;
        this.character++;
        return c;
    }

    private match(expected : Char) : boolean
    {
        if(this.char != expected)
            return false;

        this.position++;

        return true;
    }
}