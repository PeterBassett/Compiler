import { IAssemblyLineLexer, AssemblyToken, AssemblyTokenKind, } from "../Assembler/IAssemblyLineLexer";
import { char, Char } from "../misc/CharType";
import SourceText from "../Language/Compiler/Syntax/Text/SourceText";
import { Diagnostics } from "../Language/Compiler/Diagnostics/Diagnostics";

export class AssemblyLexer implements IAssemblyLineLexer 
{
    private _source: string;
    private _position: number;
    private _start : number;
    private _line : number;
    private _character : number;
    private _diagnostics : Diagnostics;
    
    current: AssemblyToken;

    constructor(assemblyLine: SourceText, diagnostics : Diagnostics) 
    {
        this._source = assemblyLine.text;
        this._diagnostics = diagnostics;
        this._position = 0;
        this._start = 0;
        this._line = 0;
        this._character = 0;
        this.current = new AssemblyToken("", -1, AssemblyTokenKind.BAD_TOKEN);
    }
    
    public advance() : boolean
    {            
        let tokenKind : AssemblyTokenKind;
        do
        {
            this._start = this._position;
            tokenKind = this.readToken();
        }
        while((this.current.token === AssemblyTokenKind.NEWLINE ||
               this.current.token === AssemblyTokenKind.BAD_TOKEN) && tokenKind === AssemblyTokenKind.NEWLINE);

        const line = this._line;
        const character = this._character;

        const lexeme = this._source.substring(this._start, this._position);        
        this._start = this._position;

        let value : number|undefined;
        switch(tokenKind)
        {
            case AssemblyTokenKind.NUMBER:
                value = parseInt(lexeme);
                tokenKind = AssemblyTokenKind.NUMBER;
                break;
            case AssemblyTokenKind.BINNUMBER:
                value = parseInt(lexeme.substring(2), 2);
                tokenKind = AssemblyTokenKind.BINNUMBER;
                break;                
            case AssemblyTokenKind.HEXNUMBER:                
                value = parseInt(lexeme.substring(2), 16);
                tokenKind = AssemblyTokenKind.HEXNUMBER;
                break;
            case AssemblyTokenKind.FLOAT_NUMBER:
                value = parseFloat(lexeme);
                tokenKind = AssemblyTokenKind.FLOAT_NUMBER;
                break;                
        }
            
        this.current = new AssemblyToken(lexeme, this._position-1, tokenKind, value, line, character);

        return tokenKind !== AssemblyTokenKind.EOF;
    }

    readToken() : AssemblyTokenKind
    {
        let c = this.advanceChar();

        while(true)
        {
            switch(c)
            {
                case '\0':
                    return AssemblyTokenKind.EOF;
                case '\r':
                    this._line++;
                    if(this.match('\n'))
                        this.advanceChar();
                    return AssemblyTokenKind.NEWLINE;
                case '\n':
                    this._line++;
                    return AssemblyTokenKind.NEWLINE;
                case '\t':
                case ' ':                
                    this.whitespace();
                    c = this.advanceChar();
                    this._start = this._position - 1;
                    continue;
                case ',':
                    return AssemblyTokenKind.COMMA;
                case '+' :
                    return AssemblyTokenKind.PLUS;
                case '-' :
                    return AssemblyTokenKind.MINUS;
                case '0' :
                    return this.match(char("x")) ? this.hexNumber() : (this.match(char("b")) ? this.binNumber() : this.number());
                case '1': case '2': case '3': case '4' : case '5' : case '6' : case '7': case '8' : case '9' : case '0':
                    return this.number();
                case '[' :
                    return AssemblyTokenKind.LEFT_SQUARE_BRACKET;
                case ']' :
                    return AssemblyTokenKind.RIGHT_SQUARE_BRACKET;                
                case ';' :
                    this.comment();
                    c = this.advanceChar();
                    this._start = this._position - 1;
                    continue;   
                case '\'' :
                case '\"' :
                    this.stringLiteral(c);
                    c = this.advanceChar();
                    return AssemblyTokenKind.STRING;     
                default:
                    if(c === '.')
                    {
                        return this.dataLabel();
                    }

                    if(this.isLetter(c) || c == '_')
                        return this.identifier(c);
                                        
                    return AssemblyTokenKind.BAD_TOKEN;                    
            }
        }
    }
    
