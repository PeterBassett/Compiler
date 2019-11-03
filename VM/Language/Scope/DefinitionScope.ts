import { IDisposable } from "../../misc/disposable";
import { Scope, ScopeLevel } from "./Scope";
import { Type } from "../Types/TypeInformation";
import { PredefinedValueTypes } from "../Types/PredefinedValueTypes";
import { BoundFunctionDeclaration, BoundVariableDeclaration } from "../Compiler/Binding/BoundNode";
import TypeQuery from "../Types/TypeInspection";
import { VariableSymbol } from "../Compiler/Binding/BoundNode";
import { symbol } from "prop-types";

export class ScopeInfo
{        
    private readonly values : { [key:string] : Identifier }; 

    constructor()
    {
        this.values = {};
    }

    Define(name: string, type: Type, variable?: VariableSymbol): Identifier 
    {
        if (!!this.values[name])
            throw RangeError(name);

        let identifier = new Identifier(name, type, variable);
        this.values[name] = identifier;
        return identifier;
    }

    Redefine(name: string, type: Type, variable?: VariableSymbol): void 
    {
        this.values[name] = new Identifier(name, type, variable);
    }

    Find(scope: ScopeLevel<ScopeInfo>, name: string): Identifier {     
        if (!!this.values[name])
            return this.values[name];

        if (scope.Parent != null)
            return scope.Parent.info.Find(scope.Parent, name);

        return Identifier.Undefined;
    }          
}

export class Identifier
{
    public static Undefined : Identifier = new Identifier("", PredefinedValueTypes.Unit);    

    public constructor(public readonly name : string, 
        public readonly type : Type, 
        public readonly variable?: VariableSymbol)
    {
    }
}

export class DefinitionScope extends Scope<ScopeInfo>
{
    protected createInitialScopeInfo(): ScopeInfo 
    {
        return new ScopeInfo();
    }

    DefineVariableFromSymbol(variable: VariableSymbol, type: Type) {
        this.scope.info.Define(variable.name, type, variable);
    }

    DefineVariableFromDeclaration(name: string, declaration: BoundVariableDeclaration, variable: VariableSymbol) {
        this.scope.info.Define(name, TypeQuery.declaredVariableType(declaration), variable);
    }
    
    DefineFunction(name: string, declaration: BoundFunctionDeclaration) : Identifier {
        return this.scope.info.Define(name, TypeQuery.declaredFunctionType(declaration));
    }    

    FindVariable(name : string) : Identifier
    {
        return this.scope.info.Find(this.scope, name);
    }

    DefineType(name: string, type: Type) : void 
    {
        this.scope.info.Define(name, type);
    }

    PushArguments(args : string[], types : Type[], symbols : VariableSymbol[]) : IDisposable
    {
        var scopePopper = this.PushScope();

        try
        {
            for (var i = 0; i < args.length; i++)
            {
                this.scope.info.Define(args[i], types[i], symbols[i]);
            }
        }
        catch (e)
        {
            scopePopper.dispose();
            throw e;
        }

        return scopePopper;
    }        
}