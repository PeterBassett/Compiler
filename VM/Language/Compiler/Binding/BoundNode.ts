import { Type } from "../../Types/TypeInformation";
import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { SyntaxType } from "../Syntax/SyntaxType";
import { Diagnostics } from "../Diagnostics/Diagnostics";
import { Identifier } from "../../Scope/DefinitionScope";
import TextSpan from "../Syntax/Text/TextSpan";
import { IBoundNodeVisitor } from "./IBoundNodeVisitor";
import { ValueType } from "../../Types/ValueType";
import Conversion from "./Conversion";

export enum BoundNodeKind {
    VariableDeclaration,
    FunctionDefinition,
    BlockStatement,
    BinaryExpression,
    LiteralExpression,
    IfStatement,
    ExpressionStatement,
    ForStatement,
    WhileStatement,
    ReturnStatement,
    ParameterDeclaration,
    UnaryExpression,
    VariableExpression,
    AssignmentExpression,
    ErrorExpression,
    CallExpression,
    LabelStatement,
    GotoStatement,
    ConditionalGotoStatement,
    ConversionExpression,
    SetExpression,
    StructMemberDeclaration,
    StructDeclaration,
    ClassDeclaration,
    GetExpression
}

export enum BoundBinaryOperatorKind {
    Addition,
    Subtraction,
    Multiplication,
    Division,
    BitwiseAnd,
    BitwiseOr,
    BitwiseXor,
    Equals,
    NotEquals,
    LessThan,
    LessThanOrEquals,
    GreaterThan,
    GreaterThanOrEquals,
    LogicalAnd,
    LogicalOr
}

export abstract class BoundNode
{    
    private static MaxNodeId:number=0;
    public readonly id : number = BoundNode.MaxNodeId++;

    public abstract get kind(): BoundNodeKind;

    public accept(visitor:any)
    {
        let kinds = Object.keys(BoundNodeKind)
        let kind = kinds[this.kind];

        let method = visitor["visit" + kind]
        
        if(method)
            method(this);
    }
}

export abstract class BoundExpression extends BoundNode {
    public abstract get type(): Type;
}

export class BoundBinaryExpression extends BoundExpression
{
    constructor(left : BoundExpression, operator : BoundBinaryOperator, right : BoundExpression)
    {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    public get kind() : BoundNodeKind { return BoundNodeKind.BinaryExpression; }
    public get type() : Type { return this.operator.type; }
    public readonly left : BoundExpression;
    public readonly operator : BoundBinaryOperator;
    public readonly right : BoundExpression;
}

export class BoundBinaryOperator
{
    private constructor(syntaxKind : SyntaxType, 
                        kind : BoundBinaryOperatorKind, 
                        operandType : Type, 
                        resultType? : Type)
    {
        this.syntaxKind = syntaxKind;
        this.operatorKind = kind;

        if(!resultType)
            resultType = operandType;

        this.operandType = operandType;
        this.type = resultType;
    }

    public readonly syntaxKind : SyntaxType;
    public readonly operatorKind : BoundBinaryOperatorKind;
    public readonly operandType:Type;
    public readonly type : Type;

