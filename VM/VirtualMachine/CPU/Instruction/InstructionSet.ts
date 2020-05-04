import InstructionSpecification, { OperandType } from "./InstructionSpecification";
import * as Dictionary from "../../Utilities/Dictionary";
import * as Executors from "./Instructions/InstructionExecutor";

const usesSourceRegister : boolean = true; 
const usesDestinationRegister : boolean = true; 
const usesRegisterReference : boolean = true;
const usesMemoryAddress : boolean = true;
const usesOperand : boolean = true;

export enum Registers {
    R0 = 0,
    R1 = 1,
    R2 = 2,
    R3 = 3,
    R4 = 4,
    R5 = 5,
    R6 = 6,
    SP = 7
}

export enum OpCodes {
    MVI,
    MVIw,
    MVIb,
    MVIf,
    LDR,
    LDRw,
    LDRb,
    LDRf,
    STR,
    STRw,
    STRb,
    STRf,
    MOV,
    MOVw,
    MOVb,
    MOVf,
    PUSH,
    PUSHw,
    PUSHb,
    PUSHf,
    POP,
    POPw,
    POPb,
    POPf,
    INT,
    CMPr,
    CMPZ,
    CMP,
    SETE,
    SETNE,
    SETLT,
    SETGT,
    SETLTE,
    SETGTE,
    JMP,
    JMR,
    JLT,
    JGE,
    JEQ,
    JNE,
    JNZ,
    CALL,
    RET,
    ADD,
    SUB,
    MUL,
    DIV,
    ADDf,
    SUBf,
    MULf,
    DIVf,
    NEG,    
    SWAP,
    INC,
    DEC,
    LSH,
    RSH,
    AND,
    OR,
    XOR,
    NOT,
    TRUNCf,
    LOOP,
    HALT    
}

const reg = OperandType.reg;
const value = OperandType.value;
const regOrValue = OperandType.regOrValue;
const regOrPointer = OperandType.regOrPointer; 
const regOrPointerOrValue = OperandType.regOrPointerOrValue; 

