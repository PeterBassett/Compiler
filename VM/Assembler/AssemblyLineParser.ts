import { AssemblyLineLexer, Token, OperandToken } from "./AssemblyLineLexer";
import Instruction, { OpcodeModes, OpcodeMode } from "../VirtualMachine/CPU/Instruction/Instruction";
import { InstructionMap } from "../VirtualMachine/CPU/Instruction/InstructionSet";
import ValueOrRegister from "./ValueOrRegister";

export class AssemblyLineParser
{
    private lexer : AssemblyLineLexer;
    private tokens : Token[];

    constructor(lexer : AssemblyLineLexer) 
    {
        this.lexer = lexer;
        this.tokens = [];
    }

    private ConsumeAny() : Token
    {
        // Make sure we've read the token.
        const token = this.LookAhead();

        this.tokens.slice(1);

        return token;
    }

    public Consume(expected : OperandToken) : void
    {        
        const token = this.LookAhead();
        if (token.token != expected)
            throw RangeError("Expected token " + expected + " and found " + token.token + " at " + token.position);

        this.ConsumeAny();
    }

    public ConsumeOptional(expected : OperandToken) : boolean
    {
        const token = this.LookAhead();

        if (token.token == expected)
        {
            this.ConsumeAny();
            return true;
        }

        return false;
    }

    private LookAhead(distance : number = 0) : Token
    {
        // Read in as many as needed.
        while (distance >= this.tokens.length)
        {
            const tokenFound = this.lexer.advance();

            if(tokenFound)
                this.tokens.push(this.lexer.current);
        }

        // Get the queued token.
        return this.tokens[distance];
    }

    private Peek() : Token
    {
        this.LookAhead();
        return this.tokens[0];
    }

    private get current() : Token
    {
        return this.tokens[0];
    }

    public Parse() : Instruction
    {
        // MNEMONIC REG REG
        // MNEMONIC REG CONST
        // MNEMONIC REG
        // MNEMONIC CONST

        this.Consume(OperandToken.IDENTIFIER);
        const mnemonic = this.current;

        const instruction = InstructionMap[mnemonic.lexeme.toUpperCase()];

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
        const ok = this.lexer.advance();
        
        if(!this.lexer.current || !ok)
            throw RangeError("Failed to find a value, register or relative address");

        while(this.lexer.current.token == OperandToken.WHITESPACE)
            this.lexer.advance();
        
        switch(this.lexer.current.token)
        {
            case OperandToken.LEFT_SQUARE_BRACKET:
                return this.parseRelative();
            case OperandToken.REGISTER:
                return this.parseRegister();
            case OperandToken.NUMBER:
                return this.parseNumber();
        }
        
        throw RangeError("Failed to find a value, register or relative address");    
    }

    parseRelative() : ValueOrRegister
    {
        const skipWhitepace = () => {
            if(this.lexer.current.token == OperandToken.WHITESPACE)        
                this.lexer.advance();
        };

        const ensure = (expected:OperandToken) : void => {        
            if(!this.lexer.current || this.lexer.current.token != expected)
                throw RangeError("Failed to find a expected token");
        };

        const consume = (expected:OperandToken) : void => {        
            this.lexer.advance();
            
            if(!this.lexer.current || this.lexer.current.token != expected)
                throw RangeError("Failed to find a expected token");        
        };

        ensure(OperandToken.LEFT_SQUARE_BRACKET);    
        this.lexer.advance();
        skipWhitepace();
        ensure(OperandToken.REGISTER);

        const register = this.lexer.current;

        this.lexer.advance();
        skipWhitepace();
        
        switch(this.lexer.current.token)
        {
            case OperandToken.RIGHT_SQUARE_BRACKET:
                return new ValueOrRegister(register.lexeme, true, 0);
            case OperandToken.MINUS:
            {
                skipWhitepace();
                ensure(OperandToken.MINUS);
                this.lexer.advance();
                const value = new ValueOrRegister(register.lexeme, true, -this.lexer.current.value);            

                this.lexer.advance();
                ensure(OperandToken.RIGHT_SQUARE_BRACKET);
                return value;                
            }    
            case OperandToken.PLUS:
            {
                skipWhitepace();
                ensure(OperandToken.PLUS);
                this.lexer.advance();
                const value = new ValueOrRegister(register.lexeme, true, this.lexer.current.value);

                this.lexer.advance();
                ensure(OperandToken.RIGHT_SQUARE_BRACKET);
                return value;                
            }
            case OperandToken.NUMBER:
                return this.parseNumber();
        }    

        return new ValueOrRegister(this.lexer.current.lexeme, true);
    }

    parseRegister() : ValueOrRegister
    {
        return new ValueOrRegister(this.lexer.current.lexeme);
    }

    parseNumber() : ValueOrRegister
    {
        return new ValueOrRegister(undefined, false, this.lexer.current.value);
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