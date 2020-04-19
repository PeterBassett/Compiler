import TextSpan from "../Syntax/Text/TextSpan";
import { SyntaxType } from "../Syntax/SyntaxType";
import SourceText from "../Syntax/Text/SourceText";
import { Type } from "../../Types/TypeInformation";
import { ValueType } from "../../Types/ValueType";
import Token from "../Syntax/Token";
import { BoundFunctionDeclaration } from "../Binding/BoundNode";

export enum DiagnosticType {
    UnexpectedCharacter,
    UnexpectedToken,
    InvalidFunctionDefinition,
    InvalidStatementExpressionType,
    CompilerError,
    InvalidTypeName,
    UnterminatedComment,
    VariableAlreadyDeclaredInScope,
    CannotConvertType,
    UndefinedBinaryOperator,
    UndefinedUnaryOperator,
    UndefinedName,
    IncorrectArgumentCount,
    CannotConvertParameter,
    NotAssignableToType,
    FunctionReturnsVoid,
    ExpressionConvertableToTypeRequired,
    InvalidBreakOrContinue,
    ExpectedClassType,
    EntryPointNotFound,
    NotAllPathsReturn,
    DuplicateStructMember,
    UndefinedStructMember,
    AssignmentRequiresLValue,
    NonConstantArrayBound,
    InvalidArrayBound,
    InvalidIndexing,
    InvalidArrayIndexType,
    NegativeArrayIndex
}

export class Diagnostic
{
    private readonly _message : string;
    private readonly _type : DiagnosticType;
    private readonly _span : TextSpan;

    constructor(message:string, type: DiagnosticType, span:TextSpan)
    {
        this._message = message;
        this._type = type;
        this._span = span;        
    }

    public get message() {
        return this._message;
    }

    public get type() {
        return this._type;
    }

    public get span()
    {
        return this._span;
    }
}

export class Diagnostics
{
    private readonly _diagnostics : Diagnostic[];
    private readonly _source : SourceText;

    constructor(source : SourceText, diagnostics? : Diagnostics)
    {
        this._diagnostics = [];

        if(!!diagnostics)
        {
            this._diagnostics = [...diagnostics._diagnostics];
        }

        this._source = source;
    }

    public report(message:string, type:DiagnosticType, span:TextSpan):void{
        this._diagnostics.push(new Diagnostic(message, type, span));
    }
    
    public reportUnexpectedCharacter(character: string, position: number): void {
        this.report(`Bad character in input : ${character}`, DiagnosticType.UnexpectedCharacter, new TextSpan(position, 1));
    }

    public reportInvalidFunctionDefinition(name: Token, funcKeyword : Token, current : Token): void {
        this.report(`Invalid Function Definition in ${name.lexeme}. Expected type or lambda fat arrow. Found ${current.lexeme}.`, DiagnosticType.InvalidFunctionDefinition, new TextSpan(current.position, 1));
    }
    
    public reportUnexpectedToken(expected: SyntaxType | SyntaxType[], found: SyntaxType, span: TextSpan): void {
        if ((<SyntaxType[]>expected).length !== undefined) {
            let e = expected as SyntaxType[];   
            let expectedList = e.map( i=> SyntaxType[i].toString() ).join(", ");
            this.report(`Unexpected Token ${SyntaxType[found]}. Expected any of [${expectedList}].`, DiagnosticType.UnexpectedToken, span);  
        }
        else
        {
            let e = expected as SyntaxType;  
            this.report(`Unexpected Token ${SyntaxType[found]}. Expected ${SyntaxType[e]}.`, DiagnosticType.UnexpectedToken, span);  
        }
    }    

    public reportUnexpectedStatementExpression(span : TextSpan): void {
        this.report(`Only assignment, call, increment and decrement can be used as a statement`, DiagnosticType.InvalidStatementExpressionType, span);
    }
    
    public reportInvalidTypeName(foundToken: Token): void {
        this.report(`Found unexpected token ${foundToken.lexeme} type ${SyntaxType[foundToken.kind]}. Expected a predefined or user defined typename.`, DiagnosticType.InvalidTypeName, foundToken.span);
    }
    
    public reportUnterminatedComment(start:number, position:number): void {
        this.report(`Found unterminated multiline comment.`, DiagnosticType.UnterminatedComment, new TextSpan(start, position - start));
    }
    
    public reportVariableAlreadyDeclared(span: TextSpan, name: string): void {
        this.report(`Variable '${name}' is already declared.`, DiagnosticType.VariableAlreadyDeclaredInScope, span);
    }

    public reportCannotConvert(span: TextSpan, fromType: Type, targetType: Type): void {        
        this.report(`Cannot convert type '${fromType.name}' to '${targetType.name}'`, DiagnosticType.CannotConvertType, span);
    }        
 
    public reportCannotConvertImplicitly(span: TextSpan, fromType: Type, targetType: Type) {
        this.report(`Cannot implicitly convert type '${fromType.name}' to '${targetType.name}'`, DiagnosticType.CannotConvertType, span);
    }

