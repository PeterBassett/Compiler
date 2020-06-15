import { IAssemblyLexer } from "./IAssemblyLexer";
import { AssemblyTokenKind } from "./AssemblyTokenKind";
import { AssemblyToken } from "./AssemblyToken";
import Instruction, { OpcodeModes, OpcodeMode } from "../VirtualMachine/CPU/Instruction/Instruction";
import { InstructionMap, OpCodes } from "../VirtualMachine/CPU/Instruction/InstructionSet";
import InstructionCoder32Bit from "../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import { Diagnostics } from "../Language/Compiler/Diagnostics/Diagnostics";
import SourceText from "../Language/Compiler/Syntax/Text/SourceText";
import TextSpan from "../Language/Compiler/Syntax/Text/TextSpan";
import { DataLabelType } from "../Assembler/DataLabelType";
import { IAssemblyParser } from "./IAssemblyParser";
import { AssemblyLine, AssemblyLineKind, AssemblyLineError, AssemblyLineLabel, AssemblyLineInstructionOperand, AssemblyLineInstructionOperandLabel, AssemblyLineSectionLabel, AssemblyLineEntryPoint, AssemblyLineInstruction, AssemblyLineInstructionOperandError, AssemblyLineInstructionOperandUnaryOperator, AssemblyLineInstructionOperandBinaryOperator, AssemblyLineInstructionOperandDereference, AssemblyLineInstructionOperandRegister, AssemblyLineInstructionOperandNumber, AssemblyLineDataLabel } from "./AST/AssemblyAstNodes";

export class AssemblyParserOutput
{
    constructor(public readonly lines : AssemblyLine[], public readonly diagnostics: Diagnostics)
    {
    }
}

export class AssemblyParser implements IAssemblyParser
{    
    private tokens : AssemblyToken[];
    private position : number;
    private readonly diagnostics: Diagnostics;
    private currentLineIndex : number;

    constructor(private lexer : IAssemblyLexer, diagnostics : Diagnostics)
    {        
        this.tokens = [];
        this.position = 0; 
        this.currentLineIndex = 0;
        this.diagnostics = diagnostics;
        this.readAllTokens();   
    }

    private readAllTokens() : void
    {
        while(this.lexer.advance())
            this.tokens.push(this.lexer.current);
    }

    private next() : AssemblyToken
    {
        const current = this.tokens[this.position];
        this.position++;
        return current;
    }

    private current() : AssemblyToken
    {
        return this.tokens[this.position];
    }

    private currentSpan() : TextSpan
    {
        let current = this.current();
        return new TextSpan(current.position, current.length);
    }

    private match(expected : AssemblyTokenKind) : AssemblyToken
    {
        const token = this.tokens[this.position];

        if(token.token == expected)
            return this.next();

        return new AssemblyToken("ERROR", this.position, expected);
    }

    private matchAny(...expectedSet : AssemblyTokenKind[]) : AssemblyToken
    {
        const token = this.tokens[this.position];

        for(let expected of expectedSet)
            if(token.token == expected)
                return this.next();

        return new AssemblyToken("ERROR", this.position, expectedSet[0]);
    }

    private matchOptional(expected : AssemblyTokenKind) : AssemblyToken|null
    {
        if(this.more && this.current().token === expected)
            return this.next();
            
        return null;
    }

    private peek() : AssemblyToken
    {
        return this.tokens[this.position + 1];
    }

    private get more() : boolean
    {
        return this.tokens.length > this.position;
    }

    public parse() : AssemblyParserOutput
    {
        let lines : AssemblyLine[] = [];

        do
        {
            const line = this.parseLine();

            if(!line)
                break;

            if(line.kind === AssemblyLineKind.Error)
                if(!this.resynchronise())
                    break;

            lines.push(line);

        } while(this.more);

        return new AssemblyParserOutput(lines, this.diagnostics);
    }

    private resynchronise() : boolean
    {
        while(this.more)
        {
            switch(this.current().token)
            {
                case AssemblyTokenKind.NEWLINE:
                {
                    this.next();
                    return true;
                }
            }

            this.next();
        }

        return false;
    }

    private parseLine() : AssemblyLine
    {    
        const current = this.current();

        this.currentLineIndex++;

        let line : AssemblyLine;
        switch(current.token)
        {
            case AssemblyTokenKind.IDENTIFIER:
                line = this.parseInstruction();
                break;
            case AssemblyTokenKind.LABEL:
                line = this.parseLabelDeclaration();
                break;
            case AssemblyTokenKind.DATALABEL:
                line = this.parseDataLabelDeclarationOrSectionLabel();
                break;
            default :
            {
                this.diagnostics.reportAssemblyInvalidAtTopLevel(this.current(),  this.currentSpan());
                this.next();
                line = new AssemblyLineError(this.currentLineIndex);
            }
        }

        this.parseEndOfLine();

        return line;
    }