    private static _operators : BoundBinaryOperator[] = [
        new BoundBinaryOperator(SyntaxType.Plus, BoundBinaryOperatorKind.Addition, PredefinedValueTypes.Integer),
        new BoundBinaryOperator(SyntaxType.Plus, BoundBinaryOperatorKind.Addition, PredefinedValueTypes.String),
        new BoundBinaryOperator(SyntaxType.Plus, BoundBinaryOperatorKind.Addition, PredefinedValueTypes.Float),
        
        new BoundBinaryOperator(SyntaxType.Minus, BoundBinaryOperatorKind.Subtraction, PredefinedValueTypes.Integer),
        new BoundBinaryOperator(SyntaxType.Minus, BoundBinaryOperatorKind.Subtraction, PredefinedValueTypes.Float),

        new BoundBinaryOperator(SyntaxType.Star, BoundBinaryOperatorKind.Multiplication, PredefinedValueTypes.Integer),
        new BoundBinaryOperator(SyntaxType.Star, BoundBinaryOperatorKind.Multiplication, PredefinedValueTypes.Float),

        new BoundBinaryOperator(SyntaxType.Slash, BoundBinaryOperatorKind.Division, PredefinedValueTypes.Integer),
        new BoundBinaryOperator(SyntaxType.Slash, BoundBinaryOperatorKind.Division, PredefinedValueTypes.Float),

        new BoundBinaryOperator(SyntaxType.Ampersand, BoundBinaryOperatorKind.BitwiseAnd, PredefinedValueTypes.Integer),
        new BoundBinaryOperator(SyntaxType.Pipe, BoundBinaryOperatorKind.BitwiseOr, PredefinedValueTypes.Integer),
        new BoundBinaryOperator(SyntaxType.Hat, BoundBinaryOperatorKind.BitwiseXor, PredefinedValueTypes.Integer),
        
        new BoundBinaryOperator(SyntaxType.EqualsEquals, BoundBinaryOperatorKind.Equals, PredefinedValueTypes.Integer, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.EqualsEquals, BoundBinaryOperatorKind.Equals, PredefinedValueTypes.Float, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.EqualsEquals, BoundBinaryOperatorKind.Equals, PredefinedValueTypes.String, PredefinedValueTypes.Boolean),

        new BoundBinaryOperator(SyntaxType.BangEquals, BoundBinaryOperatorKind.NotEquals, PredefinedValueTypes.Integer, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.BangEquals, BoundBinaryOperatorKind.NotEquals, PredefinedValueTypes.Float, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.BangEquals, BoundBinaryOperatorKind.NotEquals, PredefinedValueTypes.String, PredefinedValueTypes.Boolean),

        new BoundBinaryOperator(SyntaxType.EqualsEquals, BoundBinaryOperatorKind.Equals, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.BangEquals, BoundBinaryOperatorKind.NotEquals, PredefinedValueTypes.Boolean),
        
        new BoundBinaryOperator(SyntaxType.LessThan, BoundBinaryOperatorKind.LessThan, PredefinedValueTypes.Integer, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.LessThan, BoundBinaryOperatorKind.LessThan, PredefinedValueTypes.Float, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.LessThan, BoundBinaryOperatorKind.LessThan, PredefinedValueTypes.String, PredefinedValueTypes.Boolean),

        new BoundBinaryOperator(SyntaxType.LessThanOrEqual, BoundBinaryOperatorKind.LessThanOrEquals, PredefinedValueTypes.Integer, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.LessThanOrEqual, BoundBinaryOperatorKind.LessThanOrEquals, PredefinedValueTypes.Float, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.LessThanOrEqual, BoundBinaryOperatorKind.LessThanOrEquals, PredefinedValueTypes.String, PredefinedValueTypes.Boolean),

        new BoundBinaryOperator(SyntaxType.GreaterThan, BoundBinaryOperatorKind.GreaterThan, PredefinedValueTypes.Integer, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.GreaterThan, BoundBinaryOperatorKind.GreaterThan, PredefinedValueTypes.Float, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.GreaterThan, BoundBinaryOperatorKind.GreaterThan, PredefinedValueTypes.String, PredefinedValueTypes.Boolean),

        new BoundBinaryOperator(SyntaxType.GreaterThanOrEqual, BoundBinaryOperatorKind.GreaterThanOrEquals, PredefinedValueTypes.Integer, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.GreaterThanOrEqual, BoundBinaryOperatorKind.GreaterThanOrEquals, PredefinedValueTypes.Float, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.GreaterThanOrEqual, BoundBinaryOperatorKind.GreaterThanOrEquals, PredefinedValueTypes.String, PredefinedValueTypes.Boolean),

        new BoundBinaryOperator(SyntaxType.Ampersand, BoundBinaryOperatorKind.BitwiseAnd, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.AmpersandAmpersand, BoundBinaryOperatorKind.LogicalAnd, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.Pipe, BoundBinaryOperatorKind.BitwiseOr, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.PipePipe, BoundBinaryOperatorKind.LogicalOr, PredefinedValueTypes.Boolean),
        new BoundBinaryOperator(SyntaxType.Hat, BoundBinaryOperatorKind.BitwiseXor, PredefinedValueTypes.Boolean),        
    ];

