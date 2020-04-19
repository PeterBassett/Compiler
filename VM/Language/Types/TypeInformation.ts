import { IScope, Scope } from "../Scope/Scope";
import { BoundFunctionDeclaration, BoundVariableDeclaration, BoundClassDeclaration, BoundStructMemberDeclaration, BoundExpression } from "../Compiler/Binding/BoundNode";
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
    private static _id : number = 0;

    public typeid: number;

    public type: ValueType;
    
    public name : string;
    public isClass : boolean;    
    public isStruct : boolean;
    public isArray: boolean;    
    public isPredefined : boolean;   
    
    public get isLarge() : boolean
    {
        return this.isStruct || this.isArray || this.isClass;
    }

    public get isPointer() : boolean
    {
        return !!this.pointerToType;
    }

    public pointerToType : Type|null;
    public elementType : Type|null;
    public arrayLength : number|null;
    public variable: VariableDetails|null;
    public function: FunctionDetails|null;
    public classDetails: ClassDetails|null;
    public structDetails: StructDetails|null;

    constructor(type: ValueType, name : string)
    {
        this.typeid = Type._id++;
        this.type = type;
        this.name = name;
        this.isClass = type == ValueType.Class;
        this.isStruct = type == ValueType.Struct;
        this.isArray = type == ValueType.Array;
                
        this.isPredefined = false;
        this.pointerToType = null;
        
        this.function = null;
        this.variable = null;
        this.classDetails = null;
        this.structDetails = null;
        this.elementType = null;
        this.arrayLength = null;
    }

    clone(): Type {
        let a = new Type(this.type, this.name);        
        
        a.typeid = this.typeid;

        a.isClass = this.isClass;
        a.isStruct = this.isStruct;        
        a.isArray = this.isArray;
        a.isPredefined = this.isPredefined;
        a.pointerToType = this.pointerToType;
        a.elementType = this.elementType;
        a.arrayLength = this.arrayLength;

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

    equals(type: Type): any 
    {
        return this.type == type.type;
    }

    isAssignableTo(targetType: Type): boolean {
        return this.type == targetType.type;
    }
}

export class ClassType extends Type
{
    constructor(name:string) 
    {
        super(ValueType.Class, name);
    }
}

export class StructType extends Type
{
    constructor(name:string) {
        super(ValueType.Struct, name);
    }
}

export class FunctionType extends Type
{
    constructor(returnType : ValueType, name:string, functionDetails : FunctionDetails) {
        super(returnType, name);

        this.function = functionDetails;
    }
}

export class PredefinedType extends Type
{
    constructor(returnType : ValueType, name:string) {
        super(returnType, name);

        this.isPredefined = true;
    }
}

export class PointerType extends Type
{
    constructor(pointerToType : Type) {
        super(ValueType.Pointer, "*" + pointerToType.name);
        this.pointerToType = pointerToType;
    }
}

export class ArrayType extends Type
{
    constructor(elementType : Type, length:number) {
        super(ValueType.Array, `[${length}]${elementType.name}`);        
        this.elementType = elementType;
        this.arrayLength = length;
    }
}