    parseEndOfLine() {        
        if(this.more && this.current().token === AssemblyTokenKind.NEWLINE)
            this.next();
    }

    private parseLabelDeclaration() : AssemblyLine
    {
        const label = this.match(AssemblyTokenKind.LABEL);
        return new AssemblyLineLabel(label, this.currentLineIndex);
    }

    private parseLabel() : AssemblyLineInstructionOperand
    {
        const label = this.match(AssemblyTokenKind.LABEL);
        return new AssemblyLineInstructionOperandLabel(label);
    }

    parseDataLabelDeclarationOrSectionLabel() : AssemblyLine
    {
        const token = this.current();

        switch(token.lexeme)
        {
            case ".data" :
            case ".text" :
                return this.parseSectionLabelDeclaration();
            case ".global" :                
                return this.parseEntryPointDeclaration();
            default:
                return this.parseDataLabelDeclaration();
        }
    }

    parseSectionLabelDeclaration(): AssemblyLine {
        return new AssemblyLineSectionLabel(this.match(AssemblyTokenKind.DATALABEL), this.currentLineIndex);
    }

    parseEntryPointDeclaration(): AssemblyLine {
        const global = this.match(AssemblyTokenKind.DATALABEL);
        const entryPointLabel = this.match(AssemblyTokenKind.LABEL);
        return new AssemblyLineEntryPoint(global, entryPointLabel, this.currentLineIndex);
    }

    private parseDataLabel() : AssemblyLineInstructionOperand
    {
        const label = this.match(AssemblyTokenKind.DATALABEL);
        return new AssemblyLineInstructionOperandLabel(label);
    }

    private parseInstruction() : AssemblyLine
    {
        // MNEMONIC REG REG
        // MNEMONIC REG CONST
        // MNEMONIC REG
        // MNEMONIC CONST
        //generally, reg and const can be of the form
        // [X] // read memory at byte position X, X can be
        // REG, CONST, REG+CONST, REG-CONST but not yet CONST+CONST, CONST-CONST

        const identifier = this.match(AssemblyTokenKind.IDENTIFIER);

        const operands = this.parseOperands();

        return new AssemblyLineInstruction(identifier, operands, this.currentLineIndex);
    }

    private tokenLeftOnLine() : boolean
    {
        if(!this.more)
            return false;

        const token = this.current().token;

        return !(token === AssemblyTokenKind.NEWLINE ||
                 token === AssemblyTokenKind.EOF);
    }

    private parseOperands() : AssemblyLineInstructionOperand[]
    {
        const operands : AssemblyLineInstructionOperand[] = [];

        while(this.tokenLeftOnLine()) 
        {
            const operand = this.parseOperand();
            operands.push(operand);

            this.matchOptional(AssemblyTokenKind.COMMA);
        }

        return operands;
    }

    private parseOperand() : AssemblyLineInstructionOperand
    {
        if(!this.more)
            throw RangeError("Failed to find a value, register or relative address");
    
        const current = this.tokens[this.position];
        switch(current.token)
        {
            case AssemblyTokenKind.MINUS:
            case AssemblyTokenKind.PLUS:
            case AssemblyTokenKind.NUMBER:
            case AssemblyTokenKind.BINNUMBER:
            case AssemblyTokenKind.HEXNUMBER:
            case AssemblyTokenKind.REGISTER:
            case AssemblyTokenKind.LABEL:              
            case AssemblyTokenKind.DATALABEL:                           
                return this.parseOperandOrBinary();
            case AssemblyTokenKind.LEFT_SQUARE_BRACKET:
                return this.parseDereference();
            default:
            {
                this.diagnostics.reportAssemblyInvalidOperand(current, this.currentSpan());
                this.next();
                return new AssemblyLineInstructionOperandError(current);                
            }
        }
    }
    
    private parseOperandOrBinary(parentPrecedence : number = 0, level:number = 0): AssemblyLineInstructionOperand 
    {
        let left : AssemblyLineInstructionOperand;

        const current = this.current();
        const unaryOperatorPrecedence = this.GetUnaryOperatorPrecedence(current.token);

        if(current.token === AssemblyTokenKind.MINUS)
        {
            const operatorToken = this.next();
            const operand = this.parseOperandOrBinary(unaryOperatorPrecedence, level+1);

            left = new AssemblyLineInstructionOperandUnaryOperator(operatorToken, operand);
        }
        else
        {
            left = this.parsePrimary(level);
        }

        while(true)
        {   
            const precedence = this.GetBinaryOperatorPrecedence(this.current().token); 

            if(precedence == 0 || precedence <= parentPrecedence)
                break;

            const operatorToken = this.next();

            switch(operatorToken.token)
            { 
                case AssemblyTokenKind.PLUS:
                case AssemblyTokenKind.MINUS:
                {                    
                    const right = this.parseOperandOrBinary(precedence, level+1);
                    left = new AssemblyLineInstructionOperandBinaryOperator(left, operatorToken, right);
                    break;
                }                
                default:
                    throw new Error("Unexpected operator token type")                
            }
        }

        return left;
    }
    
