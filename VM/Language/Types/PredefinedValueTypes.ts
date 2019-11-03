import { Type } from "./TypeInformation";
import { ValueType } from "./ValueType";
export class PredefinedValueTypes {
    public static Integer: Type = new Type(ValueType.Int, "int");
    public static Float: Type = new Type(ValueType.Float, "float");
    public static String: Type = new Type(ValueType.String, "string");
    public static Boolean: Type = new Type(ValueType.Boolean, "bool");
    public static Unit: Type = new Type(ValueType.Unit, "unit");
    public static Error: Type = new Type(ValueType.Error, "Error");
}
