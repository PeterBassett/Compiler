export enum ValueType {
    Unit,
    Error,
    Function,
    Boolean,
    Int,
    Float,
    String,
    Class
}

let ValueTypeNameMap : { [index:number] :string } = {};
ValueTypeNameMap = Object.keys(ValueType).filter(k => typeof ValueType[k as any] === "number");

export { ValueTypeNameMap };