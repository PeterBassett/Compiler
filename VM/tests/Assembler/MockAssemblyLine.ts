import AssemblyLine from "../../Assembler/AssemblyLine";

export default class MockAssemblyLine extends AssemblyLine {

    private _source : string;
    public _sourceGETCount : number;
    public _sourceSETCount : number;
    
    private _lineNumber : number;
    public _lineNumberGETCount : number;
    public _lineNumberSETCount : number;

    private _originalSource : string;
    public _originalSourceGETCount : number;
    public _originalSourceSETCount : number;

    private _outputIP : number;
    public _outputIPGETCount : number;
    public _outputIPSETCount : number;

    constructor(source :string, lineNumber?:number) {
        super();

        this._lineNumberGETCount = this._lineNumberSETCount = 
        this._originalSourceGETCount = this._originalSourceSETCount = 
        this._outputIPGETCount = this._outputIPSETCount = 
        this._sourceGETCount = this._sourceSETCount = 0;
        this._originalSource = "";
        this._outputIP = 0;

        this._source = source;
        this._lineNumber = lineNumber || 0;
    }

    get source():string
    {
        this._sourceGETCount++;
        return this._source;
    }

    set source(value : string)
    {
        this._sourceSETCount++;
        this._source = value;
    }

    get originalSource():string
    {
        this._originalSourceGETCount++;
        return this._originalSource;
    }

    set originalSource(value : string)
    {
        this._originalSourceSETCount++;
        this._originalSource = value;
    }

    get lineNumber():number
    {
        this._lineNumberGETCount++;
        return this._lineNumber;
    }

    set lineNumber(value : number)
    {
        this._lineNumberSETCount++;
        this._lineNumber = value;
    }

    get outputIP():number
    {
        this._outputIPGETCount++;
        return this._outputIP;
    }

    set outputIP(value : number)
    {
        this._outputIPSETCount++;
        this._outputIP = value;
    }
}