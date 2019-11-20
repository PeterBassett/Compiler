import TextSpan from "./Text/TextSpan";
import SyntaxTrivia from "./SyntaxTrivia";
import { SyntaxType } from "./SyntaxType";

export default class Token
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