    private GetBinaryOperatorPrecedence(token: AssemblyTokenKind) : number
    {
        switch(token)
        {
            case AssemblyTokenKind.PLUS:
            case AssemblyTokenKind.MINUS:
                return 1;
        }

        return 0;
    }
    
    private GetUnaryOperatorPrecedence(token: AssemblyTokenKind) : number 
    {
        switch(token)
        {            
            case AssemblyTokenKind.MINUS:
                return 2;
        }

        return 0;
    }

    private parsePrimary(level:number) : AssemblyLineInstructionOperand
    {
        const current = this.current();

        switch(current.token)
        {
            case AssemblyTokenKind.REGISTER:
                return this.parseRegister();
            case AssemblyTokenKind.HEXNUMBER:
            case AssemblyTokenKind.BINNUMBER:
            case AssemblyTokenKind.NUMBER:
            case AssemblyTokenKind.FLOAT_NUMBER:
                return this.parseNumber();
            case AssemblyTokenKind.LABEL:
                return this.parseLabel();
            case AssemblyTokenKind.DATALABEL:
                return this.parseDataLabel();  
            case AssemblyTokenKind.LEFT_SQUARE_BRACKET:
            {
                const dereference = this.parseDereference();
                
                this.diagnostics.reportAssemblyInvalidNestedDereference(current, dereference.span());
                return new AssemblyLineInstructionOperandError(current, dereference);
            }
            default:
            {
                this.diagnostics.reportAssemblyInvalidOperand(current, this.currentSpan());
                return new AssemblyLineInstructionOperandError(current);
            }
        }
    }

    private parseDereference(): AssemblyLineInstructionOperandDereference 
    {
        const leftBracket = this.match(AssemblyTokenKind.LEFT_SQUARE_BRACKET);
        const internal = this.parseOperandOrBinary();        
        const rightBracket = this.match(AssemblyTokenKind.RIGHT_SQUARE_BRACKET);

        return new AssemblyLineInstructionOperandDereference(leftBracket, internal, rightBracket);
    }
    
    private parseRegister() : AssemblyLineInstructionOperand
    {
        const token = this.next();
        const register = this.parseRegisterName(token.lexeme);
        return new AssemblyLineInstructionOperandRegister(token, register);
    }

    private parseRegisterName(registerName : string) : number
    {
        if(!registerName || registerName.length == 0)
            return 0;

        const firstChar = registerName[0];
        const secondChar = registerName.slice(1);

        if((firstChar === "R" || firstChar === "r" ) && this.isNumeric(secondChar))        
            return parseInt(secondChar); 
        
        if(registerName.toUpperCase() === "SP")
            return 7;

        return 0;
    }

    private isNumeric(value:string):boolean
    {
        for(let i = 0; i < value.length; i++)
        {
            const char = value.charCodeAt(i); 
            
            if(char < '0'.charCodeAt(0) || char > '9'.charCodeAt(0))
                return false;
        }

        return true;
    }

    private parseNumber() : AssemblyLineInstructionOperand
    {
        const token = this.next(); 
        return new AssemblyLineInstructionOperandNumber(token, token.value);
    }

    private parseDataLabelDeclaration() : AssemblyLine
    {
        const label = this.match(AssemblyTokenKind.DATALABEL);

        switch(this.current().token)
        {
            case AssemblyTokenKind.IDENTIFIER:
            {
                const type = this.match(AssemblyTokenKind.IDENTIFIER);             
                const value = this.matchAny(AssemblyTokenKind.NUMBER, AssemblyTokenKind.BINNUMBER, AssemblyTokenKind.HEXNUMBER, AssemblyTokenKind.FLOAT_NUMBER);
    
                let dataType : DataLabelType;
                switch(type.lexeme.toLowerCase())
                {
                    case "size":
                        dataType = DataLabelType.Buffer;
                        break;
                    case "byte": 
                        dataType = DataLabelType.Byte;
                        break;
                    case "word": 
                        dataType = DataLabelType.Int16;
                        break;
                    case "long": 
                        dataType = DataLabelType.Int32;
                        break;
                    case "float": 
                        dataType = DataLabelType.Float;
                        break;
                    default :
                        throw RangeError("Unknown type");                                    
                }
                
                return new AssemblyLineDataLabel(label, type, dataType, value, this.currentLineIndex);
            }
            case AssemblyTokenKind.STRING:
            {
                const value = this.match(AssemblyTokenKind.STRING);
                return new AssemblyLineDataLabel(label, null, DataLabelType.String, value, this.currentLineIndex);
            }      
            default:
            {
                this.diagnostics.reportAssemblyUnexpectedToken(this.current());
                return new AssemblyLineError(this.currentLineIndex);
            }
        }
    }
}
