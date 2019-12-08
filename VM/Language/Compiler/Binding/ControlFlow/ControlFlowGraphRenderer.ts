import { TextWriter } from "../../../../misc/TextWriter";
import ControlFlowGraph from "./ControlFlowGraph";

export default class ControlFlowGraphRenderer
{
    constructor(private readonly cfg : ControlFlowGraph)
    {
    }

    public WriteTo(writer : TextWriter) : void
    {
        function Quote(text : string) : string
        {
            return "\"" + text.replace("\"", "\\\"") + "\"";
        }

        function ReplaceNewLines(text : string) : string
        {
            return text.replace(/\r\n/g, "\\l");
        }

        writer.WriteLine("digraph G {");

        const blockIdsToNodeStrings : { [index:number] : string } = {};

        for (let i = 0; i < this.cfg.blocks.length; i++)
        {
            const id = `N${i}`;
            blockIdsToNodeStrings[this.cfg.blocks[i].id] = id;            
        }

        for(let block of this.cfg.blocks)
        {
            const id = blockIdsToNodeStrings[block.id];
            const label = Quote(ReplaceNewLines(block.toString()));
            writer.WriteLine(`    ${id} [label = ${label} shape = box]`);
        }

        for(let branch of this.cfg.branches)
        {
            const fromId = blockIdsToNodeStrings[branch.from.id];
            const toId = blockIdsToNodeStrings[branch.to.id];
            const labelText = ReplaceNewLines(branch.toString());
            const quotedText = Quote(labelText);
            const label = (labelText.length > 0) ? 
                            `[label = ${quotedText}]` : 
                            "";

            writer.WriteLine(`    ${fromId} -> ${toId} ${label}`);
        }

        writer.WriteLine("}");
    }
}