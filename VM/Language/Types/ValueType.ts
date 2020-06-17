export enum ValueType {
    Unit,
    Null,
    Error,
    Function,
    Boolean,
    Byte,
    Int,
    Float,
    String,
    Class,
    Struct,
    Union,
    Pointer,
    Array
}

let ValueTypeNameMap : { [index:number] :string } = {};
ValueTypeNameMap = Object.keys(ValueType).filter(k => typeof ValueType[k as any] === "number");

export { ValueTypeNameMap };