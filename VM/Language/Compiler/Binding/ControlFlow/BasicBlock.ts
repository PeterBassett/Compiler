import { BoundStatement } from "../BoundNode";
import { StringWriter } from "../../../../misc/StringWriter";
import { BoundNodePrinter } from "../BoundNodePrinter";
import { BasicBlockBranch } from "./BasicBlockBranch";

export class BasicBlock 
{
    private static MaxBlockId: number = 0;
    public readonly id: number = BasicBlock.MaxBlockId++;

    constructor(start?: boolean) 
    {
        if (typeof (start) != 'undefined') 
        {
            this.start = start;
            this.end = !start;
        }
        else 
        {
            this.start = false;
            this.end = false;
        }
        
        this.statements = [];
        this.incoming = [];
        this.outgoing = [];
    }

    public start: boolean;
    public end: boolean;
    public statements: BoundStatement[];
    public incoming: BasicBlockBranch[];
    public outgoing: BasicBlockBranch[];

    toString(): string 
    {
        if (this.start)
            return "<Start>";
        
        if (this.end)
            return "<End>";
        
        const writer = new StringWriter();

        for (let statement of this.statements)
            BoundNodePrinter.WriteTo(statement, writer);

        return writer.toString();
    }
}