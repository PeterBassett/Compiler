import { IScope } from "../Scope/Scope";
import { ScopeInfo, Identifier } from "../Scope/DefinitionScope";
import { Type, FunctionDetails, ClassDetails, VariableDetails } from "./TypeInformation";
import { PredefinedValueTypes } from "./PredefinedValueTypes";
import { ValueType } from "./ValueType";
import { BoundFunctionDeclaration, BoundClassDeclaration, BoundVariableDeclaration } from "../Compiler/Binding/BoundNode";

export default class TypeQuery
{
    public static getTypeFromName(name : string, scope:IScope<ScopeInfo>, returnUnitOnFailure:boolean = false) : Type
    {
        switch(name)
        {
            case "int":
                return PredefinedValueTypes.Integer;
            case "float" : 
                return PredefinedValueTypes.Float;
            case "bool":
                return PredefinedValueTypes.Boolean;
            case "string" : 
                return PredefinedValueTypes.String;                
            default:
            {
                let identifier = scope.scope.info.Find(scope.scope, name);

                if(identifier == Identifier.Undefined)
                    if(returnUnitOnFailure)
                        return PredefinedValueTypes.Unit;
                    else
                        throw new Error("Undefined Type");

                if(!identifier.type.isClass)
                    if(returnUnitOnFailure)
                        return PredefinedValueTypes.Unit;
                    else
                        throw new Error("Undefined Type");

                return identifier.type;
            }
        }    
    }
    
    static getDefaultValueForType(type: Type, scope: IScope<ScopeInfo>): any {
        switch(type.type)
        {
            case ValueType.Int:
            case ValueType.Float : 
                return 0;                
            case ValueType.Boolean:
                return false;
            case ValueType.String : 
                return "";            
            case ValueType.Class:
                return null;    
        }
        
        throw new Error("Undefined Type");        
    }

    public static declaredVariableType(declaration: BoundVariableDeclaration): Type {
        let type : Type;
        type = declaration.variable.type.clone();
        type.variable = new VariableDetails(declaration.variable.name, type, declaration.variable.isGlobal);
        return type;
    }
/*
    public static declaredVariableType(name: string, t: Type, isGlobal : boolean): Type {
        let type : Type;
        type = t.clone();
        type.variable = new VariableDetails(name, type, isGlobal);
        return type;
    }*/

    public static declaredFunctionType(declaration: BoundFunctionDeclaration): Type {
        let type : Type;
        type = new Type(ValueType.Function);
        type.function = new FunctionDetails(declaration.parameters.map( p => p.type.clone()), declaration.returnType);
        return type;
    }

    public static overrideDeclaredFunctionReturnType(t1 : Type, t2 : Type): Type {
        let type : Type = t1.clone();

        type.setFunctionReturnType(t2);
        
        return type;
    }

    public static declaredClassType(declaration: BoundClassDeclaration): Type {
        let type : Type;
        type = new Type(ValueType.Class);
        type.classDetails = new ClassDetails(declaration.name, declaration.classes, declaration.fields, declaration.members);
        return type;
    }

    public static getValueTypeFromName(name : string) : ValueType
    {
        return ValueType.Int;
    }
}