export default class AssemblyLine {
    public readonly originalSource : string;    
    public readonly lineNumber : number;
    public source : string;
    public outputIP? : number;

    constructor()
    {
        this.originalSource = "";
        this.lineNumber = 0;
        this.source = "";
        this.outputIP = 0;
    } 
}