const  InstructionSet : InstructionSpecification[] = [

    new InstructionSpecification("LDR",    OpCodes.LDR,  [reg, regOrValue]),
    new InstructionSpecification("LDRw",   OpCodes.LDRw, [reg, regOrValue]),
    new InstructionSpecification("LDRb",   OpCodes.LDRb, [reg, regOrValue]),
    new InstructionSpecification("LDRf",   OpCodes.LDRf, [reg, regOrValue]),
    
    new InstructionSpecification("STR",    OpCodes.STR,  [regOrPointer, regOrPointer]),
    new InstructionSpecification("STRw",   OpCodes.STRw, [regOrPointer, regOrPointer]),
    new InstructionSpecification("STRb",   OpCodes.STRb, [regOrPointer, regOrPointer]),
    new InstructionSpecification("STRf",   OpCodes.STRf, [regOrPointer, regOrPointer]),

    new InstructionSpecification("MVI",    OpCodes.MVI,  [regOrPointer, regOrPointer]),
    new InstructionSpecification("MVIw",   OpCodes.MVIw, [regOrPointer, regOrPointer]),
    new InstructionSpecification("MVIb",   OpCodes.MVIb, [regOrPointer, regOrPointer]),
    new InstructionSpecification("MVIf",   OpCodes.MVIf, [regOrPointer, regOrPointer], 8),

    new InstructionSpecification("MOV",     OpCodes.MOV,  [regOrPointer, regOrPointer]),
    new InstructionSpecification("MOVw",    OpCodes.MOVw,  [regOrPointer, regOrPointer]),
    new InstructionSpecification("MOVb",    OpCodes.MOVb,  [regOrPointer, regOrPointer]),
    new InstructionSpecification("MOVf",    OpCodes.MOVf,  [regOrPointer, regOrPointer]),

    new InstructionSpecification("PUSH",    OpCodes.PUSH,  [regOrPointer]),
    new InstructionSpecification("PUSHw",   OpCodes.PUSHw, [regOrPointer]),
    new InstructionSpecification("PUSHb",   OpCodes.PUSHb, [regOrPointer]),
    new InstructionSpecification("PUSHf",   OpCodes.PUSHf, [regOrPointer]),

    new InstructionSpecification("POP",     OpCodes.POP,  [regOrPointer]),
    new InstructionSpecification("POPw",   OpCodes.POPw, [regOrPointer]),
    new InstructionSpecification("POPb",   OpCodes.POPb, [regOrPointer]),
    new InstructionSpecification("POPf",   OpCodes.POPf, [regOrPointer]),

    new InstructionSpecification("INT",     OpCodes.INT, [regOrPointer]),
    
    new InstructionSpecification("CMPr",     OpCodes.CMPr, [reg, reg]), // compare registers
    new InstructionSpecification("CMPZ",     OpCodes.CMPZ, [reg]), // compare register with zero
    new InstructionSpecification("CMP",      OpCodes.CMP,  [regOrPointer, regOrPointerOrValue]), // general purpose 4 byte compare
    
    new InstructionSpecification("SETE",     OpCodes.SETE, [regOrPointer]),
    new InstructionSpecification("SETNE",     OpCodes.SETNE, [regOrPointer]),
    new InstructionSpecification("SETGT",     OpCodes.SETGT, [regOrPointer]),
    new InstructionSpecification("SETGTE",     OpCodes.SETGTE, [regOrPointer]),
    new InstructionSpecification("SETLT",     OpCodes.SETLT, [regOrPointer]),
    new InstructionSpecification("SETLTE",     OpCodes.SETLTE, [regOrPointer]),

    new InstructionSpecification("JMP",     OpCodes.JMP, [regOrPointerOrValue]),
    new InstructionSpecification("JMR",     OpCodes.JMR, [regOrPointerOrValue]),
    
    new InstructionSpecification("JLT",     OpCodes.JLT, [value]),
    new InstructionSpecification("JGE",     OpCodes.JGE, [value]),
    new InstructionSpecification("JEQ",     OpCodes.JEQ, [value]),
    new InstructionSpecification("JNE",     OpCodes.JNE, [value]),
    new InstructionSpecification("JNZ",     OpCodes.JNZ, [value]),

    new InstructionSpecification("CALL",    OpCodes.CALL, [regOrPointer]),
    new InstructionSpecification("RET",     OpCodes.RET, []),

    new InstructionSpecification("ADD",     OpCodes.ADD, [regOrPointer, regOrPointer]),
    new InstructionSpecification("SUB",     OpCodes.SUB, [regOrPointer, regOrPointer]),
    new InstructionSpecification("MUL",     OpCodes.MUL, [regOrPointer, regOrPointer]),
    new InstructionSpecification("DIV",     OpCodes.DIV, [regOrPointer, regOrPointer]),
    new InstructionSpecification("ADDf",     OpCodes.ADDf, [regOrPointer, regOrPointer]),
    new InstructionSpecification("SUBf",     OpCodes.SUBf, [regOrPointer, regOrPointer]),
    new InstructionSpecification("MULf",     OpCodes.MULf, [regOrPointer, regOrPointer]),
    new InstructionSpecification("DIVf",     OpCodes.DIVf, [regOrPointer, regOrPointer]),
    
    new InstructionSpecification("NEG",     OpCodes.NEG, [regOrPointer]),
    new InstructionSpecification("INC",     OpCodes.INC, [regOrPointer]),
    new InstructionSpecification("DEC",     OpCodes.DEC, [regOrPointer]),
    new InstructionSpecification("LSH",     OpCodes.LSH, [regOrPointer, regOrPointer]),
    new InstructionSpecification("RSH",     OpCodes.RSH, [regOrPointer, regOrPointer]),
    new InstructionSpecification("AND",     OpCodes.AND, [regOrPointer, regOrPointer]),
    new InstructionSpecification("OR",      OpCodes.OR , [regOrPointer, regOrPointer]),
    new InstructionSpecification("XOR",     OpCodes.XOR, [regOrPointer, regOrPointer]),
    new InstructionSpecification("NOT",     OpCodes.NOT, [regOrPointer]),
    new InstructionSpecification("SWAP",     OpCodes.SWAP, [regOrPointer, regOrPointer]),
    new InstructionSpecification("LOOP",     OpCodes.LOOP, [reg, value]),
    new InstructionSpecification("TRUNCf",     OpCodes.TRUNCf, [reg]),
    
    new InstructionSpecification("HALT",    OpCodes.HALT, [])
];

const InstructionMap : { [name: string]: InstructionSpecification; } = Dictionary.toDictionary(InstructionSet, i => i.name.toUpperCase());
let InstructionOpcodeToNames : string[] = [];

InstructionSet.forEach(instruction => {
   InstructionOpcodeToNames[instruction.opcode] = instruction.name;  
});

function MapOpCodeToExecutor(opcode : number) : Executors.InstructionExecutor {
    const mnemonic = InstructionOpcodeToNames[opcode];
    
    const names = Object.keys(Executors);

    const funcName = names.filter(name => name.toLowerCase() === mnemonic.toLowerCase())[0];

    const executor = (Executors as any)[funcName];

    if(typeof(executor) != "function")
    {
        throw new Error(`${funcName} is not a valid instruction mnemonic`);
    }

    return executor;
}

export {
    InstructionSet,
    InstructionMap,
    InstructionOpcodeToNames,
    MapOpCodeToExecutor
};
