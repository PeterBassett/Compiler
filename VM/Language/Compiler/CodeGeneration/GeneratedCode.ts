import { Diagnostics } from "../Diagnostics/Diagnostics";

export default class GeneratedCode
{
    constructor(
        public readonly lines : string [], 
        public readonly diagnostics : Diagnostics
    )
    {
    }

    public get success () : boolean { return this.diagnostics.length === 0; }

    public get text(): string
    {
        return this.lines.join("\n");
    }
}