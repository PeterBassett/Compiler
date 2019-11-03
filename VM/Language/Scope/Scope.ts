import { using, IDisposable } from "../../misc/disposable";

export class ScopeLevel<T>
{
    private readonly _parent : ScopeLevel<T> | null;
    public readonly info : T; 

    constructor(parent : ScopeLevel<T> | null, initial : T)
    {
        this._parent = parent;
        this.info = initial;
    }

    public get Parent() : ScopeLevel<T> | null
    {
        return this._parent;
    }
}

export class ScopePopper<T> implements IDisposable
{
    private readonly _scope : Scope<T>;

    constructor(scope : Scope<T>)
    {
        this._scope = scope;
    }

    public dispose() : void
    {
        this._scope.PopScope();
    }
}

export interface IScope<T>
{
    PushScope() : IDisposable;
    PopScope() : void;
    scope : ScopeLevel<T>;
}

export class Scope<T> implements IScope<T>
{
    protected _scope : ScopeLevel<T>;

    constructor()
    {
        this._scope = new ScopeLevel<T>(null, this.createInitialScopeInfo());
    }

    public get scope() : ScopeLevel<T>
    {
        return this._scope;
    }

    protected createInitialScopeInfo() : T { return null as any; };

    public PushScope() : IDisposable
    {
        this._scope = new ScopeLevel<T>(this.scope, this.createInitialScopeInfo());
        return new ScopePopper<T>(this);
    }

    public PopScope() : void
    {
        if(this.scope.Parent)
            this._scope = this.scope.Parent;
    }
}