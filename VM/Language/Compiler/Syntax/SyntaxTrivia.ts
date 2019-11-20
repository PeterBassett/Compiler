import { SyntaxType } from "./SyntaxType";
import TextSpan from "./Text/TextSpan";

export default class SyntaxTrivia
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