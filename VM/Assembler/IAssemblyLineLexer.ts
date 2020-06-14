export enum AssemblyTokenKind {
    IDENTIFIER,
    LEFT_SQUARE_BRACKET,
    RIGHT_SQUARE_BRACKET,
    REGISTER,
    NUMBER,
    BINNUMBER,
    HEXNUMBER,
    PLUS,
    MINUS,
    LABEL,
    DATALABEL,
    COMMA,
    NEWLINE,
    EOF,
    BAD_TOKEN,
    FLOAT_NUMBER,
    STRING
}

export class AssemblyToken
{
    public length : number; 

    constructor(public readonly lexeme : string, 
        public readonly position:number, 
        public readonly token : AssemblyTokenKind,
        public readonly value : number = 0,
        public readonly line? : number,
        public readonly character? : number) 
    {
        this.length = lexeme.length;
    }
}

export interface IAssemblyLineLexer
{
    current : AssemblyToken;
    advance() : boolean;
}