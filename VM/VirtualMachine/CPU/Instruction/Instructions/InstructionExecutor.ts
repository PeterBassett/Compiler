import Instruction from "../Instruction";
import Memory from "../../../Memory/Memory";
import RegisterBank from "../../RegisterBank";
import Flags from "../../Flags";
import CPU from "../../CPU";
import BuiltinFunctions from "../../../../Language/Compiler/BuiltinFunctions";
import { ValueType } from "../../../../Language/Types/ValueType";
import { Value } from "../../../../Language/Scope/ExecutionScope";

type InstructionExecutor = (cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags: Flags) => void;
export { InstructionExecutor };

enum Endpoint
{
    Source = 0,
    Destination = 1
}

function storeValue(instruction : Instruction, 
                    endpoint : Endpoint, 
                    register: number,  
                    memory : Memory, 
                    registers : RegisterBank, 
                    value : number,
                    size : number) : void
{
    const mode = endpoint === Endpoint.Source ? instruction.opcodeMode.source : instruction.opcodeMode.destination;

    if(mode.isRegister)
    {
        if(mode.isPointer)
        {            
            let registerValue = registers.get(register);
            let offset = endpoint === Endpoint.Source ? instruction.sourceMemoryAddress : instruction.destinationMemoryAddress;
            memory.storeNumber(registerValue + offset, value, size);
        }
        else        
        {            
            value = readBytes(value, size);        
            registers.set(register, value);    
        }
    }
    else
    {
        if(mode.isPointer)
        {            
            let offset = endpoint === Endpoint.Source ? instruction.sourceMemoryAddress : instruction.destinationMemoryAddress;
            memory.storeNumber(offset, value, size);
        }
        else        
        {  
            value = readBytes(value, size);
            memory.storeNumber(instruction.sourceMemoryAddress, value, size);
        }
    }
}

function getValue(instruction : Instruction,    
                  endpoint : Endpoint, 
                  register: number,
                  memory : Memory,
                  registers : RegisterBank,
                  size : number) : number
{
    const mode = endpoint === Endpoint.Source ? instruction.opcodeMode.source : instruction.opcodeMode.destination;

    var value = 0;
    if(mode.isRegister)
    {
        value = registers.get(register);

        let offset = endpoint === Endpoint.Source ? instruction.sourceMemoryAddress : instruction.destinationMemoryAddress;

        if(mode.isPointer)
        {            
            return memory.readNumber(value + offset, size);             
        }   
        else
        {
            value = value + offset;
        }     
    }
    else
    {
        if(mode.isPointer)
        {            
            let offset = endpoint === Endpoint.Source ? instruction.sourceMemoryAddress : instruction.destinationMemoryAddress;
            value = memory.readNumber(offset, size);
        }
        else        
        {
            value = instruction.sourceMemoryAddress;            
        }
    }        

    value = readBytes(value, size);
    
    return value;
}

function readBytes(value :number, size:number) : number 
{
    switch(size)
    {
        case 8:
            return value;
        case 4 : 
            return value & 0xFFFFFFFF;
        case 2 : 
            return value & 0xFFFF;
        case 1 : 
            return value & 0xFF;
        default:
            throw new RangeError("Invalid size requested");
    }
}

function setFlags(flags : Flags, result : number)
{
    flags.Zero = result == 0;
    flags.Negative = result < 0;
}

export function MVI(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.sourceMemoryAddress;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function MVIb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.sourceMemoryAddress & 0xff;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function MVIw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.sourceMemoryAddress & 0xffff;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function MVIf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.sourceMemoryAddress;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function STR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeDWord(instruction.sourceMemoryAddress, registers.get(instruction.destinationRegister));
}

export function STRw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeWord(instruction.sourceMemoryAddress, registers.get(instruction.destinationRegister));
}

export function STRb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeByte(instruction.sourceMemoryAddress, registers.get(instruction.destinationRegister));
}

export function STRf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeFloat64(instruction.sourceMemoryAddress, registers.get(instruction.destinationRegister));
}

