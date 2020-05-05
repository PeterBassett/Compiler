
import Instruction, { OpcodeModes } from "./Instruction";
import Memory from "../../Memory/Memory";

export default interface InstructionCoder
{
    encodeInstruction(opcode : number, 
        opcodeMode : OpcodeModes, 
        sourceRegister : number,
        destinationRegister : number, 
        destinationMemoryAddress : number,
        sourceMemoryAddress : number): Uint8Array;
        
    decodeInstruction (memory : Memory, offset : number) : { instruction: Instruction, length:number }

    calculateInstructionLength(opcode:number) : { isCertain :boolean, instructionLength : number }
}