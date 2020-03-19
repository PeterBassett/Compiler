import Memory from "../Memory/Memory";
import RegisterBank from "./RegisterBank";
import Flags from "./Flags";
import Instruction from "./Instruction/Instruction";
import InstructionCoder from "./Instruction/InstructionCoder";
import { MapOpCodeToExecutor } from "./Instruction/InstructionSet";
import { InstructionExecutor } from "./Instruction/Instructions/InstructionExecutor";
import BuiltinFunctions, { BuiltinFunction } from "../../Language/Compiler/BuiltinFunctions";

export default class CPU
{        
    private ram: Memory;
    private registers : RegisterBank;
    private flags : Flags;
    private instructionDecoder : InstructionCoder;
    public readonly builtins : BuiltinFunctions;

    constructor(ram : Memory, registers : RegisterBank, flags : Flags, instructionDecoder : InstructionCoder, builtins? : BuiltinFunctions)
    {        
        this.ram = ram;
        this.registers = registers;
        this.flags = flags;
        this.instructionDecoder = instructionDecoder;
        this.builtins = builtins || new BuiltinFunctions();
    }

    public step(): Instruction {
        const instruction = this.fetchNextInstruction();
        this.execute(instruction);
        return instruction;
    }

    private fetchNextInstruction() : Instruction
    {
        const { instruction, length } = this.instructionDecoder.decodeInstruction(this.ram, this.registers.IP); 
        instruction.encodedLength = length;       
        this.registers.IP += length;
        return instruction;
    }

    private execute(instruction : Instruction) : void
    {
        const executor = MapOpCodeToExecutor(instruction.opcode) as InstructionExecutor;
        executor(this, instruction, this.ram, this.registers, this.flags);
    }

    private interupts : { [id: number]: (interupt: any, vector: any) => void; } = {};
    public interupt(interupt: number, vectorParam: number): any {
        if(this.interupts[interupt])
            this.interupts[interupt](interupt, vectorParam);
    }

    public addInterupt(interupt: number, handler: (interupt: any, vector: any) => void): any {        
        this.interupts[interupt] = handler;
    }
}