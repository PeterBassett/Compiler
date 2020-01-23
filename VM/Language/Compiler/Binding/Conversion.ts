import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { ValueType } from "../../Types/ValueType";
import { Type } from "../../Types/TypeInformation";

export default class Conversion
{
    public static readonly None = new Conversion(false, false, false);
    public static readonly Identity = new Conversion(true, true, true);
    public static readonly Implicit = new Conversion(true, false, true);
    public static readonly Explicit = new Conversion(true, false, false);

    private constructor(
        public readonly Exists : boolean, 
        public readonly IsIdentity : boolean, 
        public readonly IsImplicit : boolean,
        public readonly ConvertTo : Type = PredefinedValueTypes.Unit)
    {
    }

    public get IsExplicit() { return this.Exists && !this.IsImplicit };

    public static classifyConversion(from : Type, to : Type) : Conversion
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
            return new Conversion(true, false, true, PredefinedValueTypes.Float);

        if (from.equals(PredefinedValueTypes.Float))
        {
            if (to.equals(PredefinedValueTypes.Boolean) || 
                to.equals(PredefinedValueTypes.Integer) ||
                to.equals(PredefinedValueTypes.String) )
                return Conversion.Explicit;
        }

        return Conversion.None;
    }
}