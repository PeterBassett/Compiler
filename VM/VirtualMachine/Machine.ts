import RAM from "./Memory/RAM";
import CPU from "./CPU/CPU";
import RegisterBank from "./CPU/RegisterBank";
import InstructionCoder32Bit from "./CPU/Instruction/InstructionCoder32Bit";
import Flags from "./CPU/Flags";

export default class Machine {
    
    private cpu : CPU;
    private memory : RAM;
    private registers : RegisterBank;
    private flags : Flags;
    private instructionDecoder : InstructionCoder32Bit;
    
    constructor()
    {
        this.memory = new RAM(65535);
        this.registers = new RegisterBank(this.memory.capacity);
        this.flags = new Flags();
        this.instructionDecoder = new InstructionCoder32Bit();

        this.cpu = new CPU(this.memory, this.registers, this.flags, this.instructionDecoder);
    }

    public step() : boolean {
        this.cpu.step();
        return true;
    }
}