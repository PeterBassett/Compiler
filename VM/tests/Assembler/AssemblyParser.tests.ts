import { AssemblyParser, AssemblyLine, AssemblyLineKind, AssemblyLineSectionLabel, AssemblyLineLabel, AssemblyLineEntryPoint, AssemblyLineDataLabel, AssemblyLineInstruction, AssemblyLineInstructionOperand, AssemblyLineOperandKind, AssemblyLineInstructionOperandDereference, AssemblyLineInstructionOperandDataLabel, AssemblyLineInstructionOperandLabel, AssemblyLineInstructionOperandNumber, AssemblyLineInstructionOperandRegister, AssemblyLineInstructionOperandUnaryOperator, AssemblyLineInstructionOperandBinaryOperator, AssemblyLineError, AssemblyLineInstructionOperandError } from "../../Assembler/AssemblyParser";
import { AssemblyLexer } from "../../Assembler/AssemblyLexer";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import { Diagnostics, DiagnosticType } from "../../Language/Compiler/Diagnostics/Diagnostics";
import { AssemblyTokenKind } from "../../Assembler/IAssemblyLineLexer";
import StringDiagnosticsPrinter from "../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";

describe("The AssemblyParser class ", () => {
    
    function test(assemblyCode : string, expected:string) : void
    {
        const source = new SourceText(assemblyCode);
        const diagnostics = new Diagnostics(source);
        const lexer = new AssemblyLexer(source, diagnostics);
        const parser = new AssemblyParser(lexer, diagnostics);

        const output = parser.parse();

        const actual = printLines(output.lines);

        if(expected != actual)
        {
            for(let i = 0; i < actual.length; i++)
                if(expected[i] !== actual[i])
                    console.log(i);
        }

        expect(actual).toEqual(expected);
    }

    function testDiagnostics(assemblyCode:string, expectedDiagnostics:DiagnosticType[]) : void
    {
        const source = new SourceText(assemblyCode); 
        const diagnostics =  new Diagnostics(source);
        const lexer = new AssemblyLexer(source, diagnostics);
        const parser = new AssemblyParser(lexer, diagnostics);

        const output = parser.parse();

        const actual = printLines(output.lines);

        assertExpectedErrors(assemblyCode, output.diagnostics, expectedDiagnostics);                
    }

    function assertExpectedErrors(source : string, diagnostics : Diagnostics, expectedDiagnostics:DiagnosticType[]) : void
    {
        expect(diagnostics.length).toEqual(expectedDiagnostics.length);

        if(diagnostics.length != expectedDiagnostics.length)
        {
            const printer = new StringDiagnosticsPrinter();
            diagnostics.map( (d, i) => {
                const output = printer.printDiagnostic(diagnostics, d);
                fail(`${source} : ${output}`);
                return "";
            });        
        }
        else
        {
            for(let i = 0; i < diagnostics.length; i++)
            {
                expect(expectedDiagnostics[i]).toEqual(diagnostics.get(i).type);
            }
        }
    }
    
    function printLines(lines : AssemblyLine[]) : string
    {
        let output : string[] = [];
        for(let line of lines)
        {
            printLine(output, line);
        }

        return output.join("\n");
    }

    function printLine(output:string [], line : AssemblyLine) : void
    {
        switch(line.kind)
        {
            case AssemblyLineKind.SectionLabel:
            {
                const sectionLabel = line as AssemblyLineSectionLabel;
                output.push(sectionLabel.labelText.lexeme);
                break;
            }
            case AssemblyLineKind.Label:
            {
                const label = line as AssemblyLineLabel;
                output.push(label.labelText.lexeme);
                break;
            }                
            case AssemblyLineKind.EntryPoint:
            {
                const entryPoint = line as AssemblyLineEntryPoint;
                output.push(entryPoint.globalText.lexeme + " " + entryPoint.entryPointText.lexeme);
                break;
            }                         
            case AssemblyLineKind.DataLabel:
            {
                printDataLabel(output, line as AssemblyLineDataLabel);
                break;
            }                         
            case AssemblyLineKind.Instruction:
            {
                printInstruction(output, line as AssemblyLineInstruction);
                break;
            }  
            case AssemblyLineKind.Error:
            {
                const error = line as AssemblyLineError;
                output.push("ERROR");
                break;
            }                                                 
        }
    }

    function printDataLabel(output:string [], label : AssemblyLineDataLabel) : void
    {        
        let line : string = "    " + label.labelText.lexeme;

        if(label.type)
        {
            line += " " + label.type.lexeme;            
        }

        if(label.initialValue)
        {
            line += " " + label.initialValue.lexeme;
        }            
            
        output.push(line);
    }

    function printInstruction(output:string [], instruction : AssemblyLineInstruction) : void
    {
        let operands  : string[] = [];

        const mnemonic = instruction.mnemonic.lexeme.toUpperCase();

        if(instruction.operands.length === 0)
        {
            output.push("    " + mnemonic);
            return;
        }
        
        for(let op of instruction.operands)
        {
            const operand = printInstructionOperand(op);
            operands.push(operand);
        }    

        output.push("    " + mnemonic + " " + operands.join(", "));
    }

    
    function printInstructionOperand(operand:AssemblyLineInstructionOperand) : string
    {
        switch(operand.kind)
        {
            case AssemblyLineOperandKind.Dereference:
            {
                const dereference = operand as AssemblyLineInstructionOperandDereference;
                return "[" + printInstructionOperand(dereference.operand) + "]";
            }
            case AssemblyLineOperandKind.DataLabel:
            {
                const label = operand as AssemblyLineInstructionOperandDataLabel;
                return label.name.lexeme;
            }
            case AssemblyLineOperandKind.Label:
            {
                const label = operand as AssemblyLineInstructionOperandLabel;
                return label.name.lexeme;
            }            
            case AssemblyLineOperandKind.Number:
            {
                const num = operand as AssemblyLineInstructionOperandNumber;

                switch(num.valueToken.token)
                {
                    case AssemblyTokenKind.NUMBER:
                        return num.value.toString();
                    case AssemblyTokenKind.BINNUMBER:
                        return "0b" + num.value.toString(2);
                    case AssemblyTokenKind.HEXNUMBER:
                        return "0x" + num.value.toString(16);
                    case AssemblyTokenKind.FLOAT_NUMBER:
                        return num.value.toString();
                    default:
                        throw new Error("Unexpected token type");
                }                                
            }
            case AssemblyLineOperandKind.Register:
            {
                const register = operand as AssemblyLineInstructionOperandRegister;
                return register.name.lexeme.toUpperCase();
            }
            case AssemblyLineOperandKind.UnaryOperator:
            {
                const unary = operand as AssemblyLineInstructionOperandUnaryOperator;
                return unary.operatorToken.lexeme + printInstructionOperand(unary.right);
            }            
            case AssemblyLineOperandKind.BinaryOperator:
            {
                const binary = operand as AssemblyLineInstructionOperandBinaryOperator;
                return printInstructionOperand(binary.left) + binary.operatorToken.lexeme + printInstructionOperand(binary.right);
            }     
            case AssemblyLineOperandKind.Error:
            {
                const error = operand as AssemblyLineInstructionOperandError;

                if(error.contained)
                    return "<" + printInstructionOperand(error.contained) + ">";
                
                return error.name.lexeme;
            }                
            default:
                throw new Error("Unexpected operand type")                   ;
        }
    }

const examples = [
[`.data
.text
.global start:
    start:
    mvi r5 20
    halt`, 
`.data
.text
.global start:
start:
    MVI R5, 20
    HALT`],
[`
.data
    .takesUpSpace float 123.456
.text
.global start:
    start:
    ldrf r5 .takesUpSpace
    halt`, 
`.data
    .takesUpSpace float 123.456
.text
.global start:
start:
    LDRF R5, .takesUpSpace
    HALT`],
[`
.data
.text
.global start:
    start:               
    mov R3 [R2]
    halt`, 
`.data
.text
.global start:
start:
    MOV R3, [R2]
    HALT`],
[`
.data
.text
.global start:
    start:
    mvi r1 123
    str r1 900
    mvi r2 900       
    mov r3 [r2]
    halt`, 
`.data
.text
.global start:
start:
    MVI R1, 123
    STR R1, 900
    MVI R2, 900
    MOV R3, [R2]
    HALT`],
[`
.data
.text
.global start:
    start:
    mvi r1 20
    mvi r2 123

    mov [r1+30] r2
    mov r3 [r1+30]
    
    halt`, 
`.data
.text
.global start:
start:
    MVI R1, 20
    MVI R2, 123
    MOV [R1+30], R2
    MOV R3, [R1+30]
    HALT`],
[`
    .data
    .text
    .global start:
        start:
        mvi r1 120
        mvi r2 153

        mov [r1-30] r2
        mov r3 [r1-30]
        
        halt`, 
`.data
.text
.global start:
start:
    MVI R1, 120
    MVI R2, 153
    MOV [R1-30], R2
    MOV R3, [R1-30]
    HALT`],
[`
.data
.text
.global start:
                start:
    mvi r1 20
    mvi r2 10
    cmp r1 r2
    jne label2:
label1:
    mvi r1 1
    halt
label2:
    mvi r1 2
    halt`, 
`.data
.text
.global start:
start:
    MVI R1, 20
    MVI R2, 10
    CMP R1, R2
    JNE label2:
label1:
    MVI R1, 1
    HALT
label2:
    MVI R1, 2
    HALT`],
[`
.data
.text
.global start:
start:
    mvi r1 0b10110101
    mvi r2 0b1111000

    mvi r3 0b00110000

    and r2 r1

    halt`, 
`.data
.text
.global start:
start:
    MVI R1, 0b10110101
    MVI R2, 0b1111000
    MVI R3, 0b110000
    AND R2, R1
    HALT`],
[`
.data
.text
.global start:
    start:
    mvi r1 5
    mvi r2 0
    mvi r3 1

    start_loop:

    add r2 r3

    loop r1 start_loop:
    
    halt`, 
`.data
.text
.global start:
start:
    MVI R1, 5
    MVI R2, 0
    MVI R3, 1
start_loop:
    ADD R2, R3
    LOOP R1, start_loop:
    HALT`],
[`
.data
    .a float 31.14
    .b float 2.1
.text
.global start:
    start:
    ldrf r1 .a
    ldrf r2 .b
    divf r1 r2
    halt`, 
`.data
    .a float 31.14
    .b float 2.1
.text
.global start:
start:
    LDRF R1, .a
    LDRF R2, .b
    DIVF R1, R2
    HALT`],
[`
.data
    .x byte 10
    .y byte 6        
    .expected byte 60
.text
.global intro:
intro:

    ldrb r3 .x
    ldrb r4 .y
    ldrb r6 .expected
    mul r4 r3

    halt`, 
`.data
    .x byte 10
    .y byte 6
    .expected byte 60
.text
.global intro:
intro:
    LDRB R3, .x
    LDRB R4, .y
    LDRB R6, .expected
    MUL R4, R3
    HALT`],
[`
.data
    .x word 10
    .y word 6
    .expected word 60
.text
.global intro:
intro:

    ldrw r3 .x
    ldrw r4 .y
    ldrw r6 .expected
    mul r4 r3

    halt`, 
`.data
    .x word 10
    .y word 6
    .expected word 60
.text
.global intro:
intro:
    LDRW R3, .x
    LDRW R4, .y
    LDRW R6, .expected
    MUL R4, R3
    HALT`],
[`
.data
.text
.global start:
    start:
    mov r1, 1 + 2
    halt`, 
`.data
.text
.global start:
start:
    MOV R1, 1+2
    HALT`],   
[`
.data
.text
.global start:
    start:
    mov 1+ 2, r1
    halt`, 
`.data
.text
.global start:
start:
    MOV 1+2, R1
    HALT`],       
[`
.data
    .a byte 8
    .b byte 9
.text
.global start:
    start:
    mov r1, .a+2
    halt`, 
`.data
    .a byte 8
    .b byte 9
.text
.global start:
start:
    MOV R1, .a+2
    HALT`],     
[`
.data
    .a byte 8
    .b byte 9
.text
.global start:
    start:
    mov r1, .a+.b
    halt`, 
`.data
    .a byte 8
    .b byte 9
.text
.global start:
start:
    MOV R1, .a+.b
    HALT`],
[`
.data
    .a byte 8
    .b byte 9
.text
.global start:
    start:
    mov .a+2, r1
    halt`, 
`.data
    .a byte 8
    .b byte 9
.text
.global start:
start:
    MOV .a+2, R1
    HALT`],     
[`
.data
    .a byte 8
    .b byte 9
.text
.global start:
    start:
    mov .a+.b, r1
    halt`, 
`.data
    .a byte 8
    .b byte 9
.text
.global start:
start:
    MOV .a+.b, R1
    HALT`],            
[`.one    'test'`, 
`    .one 'test'`],
[`.two    byte   123`, 
`    .two byte 123`],
[`.three size   456`, 
`    .three size 456`],
[`.four "another test"`, 
`    .four "another test"`],
[`.five word 345  `, 
`    .five word 345`],
[`.six long    12345`, 
`    .six long 12345`],
[`.seven float    3.14159`, 
`    .seven float 3.14159`]

].forEach((item) => {
        it(`should parse an assembly program and produce an array of trees. ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as string;
            test(text, expected);
        }); 
    });

[
  /*  [`
    .data
        .x word 10
        .y word 6
        .expected word 60
    .text
    .global main:
    main:    
        MOV [R3+R1] 1
        halt`, 
    [DiagnosticType.InvalidAssemblyOperand]],*/
    [`
    .data
        .x word 10
        .y word 6
        .expected word 60
    .text
    .global main:
    main:    
        MOV [R3+R1-[2+.x]] 1
        halt`, 
    [DiagnosticType.AssemblyInvalidNestedDereference]]    
].forEach((item) => {
        it(`should emit diagnostics for malformed assembly ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as DiagnosticType[];
            testDiagnostics(text, expected);
        }); 
    });    
});