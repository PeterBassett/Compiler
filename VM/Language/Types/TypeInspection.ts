import { IScope } from "../Scope/Scope";
import { ScopeInfo, Identifier } from "../Scope/DefinitionScope";
import { Type, FunctionDetails, ClassDetails, VariableDetails, FunctionType, ClassType, PointerType, ArrayType } from "./TypeInformation";
import { PredefinedValueTypes } from "./PredefinedValueTypes";
import { ValueType } from "./ValueType";
import { BoundFunctionDeclaration, BoundClassDeclaration, BoundVariableDeclaration } from "../Compiler/Binding/BoundNode";
import { TypeSyntax } from "../Compiler/Syntax/AST/ASTNode";
import { Value } from "../Scope/ExecutionScope";
import { exhaustiveCheck } from "../../misc/exhaustive";
import Binder from "../Compiler/Binding/Binder";

export default class TypeQuery
{   
    static getDefaultValueForType(type: Type, scope: IScope<ScopeInfo>): any {
        switch(type.type)
        {
            case ValueType.Pointer :
            case ValueType.Int :
            case ValueType.Float : 
            case ValueType.Byte : 
                return 0;                
            case ValueType.Boolean:
                return false;
            case ValueType.String : 
                return "";            
            case ValueType.Class:
            case ValueType.Struct:
            case ValueType.Union:
            case ValueType.Array:
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
        const type = new FunctionType(ValueType.Function, 
            declaration.identifier,
            new FunctionDetails(declaration.parameters.map( p => p.type.clone()), declaration.returnType) );

        return type;
    }

    public static overrideDeclaredFunctionReturnType(t1 : Type, t2 : Type): Type {
        let type : Type = t1.clone();

        type.setFunctionReturnType(t2);
        
        return type;
    }

    public static declaredClassType(declaration: BoundClassDeclaration): Type {
        const type = new ClassType(declaration.name);
        type.classDetails = new ClassDetails(declaration.name, declaration.classes, declaration.fields, declaration.members);
        return type;
    }

    public static getValueTypeFromName(name : string) : ValueType
    {
        return ValueType.Int;
    }
}