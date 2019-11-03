export default class TextSpan
{
    static Empty : TextSpan = new TextSpan(0,0);

    private readonly _start:number;
    private readonly _length:number;

    constructor(start:number, length:number)
    {
        this._start = start;
        this._length = length;        
    }

    get start():number{
        return this._start;
    }

    get length():number{
        return this._length;
    }
    
    get end(): number {
        return this.start + this.length;
    }
}