export function LDR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readDWord(instruction.sourceMemoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function LDRw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readWord(instruction.sourceMemoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function LDRb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readByte(instruction.sourceMemoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function LDRf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readFloat64(instruction.sourceMemoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function MOV(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let value = getValue(instruction, Endpoint.Source, instruction.sourceRegister, memory, registers, 4);
    storeValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, value, 4);
}

export function MOVw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let value = getValue(instruction, Endpoint.Source, instruction.sourceRegister, memory, registers, 2);
    storeValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, value, 2);
}

export function MOVb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let value = getValue(instruction, Endpoint.Source, instruction.sourceRegister, memory, registers, 1);
    storeValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, value, 1);
}

export function MOVf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let value = getValue(instruction, Endpoint.Source, instruction.sourceRegister, memory, registers, 8);
    storeValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, value, 8);
}

export function PUSH(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = registers.get(instruction.destinationRegister);
    registers.SP -= 4;
    memory.storeDWord(registers.SP, value);    
}

export function PUSHw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = registers.get(instruction.destinationRegister);
    registers.SP -= 2;
    memory.storeWord(registers.SP, value);    
}

export function PUSHb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = registers.get(instruction.destinationRegister);
    registers.SP -= 1;
    memory.storeByte(registers.SP, value);    
}

export function PUSHf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = registers.get(instruction.destinationRegister);
    registers.SP -= 8;
    memory.storeFloat64(registers.SP, value);    
}

export function POP(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const value = memory.readDWord(registers.SP);
    registers.SP += 4;
    registers.set(instruction.destinationRegister, value);
}

export function POPw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readWord(registers.SP);
    registers.SP += 2;
    registers.set(instruction.destinationRegister, value);
}

export function POPb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const value = memory.readByte(registers.SP);
    registers.SP += 1;
    registers.set(instruction.destinationRegister, value);
}

export function POPf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const value = memory.readFloat64(registers.SP);
    registers.SP += 8;
    registers.set(instruction.destinationRegister, value);
}

export function INT(cpu : CPU, instruction: Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const interupt = memory.readDWord(registers.SP);
    const paramCount = memory.readDWord(registers.SP+4);
    const params :number [] = [];

    const func = cpu.builtins.findByInterupt(interupt);
    
    if(!func)
        throw new RangeError("Invalid interupt requested");

    if(paramCount !== func.details.parameterTypes.length)
        throw new RangeError(`Expected ${paramCount} parameters but found ${func.details.parameterTypes.length}`);

    let offset = registers.SP+8;
    for(let p of func.details.parameterTypes)
    {
        switch(p.type)
        {
            case ValueType.Boolean:
                params.push(memory.readByte(offset));
                offset += 1;
                break;
            case ValueType.Int:
            case ValueType.Pointer:                
                params.push(memory.readDWord(offset));
                offset += 4;
                break;        
            case ValueType.Float:
                params.push(memory.readFloat64(offset));
                offset += 8;
                break;  
            default:
                throw new Error("Unsupported interupt function parameter type");
        }
    }

    let result = func!.executor(params);

    registers.R1 = result;  
}

export function JMP(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    registers.IP = instruction.sourceMemoryAddress;
}

export function JMR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    registers.IP = registers.get(instruction.destinationRegister);
}

export function JLT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(flags.Negative)
        registers.IP = instruction.sourceMemoryAddress;
}

export function JGE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Negative || flags.Zero)
        registers.IP = instruction.sourceMemoryAddress;
}

export function JEQ(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Negative && flags.Zero)
        registers.IP = instruction.sourceMemoryAddress;
}

export function JNE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Zero)
        registers.IP = instruction.sourceMemoryAddress;
}

export function JNZ(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Zero)
        registers.IP = instruction.sourceMemoryAddress;
}

export function CALL(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    registers.SP -= 4;
    memory.storeDWord(registers.SP, registers.IP);    
    registers.IP = instruction.sourceMemoryAddress;
}

export function RET(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {        
    const value = memory.readDWord(registers.SP);    
    registers.SP += 4;
    registers.IP = value;
}

export function ADD(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => a+b, IntegerMath);
}

export function SUB(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => b-a, IntegerMath);
}

export function MUL(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => b*a, IntegerMath);
}

export function DIV(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => b/a, IntegerMath);
}

