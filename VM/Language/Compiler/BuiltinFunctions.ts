import { FunctionDetails, Type, FunctionType } from "../Types/TypeInformation";
import { PredefinedValueTypes } from "../Types/PredefinedValueTypes";
import TypeQuery from "../Types/TypeInspection";

export type ExecutorFunction = (parameters : number[]) => number;

export class BuiltinFunction
{
    constructor(
        public readonly name : string,
        public readonly type : Type,        
        public readonly executor : ExecutorFunction)
    {
        this.interupt = 0;
        this.details = type.function!;
    }

    public interupt : number;        
    public readonly details : FunctionDetails;        
}

export default class BuiltinFunctions
{   
    private _functionNameMap : { [index : string ] : BuiltinFunction } = {};
    private _functions : BuiltinFunction[] = [];

    constructor(builtins? : BuiltinFunction[])
    {
        builtins = builtins || [];
        
        const rndDetails = new FunctionDetails(
            [PredefinedValueTypes.Integer, PredefinedValueTypes.Integer], 
            PredefinedValueTypes.Integer, true);
    
        const rnd : BuiltinFunction = new BuiltinFunction(
            "rnd",
            new FunctionType(rndDetails.returnType.type, rndDetails.returnType.name, rndDetails),
            (parameters : number[]) => {
                if(parameters.length != 2)
                    throw new Error("Incorrect parameter count for rnd");
    
                let lower = parameters[0];
                let upper = parameters[1];
    
                return Math.floor(Math.random() * (upper - lower + 1) + lower);
            }); 
            
        this.storeFunction(rnd);

        for(let f of builtins)
            this.storeFunction(f);
    }

    protected storeFunction(func : BuiltinFunction) : void
    {
        this._functionNameMap[func.name] = func;
        func.interupt = this._functions.length;
        this._functions.push(func);                
    }

    public findByName(name:string) : BuiltinFunction|null 
    {
        const func = this._functionNameMap[name];

        if(!func)
            return null;

        return func;
    }

    public findByInterupt(interupt:number) : BuiltinFunction|null
    {
        if(interupt < 0)
            return null;
        
        if(interupt >= this._functions.length)
            return null;

        return this._functions[interupt];
    }
}