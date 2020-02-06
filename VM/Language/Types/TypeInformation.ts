import { IScope, Scope } from "../Scope/Scope";
import { BoundFunctionDeclaration, BoundVariableDeclaration, BoundClassDeclaration, BoundStructMemberDeclaration } from "../Compiler/Binding/BoundNode";
import { GetKeywordType } from "../Compiler/Syntax/SyntaxFacts";
import { ScopeInfo, Identifier } from "../Scope/DefinitionScope";
import { PredefinedValueTypes } from "../Types/PredefinedValueTypes";
import { ValueType } from "./ValueType";

export class FunctionDetails
{
    public readonly parameterTypes! : Type[];    
    public readonly returnType : Type;
    public readonly isBuiltin : boolean;

    constructor(types : Type[], returnType:Type, isBuiltin : boolean = false)
    {
        this.parameterTypes = types;
        this.returnType = returnType;
        this.isBuiltin = isBuiltin;
    }

    clone(): FunctionDetails 
    {
        return new FunctionDetails(
            this.parameterTypes.map( t => t.clone() ),
            this.returnType
        );
    }
}

export class VariableDetails
{
    constructor(
        public readonly name : string,
        public readonly type : Type,
        public readonly isGlobal : boolean)
    {
    }

    clone(): VariableDetails 
    {
        return new VariableDetails(
            this.name,
            this.type,
            this.isGlobal
        );
    }
}

export class ClassDetails
{
    public readonly name : string;
    public readonly nestedClasses : BoundClassDeclaration[];
    public readonly fields : BoundVariableDeclaration[];
    public readonly members : BoundFunctionDeclaration[];

    
    constructor(name : string, nestedClasses : BoundClassDeclaration[], fields : BoundVariableDeclaration[], members : BoundFunctionDeclaration[])    
    {
        this.name = name;
        this.nestedClasses = nestedClasses;
        this.fields = fields;
        this.members = members;    
    }

    get(name:string) : BoundClassDeclaration | BoundFunctionDeclaration | BoundVariableDeclaration | null
    {
        let field = this.fields.filter(f => f.variable.name == name);        
        if(field.length)
            return field[0];
        
        let method = this.members.filter(f => f.identifier == name);        
        if(method.length)
            return method[0];
            
        let nestecClass = this.nestedClasses.filter(f => f.name == name);        
        if(nestecClass.length)
            return nestecClass[0];

        return null;
    }

    clone(): ClassDetails
    {
        return new ClassDetails(
            this.name,
            this.nestedClasses,
            this.fields,
            this.members);
    }
}

export class StructDetails
{
    constructor(public readonly structName : string, public readonly fields : BoundStructMemberDeclaration[])    
    {
    }

    get(memberName:string) : BoundStructMemberDeclaration | null
    {
        let field = this.fields.filter(f => f.name == memberName);        
        if(field.length)
            return field[0];        

        return null;
    }

    clone(): StructDetails
    {
        return new StructDetails(
            this.structName,
            this.fields);
    }
}

export class Type
{    
    equals(type: Type): any 
    {
        return this.type == type.type;
    }

    variable?: VariableDetails;
    function?: FunctionDetails;
    classDetails?: ClassDetails;
    structDetails?: StructDetails;

    clone(): Type {
        let a = new Type(this.type, this.name);
        a.isClass = this.isClass;
        a.isStruct = this.isStruct;
        
        if(this.function)
            a.function = this.function.clone();

        if(this.classDetails)
            a.classDetails = this.classDetails.clone();
            
        if(this.structDetails)
            a.structDetails = this.structDetails.clone();            

        if(this.variable)
            a.variable = this.variable.clone();            

        return a;
    }

    setFunctionReturnType(t: Type) {
        this.type = t.type;
        this.name = t.name;
        this.isClass = t.isClass;
        this.isStruct = t.isStruct;
        if(this.function) 
             this.function.returnType.setFunctionReturnType(t);                     
    }

    isAssignableTo(targetType: Type): boolean {
        return this.type == targetType.type;
    }

    constructor(type: ValueType, name? : string, func? : FunctionDetails, isPredefined? : boolean)
    {
        this.type = type;
        this.name = name;
        this.isClass = type == ValueType.Class;
        this.isStruct = type == ValueType.Struct;
        this.function = func;
        this.isPredefined = isPredefined || false;
    }

    public type: ValueType
    public name? : string;
    public isClass : boolean;    
    public isStruct : boolean;
    public isPredefined : boolean;
}