    public reportUndefinedBinaryOperator(span: TextSpan, operator: string, leftType: Type, rightType: Type): void {
        this.report(`Binary operator '${operator}' is not defined for types '${leftType.name}' and '${rightType.name}'.`, DiagnosticType.UndefinedBinaryOperator, span);
    }

    public reportUndefinedUnaryOperator(span: TextSpan, operator: string, type: Type): void {
        this.report(`Unary operator '${operator}' is not defined for types '${type}.`, DiagnosticType.UndefinedUnaryOperator, span);
    }    

    public reportUndefinedName(span: TextSpan, name: string): void {
        this.report(`Name '${name}' does not exist.`, DiagnosticType.UndefinedName, span);
    }

    public reportIncorrectArgumentCount(expectedParameterCount: number, callsiteParameterCount: number, span: TextSpan): void {
        this.report(`Expected ${expectedParameterCount} arguments, but got ${callsiteParameterCount}.`, DiagnosticType.IncorrectArgumentCount, span);
    }

    public reportCannotConvertParameter(expectedType: Type, usedType: Type, span: TextSpan): void 
    {    
        this.report(`Argument of type '${usedType.name}' is not assignable to parameter of type '${expectedType.name}'.`, DiagnosticType.CannotConvertParameter, span);
    }        
    
    public reportNotAssignableToType(source: Type, destination: Type, span: TextSpan): void 
    {
        this.report(`Type '${source.name} is not assignable to type '${destination.name}'.`, DiagnosticType.NotAssignableToType, span);
    }
    
    public reportFunctionReturnsVoid(functionName: string, span: TextSpan): void {
        this.report(`Since '${functionName}' returns void, a return keywork must not be followed by an expression.`, DiagnosticType.FunctionReturnsVoid, span);
    }
    
    public reportExpressionConvertableToTypeRequired(returnType: Type, span: TextSpan): void {
        this.report(`An expression convertable to '${returnType.name}' is required.`, DiagnosticType.ExpressionConvertableToTypeRequired, span);
    }

    public reportInvalidBreakOrContinue(span: TextSpan, lexeme: string) : void {
        this.report(`The keyword '${lexeme}' can only be used inside of loops.`, DiagnosticType.InvalidBreakOrContinue, span);
    }

    public reportExpectedClass(span: TextSpan, lexeme:string) : void {
        this.report(`expression to the left does not exavluate to a class type. '${lexeme}'.`, DiagnosticType.ExpectedClassType, span);
    }

    public reportEntryPointNotFound(entryPoint: string) : void {
        this.report(`Program entry point '${entryPoint}' not found.`, DiagnosticType.EntryPointNotFound, TextSpan.Empty);
    }

    public reportAllPathsMustReturn(func: BoundFunctionDeclaration) : void {
        this.report(`Not all code paths return a value in function ${func.identifier}.`, DiagnosticType.NotAllPathsReturn, TextSpan.Empty);
    }
    
    public reportUnsupportedType(type: ValueType) : void {
        throw new Error("Method not implemented.");
    }

    public reportDuplicateStructMember(structName: string, membername: string, span:TextSpan)
    {
        this.report(`Struct ${structName} contains duplicate member ${membername}.`, DiagnosticType.DuplicateStructMember, span);
    }

    public reportUndefinedStructMember(structName: string, memberName: string, span: TextSpan) 
    {
        this.report(`Member ${memberName} does not exist on struct ${structName}.`, DiagnosticType.UndefinedStructMember, span);
    }

    public reportAssignmentRequiresLValue(kind: string, span: TextSpan) : void {        
        this.report(`lvalue required as left operand of assignment, found ${kind}`, DiagnosticType.AssignmentRequiresLValue, span);
    }

    public reportNonConstantArrayBound(arrayName: string, span: TextSpan) : void 
    {
        this.report(`non-constant array bound ${arrayName}`, DiagnosticType.NonConstantArrayBound, span);
    }

    public reportInvalidArrayBound(arrayName: string, span: TextSpan) : void
    {
        this.report(`invalid array bound ${arrayName}`, DiagnosticType.InvalidArrayBound, span);
    }

    public reportNegativeArrayIndex(span: TextSpan) : void
    {
        this.report(`invalid array index, index must be non-negative`, DiagnosticType.NegativeArrayIndex, span);
    }    

    public reportInvalidArrayIndexType(span: TextSpan) : void
    {
        this.report(`non-integer array index`, DiagnosticType.InvalidArrayIndexType, span);
    }

    public reportInvalidIndexing(type: Type, span: TextSpan) : void 
    {
        this.report(`type ${type.name} does not support indexing`, DiagnosticType.InvalidIndexing, span);
    }            

    public get text() : SourceText
    {
        return this._source;
    }

    public get length()
    {
        return this._diagnostics.length;
    }

    public get(index:number) : Diagnostic
    {
        return this._diagnostics[index];
    }

    public map<T>(callback: (diagnostic: Diagnostic, indexInArray: number) => T): T[]
    {
        let output : T[] = [];
        
        for(let i = 0; i < this.length; i++)
        {
            output.push(callback(this._diagnostics[i], i));
        }

        return output;
    }
}