import { encodeInstructionOperand, decodeInstructionOperand } from "../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";

describe("The encodeInstructionOperand function ", () => {
    it("encodes a single string", () => {
       
        const actual = encodeInstructionOperand(5, 10, true);
        
        const operands = decodeInstructionOperand(actual, true);

        expect(operands.op1Offset8).toEqual(5);
        expect(operands.op2Offset8).toEqual(10);
    });

    it("encodes a single string", () => {
       
        const actual = encodeInstructionOperand(127, 127, false);
        
        const operands = decodeInstructionOperand(actual, false);

        expect(operands.op1Offset8).toEqual(127);
        expect(operands.op2Offset8).toEqual(127);
    });

    it("encodes a single string", () => {
       
        const actual = encodeInstructionOperand(-127, -127, false);
        
        const operands = decodeInstructionOperand(actual, false);

        expect(operands.op1Offset8).toEqual(-127);
        expect(operands.op2Offset8).toEqual(-127);
    });

    it("encodes a single string", () => {
       
        const actual = encodeInstructionOperand(-127, 127, false);
        
        const operands = decodeInstructionOperand(actual, false);

        expect(operands.op1Offset8).toEqual(-127);
        expect(operands.op2Offset8).toEqual(127);
    });

    it("encodes a single string", () => {
       
        const actual = encodeInstructionOperand(0, 127, false);
        
        const operands = decodeInstructionOperand(actual, false);

        expect(operands.op1Offset8).toEqual(0);
        expect(operands.op2Offset8).toEqual(127);
    });

    it("encodes a single string", () => {
       
        const actual = encodeInstructionOperand(127, 0, false);
        
        const operands = decodeInstructionOperand(actual, false);

        expect(operands.op1Offset8).toEqual(127);
        expect(operands.op2Offset8).toEqual(0);
    });
});