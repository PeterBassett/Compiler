import { using, IDisposable } from "../../misc/disposable";
import * as AST from "../Compiler/Syntax/AST/ASTNode";
import { Scope, ScopeLevel } from "./Scope";
import { BoundFunctionDeclaration } from "../Compiler/Binding/BoundNode";
import { ValueType } from "../Types/ValueType";

export class Value
{
    ToCallable(): AST.CallableExpressionNode {
        return this._value as AST.CallableExpressionNode;
    }
    
    public static readonly Unit : Value = new Value(ValueType.Unit, null);

    private readonly _type : ValueType;
    private readonly _value: any | null;

    isValue(obj : any) : obj is Value{
        return  typeof(obj._type) === "number" &&
                typeof(obj._value) === "number";
    }

    constructor(type : ValueType, 
                value : Value | number | string | boolean | null | AST.CallableExpressionNode | BoundFunctionDeclaration)
    {
        if(value && this.isValue(value))
        {
            this._value = value._value;
            this._type = value._type;
        }
        else
        {
            this._type = type;
            this._value = value;
        }
    }

    public get Type() : ValueType 
    {
        return this._type;
    }

    public ToInt() : number
    {
        return this._value as number;
    }

    public ToFloat() : number
    {
        return this._value as number;
    }

    public ToBoolean() : boolean
    {
        return this._value as boolean;
    }

    public IsNumericType() : boolean
    {
        if (this._value == null)
            return false;

        return  this.Type == ValueType.Int ||
                this.Type == ValueType.Float;
    }

    public ToObject() : any
    {
        return this._value as any;
    }

    public get IsFunction()
    {
        return this._type == ValueType.Function; 
    }
    /*

    public ToFuntion() : FunctionExpr 
    { 
        return this._value as FunctionExpr; 
    }*/

    public toString() : string
    {
        return this._value as string;
    }
}

export class Identifier
{
    public static Undefined : Identifier = new Identifier(new Value(ValueType.Unit, null), ValueType.Unit);
    private readonly _isDefined : boolean;
    private _value : Value;
    private _type : ValueType;

    public constructor(value : Value, type : ValueType)
    {
        this._value = value;
        this._isDefined = true;
        this._type = type;
    }

    public get Value() : Value
    {
        return this._value;
    }

    public get Type() : ValueType
    {
        return this._type;
    }

    public get IsDefined() : boolean
    {
        return this._isDefined;
    }
}

export class ScopeInfo
{
    private readonly values : { [key:string] : Identifier}; 

    constructor()
    {
        this.values = {};
    }

    public DefineIdentifier(scope : ScopeLevel<ScopeInfo>, name: string, value: Value, type : ValueType) : void 
    {
        if (!!this.values[name])
            throw RangeError(name); //IdentifierAlreadyDefinedException(name);

        this.values[name] = new Identifier(value, type);
    }

    public AssignIdentifierValue(initialScope : ScopeLevel<ScopeInfo>, name : string, value : Value) :  void
    {
        let scope : ScopeLevel<ScopeInfo> | null = initialScope;

        while (scope != null && !scope.info.values[name]) // HACK
            scope = scope.Parent;

        if(scope == null)
            throw RangeError(name); 

        // TODO : If the type of the variable doesnt match the type of the value, throw.

        scope.info.values[name] = new Identifier(value, scope.info.values[name].Type);
    }

    public FindIdentifier(scope : ScopeLevel<ScopeInfo>, name :  string) : Identifier
    {
        if (!!this.values[name])
            return this.values[name];

        if (scope.Parent != null)
        {
            return scope.Parent.info.FindIdentifier(scope.Parent, name);
        }

        return Identifier.Undefined;
    }  
}

export class ExecutionScope extends Scope<ScopeInfo>
{
    protected createInitialScopeInfo(): ScopeInfo {
        return new ScopeInfo();
    }

    DefineIdentifier(name: string, value : Value, type : ValueType) : void
    {
        this.scope.info.DefineIdentifier(this.scope, name, value, type);
    }

    public AssignIdentifierValue(identifier : string, value : Value) : void
    {
        this.scope.info.AssignIdentifierValue(this.scope, identifier, value);
    }

    public FindIdentifier(name : string) : Identifier
    {
        return this.scope.info.FindIdentifier(this.scope, name);
    }

    public PushArguments(args : string[], values : Value[]) :  IDisposable
    {
        var scopePopper = this.PushScope();

        try
        {
            for (var i = 0; i < args.length; i++)
            {
                this.scope.info.DefineIdentifier(this.scope, args[i], values[i], values[i].Type);
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