    public static Bind(syntaxKind: SyntaxType, leftType: Type, rightType: Type) : BoundBinaryOperator | null
    {
        for(let op of BoundBinaryOperator._operators)
        {
            if (op.syntaxKind == syntaxKind && 
                op.operandType.equals(leftType) && 
                op.operandType.equals(rightType) )
                return op;
        }

        return null;
    }
}

export enum BoundUnaryOperatorKind {
    LogicalNegation,
    Identity,
    Negation
}

export class BoundUnaryExpression extends BoundExpression
{
    constructor(operator : BoundUnaryOperator, operand : BoundExpression)
    {
        super();
        this.operator = operator;
        this.operand = operand;
    }
    
    public get kind() : BoundNodeKind { return BoundNodeKind.UnaryExpression; }        
    public get type() : Type { return this.operator.type; }
    public readonly operator : BoundUnaryOperator;
    public readonly operand : BoundExpression;
}

export class BoundUnaryOperator
{
    private constructor(syntaxKind : SyntaxType, kind : BoundUnaryOperatorKind, operandType : Type, resultType? : Type)
    {
        this.syntaxKind = syntaxKind;
        this.kind = kind;
        this.operandType = operandType;

        if(!resultType)
            resultType = operandType;

        this.type = resultType;
    }

    public readonly syntaxKind : SyntaxType;
    public readonly kind : BoundUnaryOperatorKind;
    public readonly operandType : Type;
    public readonly type : Type;

    private static _operators : BoundUnaryOperator[] = [    
        new BoundUnaryOperator(SyntaxType.Bang, BoundUnaryOperatorKind.LogicalNegation, PredefinedValueTypes.Boolean),
        new BoundUnaryOperator(SyntaxType.Plus, BoundUnaryOperatorKind.Identity, PredefinedValueTypes.Integer),
        new BoundUnaryOperator(SyntaxType.Minus, BoundUnaryOperatorKind.Negation, PredefinedValueTypes.Integer),
    ];

    public static Bind(syntaxKind : SyntaxType, operandType: Type) : BoundUnaryOperator | null 
    {
        for(let op of BoundUnaryOperator._operators)
        {
            if (op.syntaxKind == syntaxKind && op.operandType.equals(operandType))
                return op;
        }
        
        return null;
    }
}

export abstract class BoundStatement extends BoundNode
{
}

export class BoundBlockStatement extends BoundStatement
{
    public constructor(statements : BoundStatement[])
    {
        super();
        this.statements = statements;
    }

    public get kind() { return BoundNodeKind.BlockStatement; }
    public readonly statements : BoundStatement[];
}

export class BoundGlobalScope
{
    constructor(
        public readonly diagnostics : Diagnostics, 
        public readonly variables : BoundVariableDeclaration[], 
        public readonly classes : BoundClassDeclaration[], 
        public readonly structs : BoundStructDeclaration[], 
        public readonly functions : BoundFunctionDeclaration[])
    {
        this.functionMap = {};
        this.functions.forEach( f => this.functionMap[f.identifier] = f );
    }

    public get success() : boolean { return this.diagnostics.length === 0; }    
    public readonly functionMap : { [index:string] : BoundFunctionDeclaration };
}

export class BoundLiteralExpression extends BoundExpression
{
    constructor(value : any, type : Type)
    {
        super();
        this.value = value;
        this._type = type;
    }

    public get kind() : BoundNodeKind { return BoundNodeKind.LiteralExpression };
    public get type() : Type { return this._type; }
    private readonly _type : Type; 
    public readonly value : any;
}

export class BoundFunctionDeclaration extends BoundStatement
{
    constructor(identifier : string, parameters: ParameterDeclaration[], returnType : Type, blockBody : BoundBlockStatement | undefined)
    {        
        super();

        this.identifier = identifier;
        this.parameters = parameters;
        this._returnType = returnType;
        this._blockBody = blockBody;
    }

    public get kind() { return BoundNodeKind.FunctionDefinition; };    
    public readonly identifier : string;
    public readonly parameters : ParameterDeclaration[];
    
    private _returnType : Type | undefined;
    public get returnType() : Type
    {
        if(!this._returnType)
            throw new Error("Function ReturnType Is Not Yet Defined!");
        return this._returnType; 
    } 

    private _blockBody : BoundBlockStatement | undefined;
    public get blockBody() : BoundBlockStatement { 
        if(!this._blockBody)
            throw new Error("Function Body Is Not Yet Defined!");
        return this._blockBody; 
    } 
 
