import * as AST from "./AST/ASTNode";
import { Diagnostics } from "../Diagnostics/Diagnostics";

export default class CompilationUnit 
{
    private readonly _compilationUnitSyntax : AST.CompilationUnitSyntax;
    private readonly _diagnostics: Diagnostics;

    constructor(compilationUnitSyntax : AST.CompilationUnitSyntax, diagnostics: Diagnostics)
    {
        this._compilationUnitSyntax = compilationUnitSyntax;
        this._diagnostics = diagnostics;
    }

    public get success() : boolean
    {
        return this.diagnostics.length === 0;
    }

    public get compilationUnit() : AST.CompilationUnitSyntax
    {
        return this._compilationUnitSyntax;
    }

    public get diagnostics() : Diagnostics
    {
        return this._diagnostics;
    }
}
