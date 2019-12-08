import { TextWriter } from "./TextWriter";
import { string, array } from "prop-types";

export class StringWriter implements TextWriter {
    private lines: string[] = [];
    private currentLine : string = "";

    Write(text: string) {
        this.currentLine = this.currentLine + text;
    }

    WriteLine(text?: string) {
        this.lines.push(this.currentLine + text);
        this.currentLine = "";
    }

    public toString(): string {
        return this.lines.join("\r\n");
    }
}

export class IndentedTextWriter implements TextWriter {
    private writer : TextWriter;
    constructor(writer : TextWriter)
    {
        this.writer = writer;
        this._indent = 0;
    }

    private _indent : number;
    public get indent() : number{
        return this._indent;
    }

    public set indent(value : number)
    {
        if(value < 0)
            value = 0;
        
        this._indent = value;
    }

    Write(text: string): void {
        this.writer.Write(text);
    }
    
    WriteLine(arg?: string) {
        if(!arg)
            arg = "";
        this.writer.WriteLine(Array(this.indent).join("\t") + arg);
    }

    toString(): string {
        return this.writer.toString();
    }
}
