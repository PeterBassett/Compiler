import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { ValueType } from "../../Types/ValueType";
import { Type } from "../../Types/TypeInformation";

export default class Conversion
{
    public static readonly None = new Conversion(false, false, false, false);
    public static readonly Identity = new Conversion(true, true, true, false);
    public static readonly Implicit = new Conversion(true, false, true, false);
    public static readonly Explicit = new Conversion(true, false, false, false);
    public static readonly Immediate = new Conversion(true, false, false, true);

    private constructor(
        public readonly Exists : boolean, 
        public readonly IsIdentity : boolean, 
        public readonly IsImplicit : boolean,
        public readonly IsImmediate : boolean,
        public readonly ConvertTo : Type = PredefinedValueTypes.Unit,
        public readonly ConvertToValue : any  = null)
    {
    }

    public get IsExplicit() { return this.Exists && !this.IsImplicit && !this.IsImmediate; };

    public static classifyConversion(fromIsLiteral:boolean, from : Type, to : Type) : Conversion
    {
        if (from.equals(to))
            return Conversion.Identity;

        if (from.equals(PredefinedValueTypes.Boolean) || 
            from.equals(PredefinedValueTypes.Integer) ||
            from.equals(PredefinedValueTypes.Float))
        {
            if (to.equals(PredefinedValueTypes.String))
                return Conversion.Explicit;
        }

        if (from.equals(PredefinedValueTypes.String))
        {
            if (to.equals(PredefinedValueTypes.Boolean) || 
                to.equals(PredefinedValueTypes.Integer) ||
                to.equals(PredefinedValueTypes.Float) )
                return Conversion.Explicit;
        }

        if(from.equals(PredefinedValueTypes.Integer) && 
             to.equals(PredefinedValueTypes.Float))
            return new Conversion(true, false, true, false, PredefinedValueTypes.Float);

        if(from.equals(PredefinedValueTypes.Byte) && 
            to.equals(PredefinedValueTypes.Integer))
           return new Conversion(true, false, true, false, PredefinedValueTypes.Integer);

        if(from.equals(PredefinedValueTypes.Integer) && to.equals(PredefinedValueTypes.Byte) && fromIsLiteral)
            return new Conversion(true, false, true, true, PredefinedValueTypes.Byte);

        if(from.equals(PredefinedValueTypes.Integer) && to.equals(PredefinedValueTypes.Byte) && !fromIsLiteral)
            return Conversion.Explicit;

        if (from.equals(PredefinedValueTypes.Float))
        {
            if (to.equals(PredefinedValueTypes.Boolean) || 
                to.equals(PredefinedValueTypes.Integer) ||
                to.equals(PredefinedValueTypes.Byte) ||
                to.equals(PredefinedValueTypes.String) )
                return Conversion.Explicit;
        }

        // you can always assign null to any pointer type.
        if(from.type === ValueType.Null &&
            to.isPointer)
        {
            return new Conversion(true, false, false, true, to, 0);
        }

        return Conversion.None;
    }
}