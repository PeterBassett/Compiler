import { AssemblyLineLexer, Token, OperandToken } from "../../Assembler/AssemblyLineLexer";

describe("The AssemblyLineLexer class ", () => {

    function test(line : string, tokenTypes : OperandToken[])
    {
        let lexer = new AssemblyLineLexer(line);

        var tokens : Token[] = [];
        while(lexer.advance())
            tokens.push(lexer.current);

        expect(tokens.length).toEqual(tokenTypes.length);

        for(let i = 0; i < tokens.length; i++)
        {
            expect(tokens[i].token).toEqual(tokenTypes[i]);    
        }
    }
    
    it("lexes an identifier", () => {
        test("abcdef", [ OperandToken.IDENTIFIER ]);
    });

    it("lexes an integer", () => {
        test("12345", [ OperandToken.NUMBER ]);
    });

    it("lexes a hex integer", () => {
        test("0xdeadbeef", [ OperandToken.NUMBER ]);
    });

    it("lexes a bin integer", () => {
        test("0b101110011", [ OperandToken.NUMBER ]);
    });

    it("lexes a plus", () => {
        test("+", [ OperandToken.PLUS ]);
    });

    it("lexes a minus", () => {
        test("-", [ OperandToken.MINUS ]);
    });

    it("lexes a left square bracket", () => {
        test("[", [ OperandToken.LEFT_SQUARE_BRACKET ]);
    });

    it("lexes a right square bracket", () => {
        test("]", [ OperandToken.RIGHT_SQUARE_BRACKET ]);
    });

    it("lexes a register", () => {
        test("R0", [ OperandToken.REGISTER ]);
    });

    it("lexes a register", () => {
        test("R0 + R1", [ OperandToken.REGISTER, OperandToken.PLUS, OperandToken.REGISTER ]);
    });

    it("lexes all registers", () => {
        for(let i = 0; i < 7; i++)
            test("R" + i, [ OperandToken.REGISTER ]);
    });

    it("lexes a line of assembly with lowercase mnemonic", () => {
        test("mvi R0 555", [ OperandToken.IDENTIFIER, OperandToken.REGISTER, OperandToken.NUMBER ]);
    });

    it("lexes a line of assembly with a zero literal", () => {
        test("mvi R0 0", [ OperandToken.IDENTIFIER, OperandToken.REGISTER, OperandToken.NUMBER ]);
    });    

    it("lexes a line of assembly with source and destination registers", () => {
        test("ADD R3 R2", [ OperandToken.IDENTIFIER, OperandToken.REGISTER, OperandToken.REGISTER ]);
    });
    
    it("lexes a line of assembly with only a memory address", () => {
        test("JMP 31567", [ OperandToken.IDENTIFIER, OperandToken.NUMBER ]);
    });

    it("lexes a line of assembly with only an opcode mode", () => {
        test("INT 3", [ OperandToken.IDENTIFIER, OperandToken.NUMBER ]);
    });

    it("lexes a line of assembly with no additional information", () => {
        test("RET", [ OperandToken.IDENTIFIER ]);
    });

    it("lexes a line of assembly with which references a memory location by register pointer", () => {
        test("MOV R4 [R1]", [ OperandToken.IDENTIFIER, OperandToken.REGISTER, OperandToken.LEFT_SQUARE_BRACKET, OperandToken.REGISTER, OperandToken.RIGHT_SQUARE_BRACKET ] );
    });

    it("lexes a line of assembly with which references a memory location by offset register pointer", () => {
        test("MOV R4 [R1 + 1234]", [ OperandToken.IDENTIFIER, OperandToken.REGISTER, OperandToken.LEFT_SQUARE_BRACKET, OperandToken.REGISTER, OperandToken.PLUS, OperandToken.NUMBER, OperandToken.RIGHT_SQUARE_BRACKET ] );
    });

    it("lexes a line of assembly with which references a memory location by negative offset register pointer", () => {
        test("MVI R1 [SP-4]", [ OperandToken.IDENTIFIER, OperandToken.REGISTER, OperandToken.LEFT_SQUARE_BRACKET, OperandToken.REGISTER, OperandToken.MINUS, OperandToken.NUMBER, OperandToken.RIGHT_SQUARE_BRACKET ] );
    });
});