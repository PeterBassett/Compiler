export default class Instruction
{
    private _opcode : number;
    private _opcodeMode : number;
    private _sourceRegister : number;
    private _destinationRegister : number;
    private _memoryAddress : number;

    constructor(opcode : number,
        opcodeMode : number, 
        sourceRegister : number, 
        destinationRegister : number, 
        memoryAddress :number)
    {
        this._opcode = opcode;
        this._opcodeMode = opcodeMode;
        this._sourceRegister = sourceRegister;
        this._destinationRegister = destinationRegister;
        this._memoryAddress = memoryAddress;
    }

    get opcode () : number
    {
        return this._opcode;
    }

    get opcodeMode () : number
    {
        return this._opcodeMode;
    }

    get sourceRegister () : number
    {
        return this._sourceRegister;
    }

    get destinationRegister () : number
    {
        return this._destinationRegister;
    }

    get memoryAddress () : number
    {
        return this._memoryAddress;
    }
}