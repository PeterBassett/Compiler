
import Instruction from "./Instruction";
import Memory from "../../Memory/Memory";

export default interface InstructionCoder
{
    encodeInstruction(opcode : number, 
        opcodeMode : number, 
        sourceRegister : number,
        destinationRegister : number, 
        memoryAddress : number): Uint8Array;
        
    decodeInstruction (memory : Memory, offset : number) : { instruction: Instruction, length:number }
}