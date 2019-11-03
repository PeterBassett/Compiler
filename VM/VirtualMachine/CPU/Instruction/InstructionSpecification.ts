export class InstructionSpecificationOptions
{
    //usesOpcodeMode? : boolean;
    usesSourceRegister? : boolean; 
    usesDestinationRegister? : boolean; 
    usesMemoryAddress? : boolean;
    usesOperand? : boolean;
}

export enum OperandType{
    reg,
    value,
    regOrValue,
    regOrPointer,
    regOrPointerOrValue
}

export default class InstructionSpecification
{
    private _name : string;
    private _opcode : number;
    private _operandCount : number;
    private _operandTypes : OperandType [];
    private _instructionLength : number;

    constructor(name : string, 
        opcode : number,
        operandTypes : OperandType[],
        instructionLength : number = 4)
    {
        this._name = name;
        this._opcode = opcode;
        this._operandCount = operandTypes.length;
        this._operandTypes = operandTypes;
        this._instructionLength = instructionLength;
    }

    get name ()
    {
        return this._name;
    }

    get opcode ()
    {
        return this._opcode;
    }

    get operandCount () : number
    {
        return this._operandCount;
    }

    get operandTypes () : number []
    {
        return this._operandTypes;
    }

    get instructionLength () : number
    {
        return this._instructionLength;
    }
}