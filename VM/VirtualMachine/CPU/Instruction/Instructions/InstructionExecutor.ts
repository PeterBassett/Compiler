import Instruction from "../Instruction";
import Memory from "../../../Memory/Memory";
import RegisterBank from "../../RegisterBank";
import { Registers } from "../InstructionSet";
import Flags from "../../Flags";
import CPU from "../../CPU";
import { decodeInstructionOperand } from "../../../../Assembler/AssemblyLineParser";
import BuiltinFunctions from "../../../../Language/Compiler/BuiltinFunctions";

type InstructionExecutor = (cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags: Flags) => void;
export { InstructionExecutor };

function isPointer(opcodeMode : number, scale : number) : boolean 
{
    opcodeMode = opcodeMode >> scale;
    return (opcodeMode & 1) == 1;
}

function isTwoRelativeAddressed(instruction:Instruction)
{
    return  isPointer(instruction.opcodeMode, Endpoint.Source) &&
            isPointer(instruction.opcodeMode, Endpoint.Destination); 
}

function isRegister(opcodeMode : number, scale : number) : boolean 
{
    opcodeMode = opcodeMode >> scale;
    return (opcodeMode & 4) == 4;
}

export function decodeInstructionOperandToValue(value : number, endpoint :Endpoint, isTwoOffsets:boolean) : number
{
    let f = decodeInstructionOperand(value, isTwoOffsets);

    if(f.op1Offset8 != null && endpoint == Endpoint.Destination)
        return f.op1Offset8;

    if(f.op2Offset8 != null && endpoint == Endpoint.Source)
        return f.op2Offset8;
    
    throw RangeError();
}

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
    if(isRegister(instruction.opcodeMode, endpoint))
    {
        if(isPointer(instruction.opcodeMode, endpoint))
        {            
            let registerValue = registers.get(register);
            let offset = decodeInstructionOperandToValue(instruction.memoryAddress, endpoint, isTwoRelativeAddressed(instruction));
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
        value = readBytes(value, size);
        memory.storeNumber(instruction.memoryAddress, value, size);
    }
}

function getValue(instruction : Instruction,    
                  endpoint : Endpoint, 
                  register: number,
                  memory : Memory,
                  registers : RegisterBank,
                  size : number) : number
{
    var value = 0;
    if(isRegister(instruction.opcodeMode, endpoint))
    {
        value = registers.get(register);

        if(isPointer(instruction.opcodeMode, endpoint))
        {            
            let offset = decodeInstructionOperandToValue(instruction.memoryAddress, endpoint, isTwoRelativeAddressed(instruction));
            return memory.readNumber(value + offset, size);             
        }        
    }
    else
        value = instruction.memoryAddress;

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
    const hardCodedValue = instruction.memoryAddress;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function MVIb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.memoryAddress & 0xff;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function MVIw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.memoryAddress & 0xffff;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function MVIf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const hardCodedValue = instruction.memoryAddress & 0xffffffff;
    registers.set(instruction.destinationRegister, hardCodedValue);    
}

export function STR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeDWord(instruction.memoryAddress, registers.get(instruction.destinationRegister));
}

export function STRw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeWord(instruction.memoryAddress, registers.get(instruction.destinationRegister));
}

export function STRb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeByte(instruction.memoryAddress, registers.get(instruction.destinationRegister));
}

export function STRf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    memory.storeFloat64(instruction.memoryAddress, registers.get(instruction.destinationRegister));
}

export function LDR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readDWord(instruction.memoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function LDRw(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readWord(instruction.memoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function LDRb(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readByte(instruction.memoryAddress);
    registers.set(instruction.destinationRegister, value);
}

export function LDRf(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const value = memory.readFloat64(instruction.memoryAddress);
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
    registers.SP += 8;
    const value = memory.readFloat64(registers.SP);
    registers.set(instruction.destinationRegister, value);
}

export function INT(cpu : CPU, instruction: Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
//    let interupt = instruction.memoryAddress >> 8;
 //   let vector = instruction.memoryAddress & 255;

    let interupt = memory.readDWord(registers.SP);
    let paramCount = memory.readDWord(registers.SP+4);
    let params :number [] = [];

    for (let index = 0; index < paramCount; index++) {
        params.push(memory.readDWord(registers.SP+8 + (index*4)));
    }

    let func = BuiltinFunctions.findByInterupt(interupt);

    if(!func)
        throw new RangeError("Invalid interupt requested");

    let result = func!.executor(params);

    registers.R1 = result;  
}

export function JMP(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    registers.IP = instruction.memoryAddress;
}

export function JMR(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    registers.IP = registers.get(instruction.destinationRegister);
}

export function JLT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(flags.Negative)
        registers.IP = instruction.memoryAddress;
}

export function JGE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Negative || flags.Zero)
        registers.IP = instruction.memoryAddress;
}

export function JEQ(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Negative && flags.Zero)
        registers.IP = instruction.memoryAddress;
}

export function JNE(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Zero)
        registers.IP = instruction.memoryAddress;
}

export function JNZ(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    if(!flags.Zero)
        registers.IP = instruction.memoryAddress;
}

export function CALL(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {    
    registers.SP -= 4;
    memory.storeDWord(registers.SP, registers.IP);    
    registers.IP = instruction.memoryAddress;
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

const IntegerMath :MathOptions = {
    integerMath :true, 
    size : 4
};

const DoubleMath :MathOptions = {
    integerMath : false, 
    size : 8
};

class MathOptions
{
    public integerMath : boolean = true;
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

    if(options.integerMath)
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
    const result = registers.get(instruction.destinationRegister) << instruction.memoryAddress;
    registers.set(instruction.destinationRegister, result);
    setFlags(flags, result);
}

export function RSH(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    const result = registers.get(instruction.destinationRegister) >> instruction.memoryAddress;
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
        registers.IP = instruction.memoryAddress;
    }
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

export function HALT(cpu : CPU, instruction:Instruction, memory: Memory, registers: RegisterBank, flags : Flags): void {
    throw new Error("HALT EXECUTION");
}