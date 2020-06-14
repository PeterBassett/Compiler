import { IAssemblyLineLexer, AssemblyToken, AssemblyTokenKind } from "../../Assembler/IAssemblyLineLexer";
import { AssemblyLexer } from "../../Assembler/AssemblyLexer";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import { Diagnostics } from "../../Language/Compiler/Diagnostics/Diagnostics";

describe("The AssemblyLexer class ", () => {

    function test(assembly : string, tokenTypes : AssemblyTokenKind[])
    {
        const source = new SourceText(assembly);
        const diagnostics = new Diagnostics(source);        
        let lexer : IAssemblyLineLexer = new AssemblyLexer(source, diagnostics);

        var tokens : AssemblyToken[] = [];
        while(lexer.advance())
            tokens.push(lexer.current);

        expect(tokens.length).toEqual(tokenTypes.length);

        for(let i = 0; i < tokens.length; i++)
        {
            expect(tokens[i].token).toEqual(tokenTypes[i]);    
        }
    }
    
    it("lexes an identifier", () => {
        test("abcdef", [ AssemblyTokenKind.IDENTIFIER ]);
    });

    it("lexes an integer", () => {
        test("12345", [ AssemblyTokenKind.NUMBER ]);
    });

    it("lexes a hex integer", () => {
        test("0xdeadbeef", [ AssemblyTokenKind.HEXNUMBER ]);
    });

    it("lexes a bin integer", () => {
        test("0b101110011", [ AssemblyTokenKind.BINNUMBER ]);
    });

    it("lexes a float", () => {
        test("3.14159", [ AssemblyTokenKind.FLOAT_NUMBER ]);
    });

    it("lexes a plus", () => {
        test("+", [ AssemblyTokenKind.PLUS ]);
    });

    it("lexes a minus", () => {
        test("-", [ AssemblyTokenKind.MINUS ]);
    });

    it("lexes a negative integer", () => {
        test("-12345", [ AssemblyTokenKind.MINUS, AssemblyTokenKind.NUMBER ]);
    });

    it("lexes a left square bracket", () => {
        test("[", [ AssemblyTokenKind.LEFT_SQUARE_BRACKET ]);
    });

    it("lexes a right square bracket", () => {
        test("]", [ AssemblyTokenKind.RIGHT_SQUARE_BRACKET ]);
    });

    it("lexes a register", () => {
        test("R0", [ AssemblyTokenKind.REGISTER ]);
    });

    it("lexes a string in double quotes", () => {
        test(`"abcdef"`, [ AssemblyTokenKind.STRING ]);
    });

    it("lexes a string in single quotes", () => {
        test(`'abcdef'`, [ AssemblyTokenKind.STRING ]);
    });

    it("lexes a register", () => {
        test("R0 + R1", [ AssemblyTokenKind.REGISTER, AssemblyTokenKind.PLUS, AssemblyTokenKind.REGISTER ]);
    });

    it("lexes all registers", () => {
        for(let i = 0; i < 7; i++)
            test("R" + i, [ AssemblyTokenKind.REGISTER ]);
    });

    it("lexes a line of assembly with lowercase mnemonic", () => {
        test("mvi R0 555", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.NUMBER ]);
    });

    it("lexes a line of assembly with a zero literal", () => {
        test("mvi R0 0", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.NUMBER ]);
    });    

    it("lexes a line of assembly with source and destination registers", () => {
        test("ADD R3 R2", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.REGISTER ]);
    });
    
    it("lexes a line of assembly with only a memory address", () => {
        test("JMP 31567", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.NUMBER ]);
    });

    it("lexes a line of assembly with only an opcode mode", () => {
        test("INT 3", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.NUMBER ]);
    });

    it("lexes a line of assembly with no additional information", () => {
        test("RET", [ AssemblyTokenKind.IDENTIFIER ]);
    });

    it("lexes a line of assembly with a label", () => {
        test("label:", [ AssemblyTokenKind.LABEL ]);
    });

    it("lexes a comma", () => {
        test(",", [ AssemblyTokenKind.COMMA ]);
    });

    it("lexes a line of assembly with a label containing underscores and numbers", () => {
        test("label1_2test:", [ AssemblyTokenKind.LABEL ]);
    });

    it("lexes a line of assembly with a datalabel", () => {
        test(".datalabel", [ AssemblyTokenKind.DATALABEL ]);
    });

    it("lexes a line of assembly with a datalabelcontaining underscores and numbers", () => {
        test(".datalabel1_234_test", [ AssemblyTokenKind.DATALABEL ]);
    });

    it("lexes a line of assembly with which references a memory location by register pointer", () => {
        test("MOV R4 [R1]", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.LEFT_SQUARE_BRACKET, AssemblyTokenKind.REGISTER, AssemblyTokenKind.RIGHT_SQUARE_BRACKET ] );
    });

    it("lexes a line of assembly with which references a memory location by offset register pointer", () => {
        test("MOV R4 [R1 + 1234]", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.LEFT_SQUARE_BRACKET, AssemblyTokenKind.REGISTER, AssemblyTokenKind.PLUS, AssemblyTokenKind.NUMBER, AssemblyTokenKind.RIGHT_SQUARE_BRACKET ] );
    });

    it("lexes a line of assembly with which references a memory location by negative offset register pointer", () => {
        test("MVI R1 [SP-4]", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.LEFT_SQUARE_BRACKET, AssemblyTokenKind.REGISTER, AssemblyTokenKind.MINUS, AssemblyTokenKind.NUMBER, AssemblyTokenKind.RIGHT_SQUARE_BRACKET ] );
    });

    it("lexes a line of assembly with register and second operand of bare negative", () => {
        test("MVI R1, -4", [ AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.REGISTER, AssemblyTokenKind.COMMA, AssemblyTokenKind.MINUS, AssemblyTokenKind.NUMBER ] );
    });

    it("remomoves leading newlines", () => {
        test(`
.data
    .takesUpSpace float 123.456
`, [AssemblyTokenKind.DATALABEL, AssemblyTokenKind.NEWLINE, AssemblyTokenKind.DATALABEL, AssemblyTokenKind.IDENTIFIER, AssemblyTokenKind.FLOAT_NUMBER, AssemblyTokenKind.NEWLINE ])
    });
    it("an example function with a variety parameter types", () => {
        test(
        `
    .data
    .text
    .global __entrypoint:
    __entrypoint:
        MOV R6 SP				; Initialise Base Pointer
        CALL main:
        HALT
    
    main:
        PUSH R6				; save old value of stack pointer
        MOV R4 IP				; R6 is bottom of stack. Make current top of stack the bottom of the new stack frame
        MOVb R1 [R6-10]				; read variable d from the stack

        MOVb [R3+123], [R6-10]	
    ; Calling test
    ; Removing arguments from stack
        RET`, [
            //.data
            AssemblyTokenKind.DATALABEL,
            AssemblyTokenKind.NEWLINE,
            //.text
            AssemblyTokenKind.DATALABEL,
            AssemblyTokenKind.NEWLINE,
            //.global __entrypoint:
            AssemblyTokenKind.DATALABEL,
            AssemblyTokenKind.LABEL,            
            AssemblyTokenKind.NEWLINE,
            //__entrypoint:
            AssemblyTokenKind.LABEL,
            AssemblyTokenKind.NEWLINE,
            //MOV R6 SP
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.NEWLINE,
            //CALL main:
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.LABEL,
            AssemblyTokenKind.NEWLINE,
            //HALT
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.NEWLINE,

            //main:
            AssemblyTokenKind.LABEL,
            AssemblyTokenKind.NEWLINE,

            //PUSH R6
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.REGISTER,            
            AssemblyTokenKind.NEWLINE,

            //MOV R4 IP
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.NEWLINE,

            //MOVb R1 [R6-10]
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.LEFT_SQUARE_BRACKET,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.MINUS,
            AssemblyTokenKind.NUMBER,
            AssemblyTokenKind.RIGHT_SQUARE_BRACKET,
            AssemblyTokenKind.NEWLINE,

            //MOVb [R3+123], [R6-10]
            AssemblyTokenKind.IDENTIFIER,
            AssemblyTokenKind.LEFT_SQUARE_BRACKET,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.PLUS,
            AssemblyTokenKind.NUMBER,
            AssemblyTokenKind.RIGHT_SQUARE_BRACKET,
            AssemblyTokenKind.COMMA,
            AssemblyTokenKind.LEFT_SQUARE_BRACKET,
            AssemblyTokenKind.REGISTER,
            AssemblyTokenKind.MINUS,
            AssemblyTokenKind.NUMBER,
            AssemblyTokenKind.RIGHT_SQUARE_BRACKET,
            AssemblyTokenKind.NEWLINE,

            //RET
            AssemblyTokenKind.IDENTIFIER
        ]);
    });
});