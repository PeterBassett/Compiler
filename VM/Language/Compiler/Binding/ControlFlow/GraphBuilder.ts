import { BoundExpression, BoundNodeKind, BoundLabelStatement, BoundGotoStatement, BoundLiteralExpression, BoundUnaryOperator, BoundUnaryExpression, BoundConditionalGotoStatement } from "../BoundNode";
import { PredefinedValueTypes } from "../../../Types/PredefinedValueTypes";
import { SyntaxType } from "../../Syntax/SyntaxType";
import { BasicBlock } from "./BasicBlock";
import { BasicBlockBranch } from "./BasicBlockBranch";
import ControlFlowGraph from "./ControlFlowGraph";

export class GraphBuilder 
{
    private _blockFromStatement: { [index: number]: BasicBlock; } = {};
    private _blockFromLabel: { [index: string]: BasicBlock; } = {};
    private _branches: BasicBlockBranch[] = [];
    private _start: BasicBlock = new BasicBlock(true);
    private _end: BasicBlock = new BasicBlock(false);

    public Build(blocks: BasicBlock[]): ControlFlowGraph {

        if (blocks.length == 0)
            this.Connect(this._start, this._end);
        else
            this.Connect(this._start, blocks[0]);

        for (let block of blocks) 
        {
            for (let statement of block.statements) 
            {
                this._blockFromStatement[statement.id] = block;

                if (statement.kind == BoundNodeKind.LabelStatement) 
                {
                    const labelStatement = statement as BoundLabelStatement;
                    this._blockFromLabel[labelStatement.label.id] = block;
                }
            }
        }

        for (let i = 0; i < blocks.length; i++) 
        {
            const current = blocks[i];
            const next = i == blocks.length - 1 ? this._end : blocks[i + 1];
            const lastStatementInBlock = current.statements.length > 0 ?
                current.statements[current.statements.length - 1] :
                null;

            for (let statement of current.statements) 
            {
                const isLastStatementInBlock = statement == lastStatementInBlock;

                switch (statement.kind) 
                {
                    case BoundNodeKind.GotoStatement:
                        const gs = statement as BoundGotoStatement;
                        const toBlock = this._blockFromLabel[gs.label.id];
                        this.Connect(current, toBlock);
                        break;
                    case BoundNodeKind.ConditionalGotoStatement:
                        const cgs = statement as BoundConditionalGotoStatement;
                        const thenBlock = this._blockFromLabel[cgs.label.id];
                        const elseBlock = next;
                        const negatedCondition = this.Negate(cgs.condition);
                        const thenCondition = cgs.jumpIfTrue ? cgs.condition : negatedCondition;
                        const elseCondition = cgs.jumpIfTrue ? negatedCondition : cgs.condition;
                        this.Connect(current, thenBlock, thenCondition);
                        this.Connect(current, elseBlock, elseCondition);
                        break;
                    case BoundNodeKind.ReturnStatement:
                        this.Connect(current, this._end);
                        break;
                    case BoundNodeKind.VariableDeclaration:
                    case BoundNodeKind.LabelStatement:
                    case BoundNodeKind.ExpressionStatement:
                        if (isLastStatementInBlock)
                            this.Connect(current, next);
                        break;
                    default:
                        throw new Error(`Unexpected statement: ${statement.kind}`);
                }
            }
        }

        let found = false;
        do {
            found = false;
            for (let block of blocks) 
            {
                if (block.incoming.length == 0) 
                {
                    this.RemoveBlock(blocks, block);
                    found = true;
                    break;
                }
            }
        } while (found);

        blocks = [this._start, ...blocks];
        blocks.push(this._end);
        
        return new ControlFlowGraph(this._start, this._end, blocks, this._branches);
    }

    private Connect(from: BasicBlock, to: BasicBlock, cond?: BoundExpression) 
    {
        let condition: BoundExpression | null = null;
    
        if (!!cond)
            condition = cond;
    
        if (cond && cond.kind == BoundNodeKind.LiteralExpression) 
        {
            condition = cond;
            const l = cond as BoundLiteralExpression;
            const value = l.value;
            if (value)
                condition = null;
            else
                return;
        }

        const branch = new BasicBlockBranch(from, to, condition);
        from.outgoing.push(branch);
        to.incoming.push(branch);
        this._branches.push(branch);
    }

    private RemoveBlock(blocks: BasicBlock[], block: BasicBlock): BasicBlock[] 
    {
        function remove<T>(array: T[], item: T): T[] 
        {
            const index = array.indexOf(item);
            if (index !== -1)
                array.splice(index, 1);
            return array;
        }

        for (let branch of block.incoming) 
        {
            remove(branch.from.outgoing, branch);
            remove(this._branches, branch);
        }

        for (let branch of block.outgoing) 
        {
            remove(branch.to.incoming, branch);
            remove(this._branches, branch);
        }

        remove(blocks, block);
        return blocks;
    }

    private Negate(condition: BoundExpression): BoundExpression 
    {
        if (condition.kind == BoundNodeKind.LiteralExpression) 
        {
            let literal = condition as BoundLiteralExpression;
            const value = literal.value;
            return new BoundLiteralExpression(!value, PredefinedValueTypes.Boolean);
        }
        
        const op = BoundUnaryOperator.Bind(SyntaxType.Bang, PredefinedValueTypes.Boolean);
        return new BoundUnaryExpression(op!, condition);
    }
}
