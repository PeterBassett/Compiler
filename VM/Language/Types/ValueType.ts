export enum ValueType {
    Unit,
    Null,
    Error,
    Function,
    Boolean,
    Int,
    Float,
    String,
    Class,
    Struct,
    Pointer
}

let ValueTypeNameMap : { [index:number] :string } = {};
ValueTypeNameMap = Object.keys(ValueType).filter(k => typeof ValueType[k as any] === "number");

export { ValueTypeNameMap };