    defineBody(body: BoundBlockStatement): void 
    {
        if(this._blockBody)
            throw new Error("Function Body Is Already Defined!");

        this._blockBody = body;
    }
}

export class ParameterDeclaration
{
    constructor(public readonly name : string, 
        public readonly type : Type,
        public readonly variable : VariableSymbol)
    {
    }
}

export class BoundVariableDeclaration extends BoundStatement
{
    constructor(variable : VariableSymbol, initialiser : BoundExpression)
    {        
        super();
        this.variable = variable;
        this.initialiser = initialiser;
    }

    public get kind() { return BoundNodeKind.VariableDeclaration };
    public readonly variable : VariableSymbol; 
    public readonly initialiser : BoundExpression;
}

export class BoundIfStatement extends BoundStatement
{
    constructor(condition : BoundExpression, trueBranch : BoundStatement, falseBranch : BoundStatement | null)
    {        
        super();
        this.condition = condition;
        this.trueBranch = trueBranch;
        this.falseBranch = falseBranch;
    }

    public get kind() { return BoundNodeKind.IfStatement; };
    public readonly condition : BoundExpression; 
    public readonly trueBranch : BoundStatement;
    public readonly falseBranch : BoundStatement | null;
}

export class VariableSymbol
{
    constructor(name : string,        
        isReadOnly : boolean, 
        type : Type,
        isGlobal : boolean,
        isParameter: boolean = false)
    {
        this.name = name;
        this.isReadOnly = isReadOnly;
        this.type = type;
        this.isGlobal = isGlobal;
        this.isParameter = isParameter;
    }

    public readonly name : string;    
    public readonly isReadOnly : boolean; 
    public readonly type : Type;
    public readonly isGlobal : boolean;
    public readonly isParameter : boolean;
}

export class BoundExpressionStatement extends BoundStatement
{
    constructor(expression:BoundExpression)
    {
        super();
        this.expression = expression;
    }

    public get kind() : BoundNodeKind { return BoundNodeKind.ExpressionStatement; }
    public readonly expression : BoundExpression;
}

export class BoundReturnStatement extends BoundStatement
{
    constructor(public readonly expression:BoundExpression | null, public readonly span:TextSpan)
    {
        super();
        this.expression = expression;
    }

    public get kind() : BoundNodeKind { return BoundNodeKind.ReturnStatement; }    
}

export abstract class BoundLoopStatement extends BoundStatement
{
    constructor(breakLabel: BoundLabel, continueLabel : BoundLabel)
    {
        super();
        this.breakLabel = breakLabel;
        this.continueLabel = continueLabel;
    }

    public readonly breakLabel : BoundLabel;
    public readonly continueLabel : BoundLabel;
}

export class BoundForStatement extends BoundLoopStatement
{
    constructor(variable : VariableSymbol, lowerBound : BoundExpression, upperBound : BoundExpression, 
        body : BoundStatement, breakLabel: BoundLabel, continueLabel: BoundLabel)
    {
        super(breakLabel, continueLabel);
        this.variable = variable;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.body = body;
    }
    
    public get kind() : BoundNodeKind { return BoundNodeKind.ForStatement; }
    public readonly variable : VariableSymbol;
    public readonly lowerBound : BoundExpression;
    public readonly upperBound : BoundExpression
    public readonly body : BoundStatement;
}

export class BoundWhileStatement extends BoundLoopStatement
{
    constructor(condition : BoundExpression, body : BoundStatement, breakLabel: BoundLabel, continueLabel: BoundLabel)
    {        
        super(breakLabel, continueLabel);
        this.condition = condition;
        this.body = body;
    }

    public get kind() { return BoundNodeKind.WhileStatement; };
    public readonly condition : BoundExpression; 
    public readonly body : BoundStatement;
}

export class BoundVariableExpression extends BoundExpression
{    
    constructor(variable : Identifier)
    {
        super();
        this.variable = variable;
    }