export function ADDf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => a+b, DoubleMath);
}

export function SUBf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => b-a, DoubleMath);
}

export function MULf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => b*a, DoubleMath);
}

export function DIVf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    binaryMathOP(cpu, instruction, memory, registers, flags, (a, b) => b/a, DoubleMath);
}

const ByteMath :MathOptions = {
    floorResults :true, 
    size : 1
};

const IntegerMath :MathOptions = {
    floorResults :true, 
    size : 4
};

const DoubleMath :MathOptions = {
    floorResults : false, 
    size : 8
};

class MathOptions
{
    public floorResults : boolean = true;
    public size : number = 0;
}

function binaryMathOP(cpu : CPU, 
    instruction:Instruction, 
    memory: Memory, 
    registers: RegisterBank, 
    flags : Flags,  
    op : (source :number, destination :number)=>number,
    options : MathOptions): void {

    let size = options.size;
    let a = getValue(instruction, Endpoint.Source, instruction.sourceRegister, memory, registers, size);
    let b = getValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, size);

    let result = op(a, b);

    if(options.floorResults)
        result = Math.floor(result);

    storeValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, result, size);
    
    setFlags(flags, result);
}

export function NEG(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = -registers.get(instruction.destinationRegister);
    registers.set(instruction.destinationRegister, result);

    setFlags(flags, result);
}

export function INC(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.destinationRegister) + 1;
    registers.set(instruction.destinationRegister, result);

    setFlags(flags, result);
}

export function DEC(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.destinationRegister) - 1;
    registers.set(instruction.destinationRegister, result);

    setFlags(flags, result);
}

export function LSH(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.destinationRegister) << instruction.sourceMemoryAddress;
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function RSH(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.destinationRegister) >> instruction.sourceMemoryAddress;
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function AND(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.sourceRegister) & registers.get(instruction.destinationRegister);
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function OR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.sourceRegister) | registers.get(instruction.destinationRegister);
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function XOR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.sourceRegister) ^ registers.get(instruction.destinationRegister);
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function NOT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = ~registers.get(instruction.destinationRegister)
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function SWAP(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let a = registers.get(instruction.sourceRegister)
    registers.set(instruction.sourceRegister, registers.get(instruction.destinationRegister));
    registers.set(instruction.destinationRegister, a);
}

export function LOOP(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    let value = registers.get(instruction.destinationRegister)
    
    value = value - 1;

    registers.set(instruction.destinationRegister, value)
    
    if(value > 0)
    {
        registers.IP = instruction.sourceMemoryAddress;
    }
}

export function CMPr(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let a = registers.get(instruction.sourceRegister)
    let b = registers.get(instruction.destinationRegister);

    let result = b - a;

    setFlags(flags, result);
}

export function CMPZ(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let a = registers.get(instruction.destinationRegister)    

    let result = 0 - a;

    setFlags(flags, result);
}

export function CMP(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let a = getValue(instruction, Endpoint.Source, instruction.sourceRegister, memory, registers, 4);
    let b = getValue(instruction, Endpoint.Destination, instruction.destinationRegister, memory, registers, 4);

    let result = b - a;

    setFlags(flags, result);
}

export function SETE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const result = flags.Zero ? 1 : 0;
    registers.set(instruction.destinationRegister, result);
}

export function SETNE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const result = flags.Zero ? 0 : 1;
    registers.set(instruction.destinationRegister, result);
}

export function SETLT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const result = flags.Negative ? 1 : 0;
    registers.set(instruction.destinationRegister, result);
}

export function SETLTE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const result = flags.Negative || flags.Zero ? 1 : 0;
    registers.set(instruction.destinationRegister, result);
}

export function SETGT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const result = (flags.Negative || flags.Zero) ? 0 : 1;
    registers.set(instruction.destinationRegister, result);
}

export function SETGTE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    const result = (!flags.Negative || flags.Zero) ? 1 : 0;
    registers.set(instruction.destinationRegister, result);
}

export function TRUNCf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    let result = registers.get(instruction.destinationRegister);
    result = result - result % 1;
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function HALT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    throw new Error("HALT EXECUTION");
}