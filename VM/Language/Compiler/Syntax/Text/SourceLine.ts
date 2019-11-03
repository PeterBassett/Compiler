import SourceText from "./SourceText";

export class SourceLine {
    private readonly _source: SourceText;
    private readonly _start: number;
    private readonly _length: number;
    private readonly _lengthIncludingLineBreak: number;
    
    constructor(source: SourceText, start: number, length: number, lengthIncludingLineBreak: number) {
        this._source = source;
        this._start = start;
        this._length = length;
        this._lengthIncludingLineBreak = lengthIncludingLineBreak;
    }

    public get text(): string { return this._source.toString(this.start, this.start + this.length); }
    public get start(): number { return this._start; }
    public get length(): number { return this._length; }
    public get end(): number { return this.start + this.length; } 
    public get lengthincludingLineBreak(): number { return this._lengthIncludingLineBreak; }    
}
