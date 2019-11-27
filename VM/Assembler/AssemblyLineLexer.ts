export enum OperandToken
{
    WHITESPACE,
    IDENTIFIER,
    LEFT_SQUARE_BRACKET,
    RIGHT_SQUARE_BRACKET,
    REGISTER,
    NUMBER,
    PLUS,
    MINUS
}

export class Token
{
    public token : OperandToken;
    public lexeme : string;
    public position : number;
    public length : number; 
    public value : number;

    constructor(lexeme : string, position:number, token : OperandToken, value:number = 0) {
        this.length = lexeme.length;
        this.lexeme = lexeme;
        this.position = position;
        this.token = token;
        this.value = value;
    }
}

export class AssemblyLineLexer
{
    private _source : string;
    private _currentPosition : number;
    private _token : Token;

    constructor(assemblyLine : string) {
        this._source = assemblyLine;
        this._currentPosition = 0;
        this._token = new Token("", 0, 0);
    }

    charAt(offset : number) : string
    { 
        if(this._currentPosition + offset >= this._source.length)
            return "";

        return this._source.charAt(this._currentPosition + offset);         
    }

    get currentChar() : string { return this.charAt(0); }
    get peekChar() : string { return this.charAt(1); }
    get end() : boolean { return this._currentPosition >= this._source.length; }
    public get current() : Token { return this._token; }
    public set current(value : Token) { this._token = value; }

    public advance() : boolean
    {
        if (this.end)
        {
//            this.current = null;
            return false;
        }
        
        if (this.isWhiteSpace(this.currentChar))
            this.consumeWhiteSpace();

        if (this.end)
        {
//            this.current = null;
            return false;
        }

        if (this.currentChar == '0' && this.peekChar && this.peekChar.toLowerCase() == 'x')
            return this.hexNumberToken();

        if (this.currentChar == '0' && this.peekChar && this.peekChar.toLowerCase() == 'b')
            return this.binNumberToken();

        if (this.isDigit(this.currentChar))
            return this.numberToken();

        switch(this.currentChar)
        {
            case '[':
                this.current = new Token(this.currentChar, this._currentPosition++, OperandToken.LEFT_SQUARE_BRACKET);
                return true;
            case ']':
                this.current = new Token(this.currentChar, this._currentPosition++, OperandToken.RIGHT_SQUARE_BRACKET);
                return true;            
            case '-':
                this.current = new Token(this.currentChar, this._currentPosition++, OperandToken.MINUS);
                return true;
            case '+':
                this.current = new Token(this.currentChar, this._currentPosition++, OperandToken.PLUS);
                return true;
        }

        if(this.isAlpha(this.currentChar))
        {
            this.identifierToken();
            
            const lexeme = this.current.lexeme;

            if(this.isRegister(lexeme))
                this.current = new Token(lexeme, this.current.position, OperandToken.REGISTER);
            
            return true;
        }

        return false;
    }

    isRegister(lexeme: string): boolean {
        switch(lexeme.toUpperCase())
        {
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
            return true;
        }

        return false;
    }
    
    binNumberToken(): boolean {
        // skip the 0b;
        this._currentPosition += 2;
        
        const start = this._currentPosition;

        while(!this.end && (this.currentChar == '0' || this.currentChar == '1'))
            this._currentPosition++;

        let lexeme = this._source.substring(start, this._currentPosition);

        this.current = new Token(lexeme, start, OperandToken.NUMBER, parseInt(lexeme, 2));

        return true;        
    }

    hexNumberToken(): boolean {        
        // skip the 0x;
        this._currentPosition += 2;
        
        const start = this._currentPosition;

        while(!this.end && (this.isDigit(this.currentChar) || (this.currentChar.toLowerCase() >= 'a' && this.currentChar.toLowerCase() <= 'f')))
            this._currentPosition++;

        let lexeme = this._source.substring(start, this._currentPosition);

        this.current = new Token(lexeme, start, OperandToken.NUMBER, parseInt(lexeme, 16));
        return true;
    }

    numberToken(): boolean {
        let start = this._currentPosition;

        while(!this.end && this.isDigit(this.currentChar))
            this._currentPosition++;

        let isFloat = false;
        if(this.currentChar == ".")
        {
            isFloat = true;

            this._currentPosition++;

            while(!this.end && this.isDigit(this.currentChar))
                this._currentPosition++;                    
        }

        let lexeme = this._source.substring(start, this._currentPosition);
        let value = isFloat ? parseFloat(lexeme) : parseInt(lexeme, 10);
        this.current = new Token(lexeme, start, OperandToken.NUMBER, value);
        return true;
    }

    registerToken(): boolean {
        this._currentPosition++;

        const number = this.numberToken();
        if(number)
        {
            this.current = new Token("R" + this.current.lexeme, this.current.position - 1, OperandToken.REGISTER);
            return true;        
        }
        
        //this.current = null;
        return false;
    }    

    identifierToken(): boolean {
        const start = this._currentPosition;

        while(!this.end && (this.isAlpha(this.currentChar) || this.isDigit(this.currentChar)))
            this._currentPosition++;

        this.current = new Token(this._source.substring(start, this._currentPosition), start, OperandToken.IDENTIFIER);
        return true;
    }

    consumeWhiteSpace(): boolean {
        const start = this._currentPosition;
        
        while(!this.end && this.isWhiteSpace(this.currentChar))
            this._currentPosition++;

        //this.current = new Token(this._source.substring(start, this._currentPosition), start, OperandToken.WHITESPACE);
        return false;
    }

    isWhiteSpace(char: string): boolean {
        return char == ' ' ||
                char == '\t';
    }

    isDigit(char:string):boolean
    {
        return char >= '0' && char <= '9';
    }
    
    isAlpha(char: string): boolean {
        return (char >= 'a' && char <= 'z') ||
               (char >= 'A' && char <= 'Z');
    }    
}