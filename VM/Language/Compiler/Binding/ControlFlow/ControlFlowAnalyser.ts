import { BoundGlobalScope } from "../BoundNode";
import ControlFlowGraph from "./ControlFlowGraph";
import { PredefinedValueTypes } from "../../../Types/PredefinedValueTypes";

export default class ControlFlowAnalyser 
{
    constructor(private readonly scope : BoundGlobalScope)
    {
    }

    public analyse() : BoundGlobalScope
    {
        for(let func of this.scope.functions)
        {
            const allPathsReturn = ControlFlowGraph.AllPathsReturn(func.blockBody);

            if (func.returnType != PredefinedValueTypes.Unit && !allPathsReturn)
                this.scope.diagnostics.reportAllPathsMustReturn(func);
        }        

        return this.scope;
    }
}