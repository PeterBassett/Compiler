import { 
    BoundNodeKind, 
    BoundBlockStatement
} from "../BoundNode";
import { TextWriter } from "../../../../misc/TextWriter";
import { BasicBlock } from "./BasicBlock";
import { BasicBlockBranch } from "./BasicBlockBranch";
import { BasicBlockBuilder } from "./BasicBlockBuilder";
import { GraphBuilder } from "./GraphBuilder";

export default class ControlFlowGraph
{
    constructor(
        public readonly start : BasicBlock,
        public readonly end : BasicBlock,
        public readonly blocks : BasicBlock[],
        public readonly branches : BasicBlockBranch[])
    {
    }

    public static Create(body: BoundBlockStatement) : ControlFlowGraph 
    {
        const basicBlockBuilder = new BasicBlockBuilder();
        const blocks = basicBlockBuilder.Build(body);

        const graphBuilder = new GraphBuilder();
        return graphBuilder.Build(blocks);
    }

    public static AllPathsReturn(body: BoundBlockStatement) : boolean
    {
        const graph = this.Create(body);

        for(let branch of graph.end.incoming)
        {
            if(branch.from.start)
                return false;

            if(branch.from.statements.length === 0)
                continue;

            const lastStatement = branch.from.statements[branch.from.statements.length - 1];

            if (lastStatement.kind != BoundNodeKind.ReturnStatement)
                return false;
        }

        return true;
    }
}