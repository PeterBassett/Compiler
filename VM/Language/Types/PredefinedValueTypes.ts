import { Type } from "./TypeInformation";
import { ValueType } from "./ValueType";
export class PredefinedValueTypes {
    public static Integer: Type = new Type(ValueType.Int, "int", undefined, true);
    public static Float: Type = new Type(ValueType.Float, "float", undefined, true);
    public static String: Type = new Type(ValueType.String, "string", undefined, true);
    public static Boolean: Type = new Type(ValueType.Boolean, "bool", undefined, true);
    public static Unit: Type = new Type(ValueType.Unit, "unit", undefined, true);
    public static Error: Type = new Type(ValueType.Error, "Error", undefined, true);
}
