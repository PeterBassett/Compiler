import { BoundGlobalScope, BoundFunctionDeclaration, ParameterDeclaration, BoundStatement, BoundNodeKind, BoundLiteralExpression, BoundExpressionStatement, BoundExpression, BoundBinaryExpression, BoundUnaryExpression, BoundReturnStatement, BoundBinaryOperatorKind, BoundUnaryOperatorKind } from "../../Binding/BoundNode";
import GeneratedCode from "../AssemblyLanguage/GeneratedCode";
import * as WasmConsts from "./Opcodes";
import * as Encoding from "./LEBencoding";
import { Type } from "../../../Types/TypeInformation";
import { ValueType } from "../../../Types/ValueType";

export default class WasmCodeGenerator
{
    generate(boundTree: BoundGlobalScope) : Uint8Array 
    {
        const typeSection = this.encodeSection(
            WasmConsts.Sections.Type,
            boundTree.functions.map( f => this.encodeFunctionProtoType( f.parameters, f.returnType ) )            
        );
  
        const functionSection = this.encodeSection(
            WasmConsts.Sections.Function,
            [boundTree.functions.map((_, index) => index)]
        );

        const exportSection = this.encodeSection(
            WasmConsts.Sections.Export,
            [    
                [...Encoding.encodeString("main"),
                WasmConsts.ExternalKind.Function,
                boundTree.functions.findIndex((f) => f.identifier === "main")]
            ]
        );

        const codeSection = this.encodeSection(
            WasmConsts.Sections.Code,
            boundTree.functions.map(a => this.emitFunctionDefinition(a))
        );

        return Uint8Array.from([
            ...WasmConsts.MagicAsmHeader,
            ...WasmConsts.Version,
            ...typeSection,
            ...functionSection,
            ...exportSection,
            ...codeSection
        ]);
    }

    mapTypeToWasmType(type:Type) : WasmConsts.Types
    {
        switch(type.type)
        {
            case ValueType.Byte:
            case ValueType.Int:
            case ValueType.Pointer:
                return WasmConsts.Types.i32;
            case ValueType.Float:
                return WasmConsts.Types.f64;                    
            default:
                throw new Error("Unsupported Type");
        }
    }
    
    encodeFunctionProtoType(parameters:ParameterDeclaration[], returnType: Type) : number[]
    {
        const paramTypes = parameters.map( p => this.mapTypeToWasmType(p.type) );

        //https://www.wasm.com.cn/docs/binary-encoding/#func_type
        return [
            WasmConsts.Types.func,
            ...Encoding.encodeVector(paramTypes),
            ...Encoding.encodeVector([this.mapTypeToWasmType(returnType)])
        ];        
    }
    
    encodeSection(sectionType: WasmConsts.Sections, data: any[][]) :number[] 
    {
        return [
            sectionType,
            ...Encoding.encodeVector(Encoding.encodeArrays(data))
        ];
    }

    emitFunctionDefinition(functionDeclaration: BoundFunctionDeclaration): any {
        const locals :number[]= []; //localCount > 0 ? [encodeLocal(localCount, Valtype.f32)] : [];
      
        const code = this.emitStatements(functionDeclaration.blockBody.statements);

        const localCount = 0; // no local variables at this time
        
        return Encoding.encodeVector([...Encoding.encodeVector(locals), ...code, WasmConsts.ControlFlow.end]);
    }

    emitStatements(statements: BoundStatement[]) : number [] 
    {
        const code :number [] = [];
        for(let statement of statements)
            code.push(...this.emitStatement(statement));

        return code;
    }

    emitStatement(statement: BoundStatement) : number[] 
    {
        const code : number [] = [];
        switch(statement.kind)
        {
            case BoundNodeKind.ExpressionStatement:
            {
                const expression = (statement as BoundExpressionStatement).expression;
                return this.emitExpression(expression);
            }
            case BoundNodeKind.ReturnStatement:
            {
                const returnStatement = statement as BoundReturnStatement;                
                returnStatement.expression

                return [
                    ...(!!returnStatement.expression ? this.emitExpression(returnStatement.expression) : []),
                    WasmConsts.ControlFlow.return
                ];
            } 
        }

        return [];
    }

    emitExpression(expression: BoundExpression): number[] 
    {
        switch(expression.kind)
        {
            case BoundNodeKind.LiteralExpression:
                return this.emitLiteralExpression(expression as BoundLiteralExpression);
            case BoundNodeKind.BinaryExpression:
                return this.emitBinaryExpression(expression as BoundBinaryExpression);
            case BoundNodeKind.UnaryExpression:
                return this.emitUnaryExpression(expression as BoundUnaryExpression);            
        }

        return [];
    }

    emitLiteralExpression(expression: BoundLiteralExpression): number[] 
    {
        switch(expression.type.type)
        {
            case ValueType.Boolean:
            case ValueType.Byte:
            case ValueType.Int:
                return [
                    WasmConsts.Opcodes.i32_const,
                    ...Encoding.encodeSignedLEB128(expression.value)
                ];
            case ValueType.Float:
                return [
                    WasmConsts.Opcodes.f64_const,
                    ...Encoding.encodeFloat64(expression.value)
                ];                
        }        

        return [];
    }

    emitBinaryExpression(expression: BoundBinaryExpression): number[] 
    {
        const code :number[] = [];

        const type = expression.left.type;
        code.push(...this.emitExpression(expression.left));
        code.push(...this.emitExpression(expression.right));

        if(type.type === ValueType.Int)
        {
            switch(expression.operator.operatorKind)
            {
                case BoundBinaryOperatorKind.Addition:
                    code.push(WasmConsts.Opcodes.i32_add);
                    break;
                case BoundBinaryOperatorKind.Subtraction:
                    code.push(WasmConsts.Opcodes.i32_sub);
                    break;
                case BoundBinaryOperatorKind.Multiplication:
                    code.push(WasmConsts.Opcodes.i32_mul);
                    break;
                case BoundBinaryOperatorKind.Division:
                    code.push(WasmConsts.Opcodes.i32_div_s);                    
                    break;
            }
        }
        if(type.type === ValueType.Float)
        {
            switch(expression.operator.operatorKind)
            {
                case BoundBinaryOperatorKind.Addition:
                    code.push(WasmConsts.Opcodes.f64_add);
                    break;
                case BoundBinaryOperatorKind.Subtraction:
                    code.push(WasmConsts.Opcodes.f64_sub);
                    break;
                case BoundBinaryOperatorKind.Multiplication:
                    code.push(WasmConsts.Opcodes.f64_mul);
                    break;
                case BoundBinaryOperatorKind.Multiplication:
                    code.push(WasmConsts.Opcodes.f64_div);
                    break;                    
            }
        }

        return code;
    }

    emitUnaryExpression(expression: BoundUnaryExpression): number[] 
    {
        const type = expression.operand.type;
        const code : number [] = [];

        code.push(...this.emitExpression(expression.operand));

        if(type.type === ValueType.Int)
        {
            switch(expression.operator.operatorKind)
            {
                case BoundUnaryOperatorKind.Identity:
                    break;
                //case BoundUnaryOperatorKind.Negation:
                  //  code.push(WasmConsts.Opcodes.i32_n);
                    //break;
            }
        }
        
        if(type.type === ValueType.Float)
        {
            switch(expression.operator.operatorKind)
            {
                case BoundUnaryOperatorKind.Identity:
                    break;
                //case BoundUnaryOperatorKind.Negation:
                  //  code.push(WasmConsts.Opcodes.i32_n);
                    //break;
            }
        }

        return code;
    }
}