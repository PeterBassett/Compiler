import { BoundExpression } from "../BoundNode";
import { StringWriter } from "../../../../misc/StringWriter";
import { BoundNodePrinter } from "../BoundNodePrinter";
import { BasicBlock } from "./BasicBlock";

export class BasicBlockBranch 
{
    constructor(
        public readonly from: BasicBlock, 
        public readonly to: BasicBlock, 
        public readonly condition: BoundExpression | null) 
    {
    }

    public toString(): string 
    {
        if (this.condition == null)
            return "";
            
        const writer = new StringWriter();
        BoundNodePrinter.WriteTo(this.condition, writer);
        return writer.toString();
    }
}
