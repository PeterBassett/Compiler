import { Type, PredefinedType } from "./TypeInformation";
import { ValueType } from "./ValueType";

export class PredefinedValueTypes
{
    public static Byte: Type = new PredefinedType(ValueType.Byte, "byte");
    public static Integer: Type = new PredefinedType(ValueType.Int, "int");
    public static Float: Type = new PredefinedType(ValueType.Float, "float");
    public static String: Type = new PredefinedType(ValueType.String, "string");
    public static Boolean: Type = new PredefinedType(ValueType.Boolean, "bool");
    public static Error: Type = new PredefinedType(ValueType.Error, "Error");
    public static Unit: Type = new PredefinedType(ValueType.Unit, "unit");
    public static Null: Type = new PredefinedType(ValueType.Null, "null");
}
