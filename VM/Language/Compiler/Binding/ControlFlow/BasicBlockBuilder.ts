import { BoundStatement, BoundNodeKind, BoundBlockStatement } from "../BoundNode";
import { BasicBlock } from "./BasicBlock";

export class BasicBlockBuilder 
{
    constructor() {
        this._statements = [];
        this._blocks = [];
    }

    private _statements: BoundStatement[];
    public get statements(): BoundStatement[] {
        return this.statements;
    }

    private _blocks: BasicBlock[];
    public get blocks(): BasicBlock[] {
        return this._blocks;
    }

    public Build(block: BoundBlockStatement): BasicBlock[] 
    {
        for (let statement of block.statements) 
        {
            switch (statement.kind) 
            {
                case BoundNodeKind.LabelStatement:
                    this.StartBlock();
                    this._statements.push(statement);
                    break;
                case BoundNodeKind.GotoStatement:
                case BoundNodeKind.ConditionalGotoStatement:
                case BoundNodeKind.ReturnStatement:
                    this._statements.push(statement);
                    this.StartBlock();
                    break;
                case BoundNodeKind.VariableDeclaration:
                case BoundNodeKind.ExpressionStatement:
                case BoundNodeKind.AssignmentStatement:
                case BoundNodeKind.SetStatement:
                case BoundNodeKind.DereferenceAssignmentStatement:
                    this._statements.push(statement);
                    break;
                default:
                    throw new Error(`Unexpected statement: ${statement.kind}`);
            }
        }

        this.EndBlock();
        return this._blocks;
    }

    private StartBlock() 
    {
        this.EndBlock();
    }

    private EndBlock() 
    {
        if (this._statements.length > 0) 
        {
            const block = new BasicBlock();
            block.statements = [...this._statements];
            this._blocks.push(block);
            this._statements = [];
        }
    }
}