    public readonly variable : Identifier;
    public get kind(): BoundNodeKind { return BoundNodeKind.VariableExpression; };
    public get type(): Type { return this.variable.type; }
}

export class BoundSetExpression extends BoundExpression
{    
    constructor(public readonly left : BoundExpression, public readonly right : BoundExpression)
    {
        super();
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.SetExpression; };
    public get type(): Type { return this.left.type; }
}

export class BoundGetExpression extends BoundExpression
{    
    constructor(public readonly left : BoundExpression, public type: Type, public readonly member : string)
    {
        super();
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.GetExpression; };
   // public get type(): Type { return this.left.type; }
}

export class BoundCallExpression extends BoundExpression 
{
    constructor(public readonly name : string,                 
                public readonly returnType : Type)
    {
        super();
    }

    public _callArguments : BoundExpression[] | undefined;
    public get callArguments() : BoundExpression[]
    {
        if(!this._callArguments)
            throw new Error("Call site details are Not Yet Defined!");
        return this._callArguments;
    }

    private _identifier : Identifier | undefined;
    public get identifier() : Identifier
    {
        if(!this._identifier)
            throw new Error("Call site details are Not Yet Defined!");

        return this._identifier;
    }

    public populate(identifier: Identifier, callArguments : BoundExpression[]) : void{
        if(this._identifier)
            throw new Error("Function details are Already Defined!");
            
        this._identifier = identifier;

        this._callArguments = callArguments;
    }

    public get hasErrors() : boolean
    {
        return (!this.identifier || !this.callArguments);
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.CallExpression; };
    public get type(): Type { return this.returnType; }
}

export class BoundAssignmentExpression extends BoundExpression 
{
    constructor(public readonly identifier : Identifier, 
                public readonly expression : BoundExpression)
    {
        super();
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.AssignmentExpression; };
    public get type(): Type { return this.expression.type; }
}

export class BoundClassDeclaration extends BoundStatement
{
    constructor(name : string, fields: BoundVariableDeclaration[], classes: BoundClassDeclaration[], members : BoundFunctionDeclaration[])
    {        
        super();
        this.name = name;
        this.fields = fields;
        this.classes = classes;
        this.members = members;
    }

    public get kind() { return BoundNodeKind.ClassDeclaration };
    public readonly name : string; 
    public readonly fields : BoundVariableDeclaration[];
    public readonly classes : BoundClassDeclaration[];
    public readonly members : BoundFunctionDeclaration[];
}

export class BoundStructDeclaration extends BoundStatement
{
    constructor(public readonly name:string, public readonly fields : BoundStructMemberDeclaration[])
    {
        super()
    }
    
    public get kind() { return BoundNodeKind.StructDeclaration; };
}

export class BoundStructMemberDeclaration extends BoundStatement
{
    constructor(public readonly name:string, public readonly type : Type)
    {
        super()
    }
    
    public get kind() { return BoundNodeKind.StructMemberDeclaration; };
}

export class BoundErrorExpression extends BoundExpression 
{
    public get kind(): BoundNodeKind { return BoundNodeKind.ErrorExpression; };
    public get type(): Type { return PredefinedValueTypes.Error; }    
}

export class BoundLabel
{
    private static labelId:number=0;

    constructor(name: string)
    {
        this.id = BoundLabel.labelId++;
        this.name = name;
    }

    public readonly id : number;
    public readonly name : string;
}

export class BoundLabelStatement extends BoundStatement
{
    constructor(label : BoundLabel)
    {
        super();
        this.label = label;
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.LabelStatement; }
    public readonly label : BoundLabel;
}

export class BoundGotoStatement extends BoundStatement
{
    constructor(label : BoundLabel)
    {
        super();
        this.label = label;
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.GotoStatement; }
    public readonly label : BoundLabel;
}

export class BoundConditionalGotoStatement extends BoundStatement
{
    constructor(label : BoundLabel, condition : BoundExpression, jumpIfTrue: boolean = true)
    {
        super();
        this.label = label;
        this.condition = condition;
        this.jumpIfTrue = jumpIfTrue;
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.ConditionalGotoStatement; }
    public readonly label: BoundLabel;
    public readonly condition: BoundExpression;
    public readonly jumpIfTrue : boolean;
}

export class BoundConversionExpression extends BoundExpression
{
    public constructor(
        public readonly type : Type, 
        public readonly expression : BoundExpression)
    {
        super();
    }

    public get kind(): BoundNodeKind { return BoundNodeKind.ConversionExpression; }
}