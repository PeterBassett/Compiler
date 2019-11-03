import { FunctionDetails, Type } from "../Types/TypeInformation";
import { PredefinedValueTypes } from "../Types/PredefinedValueTypes";

export class BuiltinFunction
{
    constructor(
        interupt : number,
        type : Type,
        details : FunctionDetails,
        executor : (parameters : number[]) => number)
    {
        this.interupt = interupt;
        this.type = type;
        this.details = details;
        this.executor = executor;
    }

    public readonly interupt : number;
    public readonly type : Type;
    public readonly details : FunctionDetails;
    public readonly executor : (parameters : number[]) => number;  
}

export default class BuiltinFunctions
{   
    private static readonly rndDetails : FunctionDetails = new FunctionDetails(
        [PredefinedValueTypes.Integer, PredefinedValueTypes.Integer], 
        PredefinedValueTypes.Integer, true);

    public static readonly rnd : BuiltinFunction = new BuiltinFunction(
        1,
        new Type(BuiltinFunctions.rndDetails.returnType.type, "int", BuiltinFunctions.rndDetails),
        BuiltinFunctions.rndDetails,
        (parameters : number[]) => {
            if(parameters.length != 2)
                throw new Error("Incorrect parameter count for rnd");

            let lower = parameters[0];
            let upper = parameters[1];

            return Math.floor(Math.random() * (upper - lower + 1) + lower);
        });

    //public static readonly rnd : Type = new Type(BuiltinFunctions.rndDetails.returnType.type, "int", BuiltinFunctions.rndDetails);


    public static find(name:string) : BuiltinFunction|null 
    {
        let names = Object.keys(BuiltinFunctions).filter(n => n != "find");
        if(names.indexOf(name) == -1)
            return null;

        let func = (this as any)[name] as BuiltinFunction
        
        return func;
    }

    public static findByInterupt(interupt:number) : BuiltinFunction|null
    {
        if(interupt == 1)
            return this.rnd;

        return null;
    }
}