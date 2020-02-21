import { AssemblyLineLexer, Token, OperandToken } from "./AssemblyLineLexer";
import Instruction, { OpcodeModes, OpcodeMode } from "../VirtualMachine/CPU/Instruction/Instruction";
import { InstructionMap } from "../VirtualMachine/CPU/Instruction/InstructionSet";
import ValueOrRegister from "./ValueOrRegister";

export class AssemblyLineParser
{
    private lexer : AssemblyLineLexer;
    private tokens : Token[];
    private position : number;
    private labelsExpected : boolean;

    constructor(lexer : AssemblyLineLexer, labelsExpected:boolean = false) 
    {
        this.lexer = lexer;
        this.tokens = [];
        this.position = 0;
        this.labelsExpected = labelsExpected;

        while(this.lexer.advance())
            this.tokens.push(this.lexer.current);
    }

    private next() : Token
    {
        const current = this.tokens[this.position];
        this.position++;
        return current;
    }

    private match(expected : OperandToken) : Token
    {
        if(this.current.token == expected)
            return this.next();

        throw RangeError("Expected token " + expected + " and found " + this.current.token + " at " + this.current.position);
    }

    private peek() : Token
    {
        return this.tokens[this.position + 1];
    }

    private get current() : Token
    {
        return this.tokens[this.position];
    }

    public Parse() : Instruction
    {
        // MNEMONIC REG REG
        // MNEMONIC REG CONST
        // MNEMONIC REG
        // MNEMONIC CONST

        const identifier = this.match(OperandToken.IDENTIFIER);

        const instruction = InstructionMap[identifier.lexeme.toUpperCase()];

        if(!instruction)
        {
            throw RangeError("Invalid instruction " + identifier.lexeme.toUpperCase());
        }

        if(instruction.operandCount == 0)
        {
            return new Instruction(instruction.opcode, OpcodeModes.Default, 0, 0, 0, 0);
        }

        if(instruction.operandCount == 1)
        {
            const operand = this.parseOperand();
            
            const mode = new OpcodeMode(operand.isPointer, !!operand.register);
            const modes = new OpcodeModes(mode, OpcodeMode.Default);

            return new Instruction(instruction.opcode, 
                                   modes,                                                                   
                                   0, 
                                   this.parseRegisterName(operand.register),
                                   0, operand.value || 0);
        }
        else if(instruction.operandCount == 2)
        {
            const op1 = this.parseOperand();
            const op2 = this.parseOperand();

            let modes = new OpcodeModes(
                new OpcodeMode(op2.isPointer, !!op2.register),
                new OpcodeMode(op1.isPointer, !!op1.register)
            );
            
            return new Instruction(instruction.opcode, 
                modes,
                this.parseRegisterName(op2.register), 
                this.parseRegisterName(op1.register),
                op1.value || 0, 
                op2.value || 0);
        }
        else
            throw RangeError("Invalid operand count");
    }

    parseOperand() : ValueOrRegister
    {
        if(!this.current)
            throw RangeError("Failed to find a value, register or relative address");
        
        switch(this.current.token)
        {
            case OperandToken.LEFT_SQUARE_BRACKET:
                return this.parseRelative();
            case OperandToken.REGISTER:
                return this.parseRegister();
            case OperandToken.NUMBER:
                return this.parseNumber();
            case OperandToken.LABEL:
                return this.parseLabel();                
            case OperandToken.DATALABEL:
                return this.parseDataLabel();    
            case OperandToken.MINUS:
                if(this.peek().token === OperandToken.NUMBER)
                {
                    this.next();
                    return this.parseNegativeNumber();    
                }
        }
        
        throw RangeError("Failed to find a value, register or relative address");    
    }

    parseRelative() : ValueOrRegister
    {
        this.match(OperandToken.LEFT_SQUARE_BRACKET);    

        let result : ValueOrRegister;
        
        switch(this.current.token)
        {
            case OperandToken.REGISTER:
            {
                const register = this.parseRegister();
                const relative = this.parseRelativeToRegister(register.register!);                       
                result = new ValueOrRegister(register.register, true, relative.value);
                break;
            }
            case OperandToken.NUMBER:
            {
                const number = this.parseNumber();
                result = new ValueOrRegister(undefined, true, number.value);
                break;
            }
            case OperandToken.LABEL:
            {
                result = this.parseLabel();  
                break;              
            }
            case OperandToken.DATALABEL:
            {
                result = this.parseDataLabel();             
                break;
            }
            default:
            {
                throw RangeError("Unexpected relative operand token " + this.current.lexeme + " at " + this.current.position);
            }    
        }    

        this.match(OperandToken.RIGHT_SQUARE_BRACKET);

        return result;
    }

    parseRelativeToRegister(register:string): ValueOrRegister {
        switch(this.current.token)
        {
            case OperandToken.RIGHT_SQUARE_BRACKET:
            {
                return new ValueOrRegister(register, true);
            }
            case OperandToken.MINUS:
            {
                this.match(OperandToken.MINUS);
                const value = this.match(OperandToken.NUMBER);
                return new ValueOrRegister(register, true, -value.value);            
            }    
            case OperandToken.PLUS:
            {
                this.match(OperandToken.PLUS);
                const value = this.match(OperandToken.NUMBER);
                return new ValueOrRegister(register, true, value.value);
            }     
            default:
            {
                throw RangeError("Unexpected relative operand token " + this.current.lexeme + " at " + this.current.position);
            }       
        }            
    }

    parseRegister() : ValueOrRegister
    {
        const token = this.next();
        return new ValueOrRegister(token.lexeme);
    }

    parseNumber() : ValueOrRegister
    {
        const token = this.next();
        return new ValueOrRegister(undefined, false, token.value);
    }

    parseNegativeNumber() : ValueOrRegister
    {
        const num = this.parseNumber();
        return new ValueOrRegister(undefined, false, -num.value!);
    }

    parseLabel() : ValueOrRegister
    {
        if(!this.labelsExpected)
            throw RangeError("Unexpected unresolved Label token " + this.current.lexeme + " at " + this.current.position);

        this.next();
        // labels are not expected to produce final values
        return new ValueOrRegister(undefined, false, 0);
    }

    parseDataLabel() : ValueOrRegister
    {
        if(!this.labelsExpected)
            throw RangeError("Unexpected unresolved Data Label token " + this.current.lexeme + " at " + this.current.position);

        this.next();
        // labels are not expected to produce final values
        return new ValueOrRegister(undefined, false, 0);
    }

    parseRegisterName(registerName : string|undefined) : number
    {
        if(!registerName || registerName.length == 0)
            return 0;

        if(registerName[0].toUpperCase() === "R" && this.isNumeric(registerName.slice(1)))        
            return parseInt(registerName.slice(1)); 
        
        if(registerName == "SP")
            return 7;

        return 0;
    }

    isNumeric(value:string):boolean
    {
        for(let i = 0; i < value.length; i++)
        {
            const char = value.charCodeAt(i); 
            
            if(char < '0'.charCodeAt(0) || char > '9'.charCodeAt(0))
                return false;
        }

        return true;
    }
}