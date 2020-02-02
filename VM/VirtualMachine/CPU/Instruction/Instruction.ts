
export class OpcodeMode
{
    public static Default : OpcodeMode = new OpcodeMode(false, false);
    public static Pointer : OpcodeMode = new OpcodeMode(true, false);
    public static Register : OpcodeMode = new OpcodeMode(false, true);
    public static RegisterWithOffset : OpcodeMode = new OpcodeMode(true, true);
    
    constructor(public readonly isPointer : boolean, 
        public readonly isRegister : boolean)
        {
        }
}

export class OpcodeModes
{
    equals(other: OpcodeModes) 
    {
        if(other == null || other == undefined)
            return false;
        
        if(this.source.isPointer !== other.source.isPointer ||
            this.source.isRegister !== other.source.isRegister ||
            this.destination.isPointer !== other.destination.isPointer ||
            this.destination.isRegister !== other.destination.isRegister)
            return false;

        return true;
    }

    public static Default : OpcodeModes = new OpcodeModes(OpcodeMode.Default, OpcodeMode.Default);

    constructor(public readonly source : OpcodeMode, 
        public readonly destination : OpcodeMode)
        {            
            if(source == null)
                throw new Error("source must be provided");
            if(destination == null)
                throw new Error("destination must be provided");                
        }
}

export default class Instruction
{
    private _opcode : number;
    private _opcodeMode : OpcodeModes;
    private _sourceRegister : number;
    private _destinationRegister : number;
    private _destinationMemoryAddress : number;
    private _sourceMemoryAddress : number;
    public encodedLength: number;
    
    constructor(opcode : number,
        opcodeMode : OpcodeModes, 
        sourceRegister : number, 
        destinationRegister : number, 
        destinationMemoryAddress :number,
        sourceMemoryAddress :number)
    {
        this._opcode = opcode;
        this._opcodeMode = opcodeMode;
        this._sourceRegister = sourceRegister;
        this._destinationRegister = destinationRegister;
        this._destinationMemoryAddress = destinationMemoryAddress;
        this._sourceMemoryAddress = sourceMemoryAddress;
    }

    get opcode () : number
    {
        return this._opcode;
    }

    get opcodeMode () : OpcodeModes
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

    get destinationMemoryAddress () : number
    {
        return this._destinationMemoryAddress;
    }

    get sourceMemoryAddress () : number
    {
        return this._sourceMemoryAddress;
    }
}