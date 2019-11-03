import { AssemblyLineLexer, Token, OperandToken } from "./AssemblyLineLexer";
import Instruction from "../VirtualMachine/CPU/Instruction/Instruction";
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
        var token = this.LookAhead();

        this.tokens.slice(1);

        return token;
    }

    public Consume(expected : OperandToken) : void
    {        
        var token = this.LookAhead();
        if (token.token != expected)
            throw RangeError("Expected token " + expected + " and found " + token.token + " at " + token.position);

        this.ConsumeAny();
    }

    public ConsumeOptional(expected : OperandToken) : boolean
    {
        var token = this.LookAhead();

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
            var tokenFound = this.lexer.advance();

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
        var mnemonic = this.current;

        var instruction = InstructionMap[mnemonic.lexeme.toUpperCase()];

        if(instruction.operandCount == 0)
        {
            return new Instruction(instruction.opcode, 0, 0, 0, 0);
        }

        if(instruction.operandCount == 1)
        {
            let operand = this.parseOperand();
            
            let code = operandCode(operand, 0);

            return new Instruction(instruction.opcode, 
                                   code,                                                                   
                                   0, 
                                   this.parseRegisterName(operand.register),
                                   operand.value || 0);
        }
        else if(instruction.operandCount == 2)
        {
            var op1 = this.parseOperand();
            var op2 = this.parseOperand();

            var code = 0;
            code |= operandCode(op2, 0);
            code |= operandCode(op1, 1);
           
            var operandValue = encodeInstructionOperand(op1.value, op2.value, op1.isPointer && op2.isPointer);

            return new Instruction(instruction.opcode, 
                code,
                this.parseRegisterName(op2.register), 
                this.parseRegisterName(op1.register),
                operandValue);
        }
        else
            throw RangeError("Invalid operand count");
    }

    parseOperand() : ValueOrRegister
    {
        var ok = this.lexer.advance();
        
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
        let skipWhitepace = () => {
            if(this.lexer.current.token == OperandToken.WHITESPACE)        
                this.lexer.advance();
        };

        let ensure = (expected:OperandToken) : void => {        
            if(!this.lexer.current || this.lexer.current.token != expected)
                throw RangeError("Failed to find a expected token");
        };

        let consume = (expected:OperandToken) : void => {        
            this.lexer.advance();
            
            if(!this.lexer.current || this.lexer.current.token != expected)
                throw RangeError("Failed to find a expected token");        
        };

        ensure(OperandToken.LEFT_SQUARE_BRACKET);    
        this.lexer.advance();
        skipWhitepace();
        ensure(OperandToken.REGISTER);

        var register = this.lexer.current;

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
                let value = new ValueOrRegister(register.lexeme, true, -this.lexer.current.value);            

                this.lexer.advance();
                ensure(OperandToken.RIGHT_SQUARE_BRACKET);
                return value;                
            }    
            case OperandToken.PLUS:
            {
                skipWhitepace();
                ensure(OperandToken.PLUS);
                this.lexer.advance();
                let value = new ValueOrRegister(register.lexeme, true, this.lexer.current.value);

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

export function encodeInstructionOperand(destinationRegisterOffset : number | undefined, sourceRegisterOffset : number | undefined, isTwoOffsets : boolean) : number
{
    destinationRegisterOffset = destinationRegisterOffset || 0;
    sourceRegisterOffset = sourceRegisterOffset || 0;

    if(destinationRegisterOffset < 0)
        destinationRegisterOffset = Math.abs(destinationRegisterOffset) | 128;

    if(sourceRegisterOffset < 0)
        sourceRegisterOffset = Math.abs(sourceRegisterOffset) | 128;

    var value = sourceRegisterOffset | destinationRegisterOffset << 8;
    return value;
}

export function decodeInstructionOperand(value : number, isTwoOffsets : boolean) : {op1Offset8? : number, op2Offset8? : number}
{
    let offset1 = value >> 8;
    let offset2 = value & 255;

    if(offset1 & 128)
        offset1 = -(offset1 & 127);

    if(offset2 & 128)
        offset2 = -(offset2 & 127);

    return {op1Offset8 : offset1, op2Offset8 : offset2};
}

function operandCode(value : ValueOrRegister, scale : number) : number
{
    return opCodeMode(value.isPointer, !!value.register, scale);
}

export function opCodeMode(isPointer : boolean, isRegister : boolean, scale : number) : number
{
    var code = 0;

    if(isPointer)
        code |= 1;    
    if(isRegister)
        code |= 4;
    
    code = code << scale;
    
    return code;
}