    advanceChar() : Char
    {
        const c = this.char;
        this._position++;
        this._character++;
        return c;
    }

    match(expected : Char) : boolean
    {
        if(this.char != expected)
            return false;

        this._position++;

        return true;
    }

    private get char() : Char
    {
        if(this._position >= this._source.length)
            return char('\0');

        return char(this._source.charAt(this._position));
    }

    isWhitespace(char: Char): any {
        const letter = char.charCodeAt(0);

             //space          tab
        if(letter === 32 || letter === 9)
            return true;

        return false;

        /*
        switch(char.toString())
        {
            case '\t':
            case ' ':
                return true;
            default :
                return false;
        } */
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
        const letter = char.charCodeAt(0);
        return (letter >= 65 && letter < 91) || (letter >= 97 && letter < 123);
    }

    private isRegister(lexeme: string): AssemblyTokenKind 
    {
        switch (lexeme.toUpperCase()) {
            case "R0":
            case "R1":
            case "R2":
            case "R3":
            case "R4":
            case "R5":
            case "R6":
            case "R7":
            case "IP":
            case "SP":
                return AssemblyTokenKind.REGISTER;
        }

        return AssemblyTokenKind.IDENTIFIER;
    }

    dataLabel(): AssemblyTokenKind 
    {
        const c = this.identifier('.');

        if(c === AssemblyTokenKind.LABEL)
            throw new Error("Datalabel and label");

        return AssemblyTokenKind.DATALABEL;
    }

    identifier(firstChar:Char): AssemblyTokenKind 
    {
        while(this.isLetter(this.char) || this.isDigit(this.char) || this.char === '_')
            this.advanceChar();

        if (this.char === ':') 
        {
            this.advanceChar();
            
            return AssemblyTokenKind.LABEL;
        }            
        else if(this.isRegister(this._source.substring(this._start, this._position)))
            return AssemblyTokenKind.REGISTER;
        else
            return AssemblyTokenKind.IDENTIFIER; 
    }

    private comment(): void 
    {
        while (this.char !== '\r' && this.char !== '\n')
            this.advanceChar();
    }

    private stringLiteral(startChar : Char) : void 
    {
        while (this.char !== startChar && this.char !== '\0')
        {
            if(this.char === '\n')
            {
                this._diagnostics.reportUnterminatedStringConstant();
            }

            this.advanceChar();
        }
    }

    private binNumber(): AssemblyTokenKind 
    {
        while (this.char === '0' || this.char == '1')
            this.advanceChar();

        return AssemblyTokenKind.BINNUMBER;
    }

    private hexNumber(): AssemblyTokenKind 
    {
        while (this.isDigit(this.char) || (this.char.toLowerCase() >= 'a' && this.char.toLowerCase() <= 'f'))
            this.advanceChar();

        return AssemblyTokenKind.HEXNUMBER;
    }

    number(): AssemblyTokenKind
    {
        let type : AssemblyTokenKind | null = null;
        let start = this._position;

        while(this.isDigit(this.char))
            this.advanceChar();

        let isFloat = false;
        if(this.char === ".")
        {
            isFloat = true;

            this.advanceChar();

            while(this.isDigit(this.char))
                this.advanceChar();                    

            return AssemblyTokenKind.FLOAT_NUMBER;
        }   
        
        return AssemblyTokenKind.NUMBER;
    }

    whitespace():void {
        while(this.isWhitespace(this.char))
            this.advanceChar();
    }    
}
