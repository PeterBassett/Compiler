import { char } from "../CharType";
import { SourceLine } from "./SourceLine";
import { number } from "prop-types";
import TextSpan from "./TextSpan";

export class TextSpanRowColumn
{
    constructor(public start:{row:number, column:number}, public end: {row:number, column:number}){}
}


export default class SourceText 
{
    private readonly _text: string;
    private readonly _lines : SourceLine[];
    public get text() : string
    {
        return this._text;
    }

    constructor(text: string) {
        this._text = text;

        this._lines = SourceText.parseLines(this, text);
    }

    private static parseLines(sourceText : SourceText, text : string) : SourceLine[]
    {
        let result : SourceLine[] = [];
        let position = 0;
        let lineStart = 0;

        while(position < text.length)
        {
            let lineBreakWidth = SourceText.getLineBreakWidth(text, position);

            // have we found a linebreak?
            if(lineBreakWidth === 0)
                position++; // nope, jusy move to the text character
            else
            {
                // yes
                SourceText.addLine(result, sourceText, position, lineStart, lineBreakWidth);
                position += lineBreakWidth;
                lineStart = position;
            }
        }

        // if we have a trailing line to deal with
        if(position >= lineStart)
            SourceText.addLine(result, sourceText, position, lineStart, 0);

        return result;
    }

    static getLineBreakWidth(text: string, position: number): any {     
        let c = char(text.charAt(position));
        let l = position + 1 >= text.length ? '\0' : char(text.charAt(position + 1));

        if(c === '\r' && l === '\n')
            return 2;

        if(c === '\r' || c === '\n')
            return 1;
            
        return 0;
    }

    static addLine(result: SourceLine[], sourceText: SourceText, position: number, lineStart: number, lineBreakWidth: any): any {
        let lineLength = position - lineStart;
        let lineLengthIncludingLineBreak = lineLength + lineBreakWidth;
        let line = new SourceLine(sourceText, lineStart, lineLength, lineLengthIncludingLineBreak);
        result.push(line);        
    }

    public getLineIndexContainingPosition(position:number) : number
    {
        let lower = 0;
        let upper = this._lines.length - 1;

        while(lower <= upper)
        {
            let index = Math.floor(lower + (upper - lower) / 2);
            let start = this._lines[index].start;

            if(position == start)
                return index;

            if(start > position)
            {
                upper = index - 1;                
            }
            else
            {
                lower = index + 1;
            }
        }

        return lower - 1;
    } 

    public charPositionToCoordinate(position:number) : { row:number, column:number }
    {
        let row = this.getLineIndexContainingPosition(position);

        let line = this.lines[row];

        let column = position - line.start;

        return { 
            row : row, 
            column : column 
        };
    }

    public textSpanToRowColRange(span:TextSpan) : TextSpanRowColumn
    {
        //if(span == null)
        //    console.log(span);
        let start = this.charPositionToCoordinate(span.start);
        let end   = this.charPositionToCoordinate(span.end);

        return {
            start : start,
            end : end
        };
    }

    public get length() { return this._text.length };

    public charAt(index:number): string {
        return this._text[index];
    }

    public get lines() { return this._lines; }  

    public getline(lineIndex: number): SourceLine {
        return this._lines[lineIndex];
    }

    public toString(start : number, end : number) : string
    {
        return this._text.substring(start, end);
    }
}
