
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
    public encodedLength: number;
    
    constructor(public readonly opcode : number,
        public readonly opcodeMode : OpcodeModes, 
        public readonly sourceRegister : number, 
        public readonly destinationRegister : number, 
        public readonly destinationMemoryAddress :number,
        public readonly sourceMemoryAddress :number)
    {
        this.encodedLength = 0;
    }
}