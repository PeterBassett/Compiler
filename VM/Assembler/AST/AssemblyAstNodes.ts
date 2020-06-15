import { AssemblyToken } from "../AssemblyToken";
import { DataLabelType } from "../DataLabelType";
import TextSpan from "../../Language/Compiler/Syntax/Text/TextSpan";

export enum AssemblyLineKind {
    Error,
    SectionLabel,
    Label,
    DataLabel,
    Instruction,
    EntryPoint
}

export enum AssemblyLineOperandKind {
    Error,
    Register,
    Number,
    DataLabel,
    Label,
    Dereference,
    UnaryOperator,
    BinaryOperator
}

export abstract class AssemblyLine
{
    lineIndex : number;
    abstract readonly kind : AssemblyLineKind;

    constructor(line : number)
    {
        this.lineIndex = line;
    }
}

export class AssemblyLineError extends AssemblyLine
{
    public readonly kind: AssemblyLineKind = AssemblyLineKind.Error;

    constructor(line : number)
    {
        super(line);
    }
}

export class AssemblyLineSectionLabel extends AssemblyLine
{
    public readonly kind: AssemblyLineKind = AssemblyLineKind.SectionLabel;

    constructor(public readonly labelText : AssemblyToken, line : number)
    {
        super(line);
    }
}

export class AssemblyLineEntryPoint extends AssemblyLine
{
    public readonly kind: AssemblyLineKind = AssemblyLineKind.EntryPoint;

    constructor(public readonly globalText : AssemblyToken, public readonly entryPointText : AssemblyToken, line : number)
    {
        super(line);
    }
}

export class AssemblyLineLabel extends AssemblyLine
{
    public readonly kind: AssemblyLineKind = AssemblyLineKind.Label;

    constructor(public readonly labelText : AssemblyToken, line : number)
    {
        super(line);
    }
}

export class AssemblyLineDataLabel extends AssemblyLine
{
    public readonly kind: AssemblyLineKind = AssemblyLineKind.DataLabel;

    constructor(public readonly labelText : AssemblyToken,
                public readonly type : AssemblyToken|null,
                public readonly dataType : DataLabelType,
                public readonly initialValue : AssemblyToken,
                line : number)
    {
        super(line);
    }
}

export abstract class AssemblyLineInstructionOperand
{
    abstract readonly kind : AssemblyLineOperandKind;
    protected abstract getSpans() : TextSpan[];

    private _span : TextSpan|null = null;
    public span() : TextSpan
    {
        if(this._span)
            return this._span;

        this._span = this.combineSpans(this.getSpans());

        return this._span;
    }

    protected combineSpans(spans:TextSpan[]) : TextSpan
    {
        const minStart = Math.min(...spans.map(s => s.start));
        const maxEnd = Math.max(...spans.map(s => s.end));
    
        return new TextSpan(minStart, maxEnd - minStart);
    }
}

export class AssemblyLineInstructionOperandError extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.Error;

    constructor(public readonly name : AssemblyToken, public contained?:AssemblyLineInstructionOperand)
    {
        super();
    }

    protected getSpans(): TextSpan[] 
    {
        let spans = [];
        spans.push(new TextSpan(this.name.position, this.name.length));

        if(!!this.contained)
            spans.push(this.contained.span());
        
        return spans;
    }
}


export class AssemblyLineInstructionOperandLabel extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.Label;

    constructor(public readonly name : AssemblyToken)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [new TextSpan(this.name.position, this.name.length)];
    } 
}

export class AssemblyLineInstructionOperandDataLabel extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.DataLabel;

    constructor(public readonly name : AssemblyToken)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [new TextSpan(this.name.position, this.name.length)];
    } 
}

export class AssemblyLineInstructionOperandRegister extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.Register;

    constructor(public readonly name : AssemblyToken, public readonly registerIndex : number)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [new TextSpan(this.name.position, this.name.length)];
    } 
}

export class AssemblyLineInstructionOperandNumber extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.Number;
    constructor(public readonly valueToken : AssemblyToken, public readonly value : number)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [new TextSpan(this.valueToken.position, this.valueToken.length)];
    } 
}

export class AssemblyLineInstructionOperandDereference extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.Dereference;

    constructor(public readonly leftBracket : AssemblyToken, 
                public readonly operand : AssemblyLineInstructionOperand,
                public readonly rightBracket : AssemblyToken)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [
            new TextSpan(this.leftBracket.position, this.leftBracket.length),
            this.operand.span(),
            new TextSpan(this.rightBracket.position, this.rightBracket.length),
        ]
    }
}


export class AssemblyLineInstructionOperandUnaryOperator extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.UnaryOperator;

    constructor(public readonly operatorToken : AssemblyToken,
                public readonly right : AssemblyLineInstructionOperand)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [
            new TextSpan(this.operatorToken.position, this.operatorToken.length),
            this.right.span()
        ]
    }
}

export class AssemblyLineInstructionOperandBinaryOperator extends AssemblyLineInstructionOperand
{
    public readonly kind: AssemblyLineOperandKind = AssemblyLineOperandKind.BinaryOperator;

    constructor(public readonly left : AssemblyLineInstructionOperand,
                public readonly operatorToken : AssemblyToken,
                public readonly right : AssemblyLineInstructionOperand)
    {
        super();
    }

    protected getSpans(): TextSpan[] {
        return [
            this.left.span(),
            new TextSpan(this.operatorToken.position, this.operatorToken.length),
            this.right.span()
        ]
    }
}

export class AssemblyLineInstruction extends AssemblyLine
{
    public readonly kind: AssemblyLineKind = AssemblyLineKind.Instruction;

    constructor(public readonly mnemonic : AssemblyToken,
                public readonly operands : AssemblyLineInstructionOperand[],
                line : number)
    {
        super(line);
    }

    protected getSpans(): TextSpan[] {
        return [            
            new TextSpan(this.mnemonic.position, this.mnemonic.length),
            ...this.operands.map( o => o.span() )
        ]
    }
}