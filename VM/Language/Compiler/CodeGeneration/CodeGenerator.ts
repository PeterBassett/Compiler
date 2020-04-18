import * as Nodes from "../Binding/BoundNode";
import { ValueType, ValueTypeNameMap } from "../../Types/ValueType";
import { Diagnostics } from "../Diagnostics/Diagnostics";
import { StructDeclarationStatementSyntax, IfStatementSyntax } from "../Syntax/AST/ASTNode";
import GeneratedCode from "./GeneratedCode";
import Stack from "../../../misc/Stack";
import BuiltinFunctions from "../BuiltinFunctions";
import { Type } from "../../Types/TypeInformation";
import { Value } from "../../Scope/ExecutionScope";
import { Identifier } from "../../Scope/DefinitionScope";
import { isPredefinedType } from "../Syntax/SyntaxFacts";
import TextSpan from "../Syntax/Text/TextSpan";

enum VarOrParam
{
    Variable,
    Parameter
}

export default class CodeGenerator
{
    private functionName! : string;
    private diagnostics! : Diagnostics;    
    private sections : string[][] = [];
    private lines : string[] = [];
    private stackIndex : number = 0;
    private variableMap! : Stack< { [index:string] : { offset:number, size:number, varOrParam : VarOrParam } } >;
    private labelCount:number = 0;
    private globalLiterals : { name :string, type: ValueType, value : any }[] = [];

    private dataSection = 0;
    private entrySection = 0;
    private initSection = 0;
    private codeSection = 0;
    
    private readonly stackOffset : number = 8;
    
    private readonly writeComments : boolean;
    private readonly writeBlankLines : boolean;
    private readonly optimiseForSize: boolean;

    private _builtins : BuiltinFunctions;

    constructor(options? : {
        builtins? : BuiltinFunctions, 
        comments?:boolean, 
        blankLines?:boolean,
        optimiseForSize?:boolean
    })
    {
        this.writeComments = false;
        this.writeBlankLines = false;
        this.optimiseForSize = false;

        this._builtins = options && options.builtins || new BuiltinFunctions();

        if(options)
        {            
            this.writeComments = options.comments || this.writeComments;
            this.writeBlankLines = options.blankLines || this.writeBlankLines;
            this.optimiseForSize = options.optimiseForSize || this.optimiseForSize;
        }
    }

    public generate(root : Nodes.BoundGlobalScope) : GeneratedCode
    {
        this.dataSection = this.codeSection = this.initSection = this.entrySection = 0;;

        this.stackIndex = 0;
        this.variableMap = new Stack<{ [index:string] : { offset:number, size:number, varOrParam : VarOrParam } }>();
        this.lines = [];  
        this.globalLiterals =[];  
        this.labelCount = 0;
        this.diagnostics = new Diagnostics(root.diagnostics.text, root.diagnostics);

        this.createSections();
        this.writeGlobalVariables(root.variables);
        this.writeInitialisation();
        this.writeFunctions(root.functionMap);

        let lines = this.join()
        return new GeneratedCode(lines, this.diagnostics);
    }

    createSections() : void 
    {
        this.dataSection = this.sections.push([]) - 1;
        this.entrySection = this.sections.push([]) - 1;
        this.initSection = this.sections.push([]) - 1;
        this.codeSection = this.sections.push([]) - 1;
    }

    setCurrentSection(section: number) {
        this.lines = this.sections[section];
    }

    writeInitialisation() : void 
    {
        this.setCurrentSection(this.entrySection);

        this.lines.push(".text");
        this.lines.push(".global __entrypoint:");
        this.label("__entrypoint");

        this.setCurrentSection(this.codeSection);

        this.instruction("MOV R6 SP", "Initialise Base Pointer");
        this.instruction("CALL main:")
        this.instruction("HALT")
    }

    join() : string[]
    {
        let lines : string[] = [];

        for(let section of this.sections)
            lines = [...lines, ...section];

        return lines;
    }

    writeGlobalVariables(variables: Nodes.BoundVariableDeclaration[]) 
    {
        this.setCurrentSection(this.dataSection);

        this.lines.push(".data");    
        
        variables.forEach(v => 
        {
            if(!v.initialiser)
                throw new Error("Global variables should always have an initialiser");
                
            const expression = v.initialiser!;
            const valueType = v.variable.type.type;
        
            if(expression.kind == Nodes.BoundNodeKind.LiteralExpression)
            {                
                let exp = expression as Nodes.BoundLiteralExpression;           
                this.data(valueType, v.variable.name, exp.value, `Global variable Declaration for ${v.variable.name}`);
            }            
            else
            {
                this.setCurrentSection(this.dataSection);
                this.data(valueType, v.variable.name, 0, `Global variable Declaration for ${v.variable.name}`);

                this.setCurrentSection(this.initSection);
                this.writeExpression(expression);                
                const str = this.typedMnemonic(valueType, "STR");
                this.instruction(`${str} R1 .${v.variable.name}`, "Initialise global variable");
            }            
        });
    }

    writeFunctions(functionMap: { [index: string]: Nodes.BoundFunctionDeclaration; }) 
    {
        let main = functionMap["main"];

        if(!main)
            this.diagnostics.reportEntryPointNotFound("main");
        else
            this.writeFunction(main);             

        let functionNames = Object.keys(functionMap);

        let functions = functionNames.filter( n => n != "main" ).map( n => functionMap[n] );

        functions.forEach( f => this.writeFunction(f) );
    }

    pushVariableMap() {
        let current = {};

        if(this.variableMap.length > 0)
        {
            let top = this.variableMap.peek();

            current = {...top};
        }

        this.variableMap.push(current);
    }

    popVariableMap() {    
        const level = this.variableMap.peek();
        let size = Object.keys(level).reduce(
            (prev, curr) => {
                let l = level[curr];
                if(l.varOrParam === VarOrParam.Parameter)
                    return prev;

                return prev + l.size;
            }, 0
        );
        this.variableMap.pop();        
        this.stackIndex -= size;
    }

    writeFunction(func: Nodes.BoundFunctionDeclaration) {
        this.functionName = func.identifier;
        this.blankLine();
        this.label(func.identifier);
            
        this.writeStackFramePrelude();
        this.pushVariableMap();

        let offset = 0;
        func.parameters.forEach( p => {
            const size = this.typeSize(p.type);
            this.variableMap.peek()[p.name] = { offset:offset, size:size, varOrParam : VarOrParam.Parameter };            
            offset += size;
        });
        
        this.writeStatement(func.blockBody);
        this.writeStackFrameEpilogue(func.identifier);
        this.popVariableMap();               
    }

    writeStatement(statement: Nodes.BoundStatement) {
        switch(statement.kind)
        {   
            case Nodes.BoundNodeKind.BlockStatement:
            {
                let stmt = statement as Nodes.BoundBlockStatement;            

                if(stmt.statements.length > 0)
                {                  
                    const variables = stmt.statements.filter( s => s.kind == Nodes.BoundNodeKind.VariableDeclaration );

                    this.writeVariableDeclarations(variables);

                    for(let i = variables.length; i < stmt.statements.length; i++)
                    {
                        this.writeStatement(stmt.statements[i]);
                    }
                }                    
                break;
            }         
            case Nodes.BoundNodeKind.ReturnStatement:
            {
                let stmt = statement as Nodes.BoundReturnStatement;            

                if(stmt.expression)
                    this.writeReturnStatement(stmt.expression);                

                this.writeJumpToStackFrameEpilogue(this.functionName);
                      
                break;
            }
            case Nodes.BoundNodeKind.LabelStatement:
            {
                let stmt = statement as Nodes.BoundLabelStatement;            
                this.label(stmt.label.name);
                break;
            }
            case Nodes.BoundNodeKind.GotoStatement:
            {
                let stmt = statement as Nodes.BoundLabelStatement;            
                this.instruction("JMP " + stmt.label.name + ":");
                break;
            }
            case Nodes.BoundNodeKind.ConditionalGotoStatement :
            {
                let stmt = statement as Nodes.BoundConditionalGotoStatement;            
                this.writeExpression(stmt.condition);                
                this.instruction("CMPZ R1", "Conditional Goto");                

                if(stmt.jumpIfTrue)
                    this.instruction(`JNE ${stmt.label.name}:`);
                else
                    this.instruction(`JEQ ${stmt.label.name}:`);
                    
                break;
            }
            case Nodes.BoundNodeKind.ExpressionStatement:
            {
                let stmt = statement as Nodes.BoundExpressionStatement;
                this.writeExpression(stmt.expression);
                break;
            }
            case Nodes.BoundNodeKind.VariableDeclaration:
            {
                throw new Error("Not expecting unhandled Variable Declarations.");
            }    
            case Nodes.BoundNodeKind.AssignmentStatement:
            {
                this.writeAssignmentStatement(statement as Nodes.BoundAssignmentStatement);                 
                break;
            }
            default:
            {
                throw new Error(`Unexpected Statement Type ${statement.kind}`);
            }
        }
    }
    
    writeVariableDeclarations(variables: Nodes.BoundStatement[]) 
    {
        if(variables.length === 0)
            return;
            
        let totalSize = 0;

        for(let statement of variables)
        {
            const stmt = statement as Nodes.BoundVariableDeclaration; 
            const valueType = stmt.variable.type.type; 

            const size = this.typeSize(stmt.variable.type);
            this.variableMap.peek()[stmt.variable.name] = { offset:this.stackIndex, size:size, varOrParam : VarOrParam.Variable };
            this.stackIndex += size;
            totalSize += size;

            this.comment(`declare variable ${stmt.variable.name} of type ${stmt.variable.type.name} (${size} bytes)`);                            
            
            if(valueType === ValueType.Struct)
                this.writeStructComment(stmt);
            
            if(valueType === ValueType.Array)
                this.writeArrayComment(stmt);
        }
    
        const plural = variables.length == 1 ? "" : "s";
        this.instruction(`SUB SP ${totalSize}`, `reserve ${totalSize} bytes space on stack for ${variables.length} variable${plural}`); 
    }

    private writeAssignmentStatement(statement: Nodes.BoundAssignmentStatement) 
    {
        this.comment("-----------------------------");

        if(statement.target.type.type == ValueType.Struct)
        {
            this.comment("Assign a struct");
            const source = this.getStructDataReference(statement.expression);

            this.writeAddressExpression(statement.target);
            
            const size = this.typeSize(statement.target.type);

            const dest = (i: number, _: number) => `[R1+${i}]`;
            this.emitStackCopy(dest, source, size);
        }
        else
        {            
            this.comment("Assignment a non struct value");
            this.writeExpression(statement.expression);
            
            const push = this.typedMnemonic(statement.target.type.type, "PUSH");
            this.instruction(`${push} R1`, "Push value to assign to stack");
            this.writeAddressExpression(statement.target);

            const pop = this.typedMnemonic(statement.target.type.type, "POP");
            this.instruction(`${pop} R2`, "Pop value to assign to R2");

            const mov = this.typedMnemonic(statement.target.type.type, "MOV");
            //if(!statement.expression.type.isPointer)
                this.instruction(`${mov} [R1] R2`, "Copy value in R2 to address in R1");
            //else
            //    this.instruction(`${mov} [R1] [R2]`, "Copy value at address in R2 to address in R1");
        }

        this.comment("Assignment Complete");
        this.comment("-----------------------------");
    }

    // move the address of some lvalue into R1
    writeAddressExpression(expression: Nodes.BoundExpression) 
    {
        switch (expression.kind)
        {
            case Nodes.BoundNodeKind.VariableExpression: 
            {
                const variable = expression as Nodes.BoundVariableExpression;
                const address = this.getDataReference(variable.variable, false);
                this.instruction(`MOV R1, ${address(0,0)}`, `address of variable ${variable.variable.name}`);       
                break;           
            }
            case Nodes.BoundNodeKind.DereferenceExpression: 
            {
                const deref = expression as Nodes.BoundDereferenceExpression;
                this.writeAddressExpression(deref.operand);
                this.instruction("MOV R1, [R1]", `Dereference pointer`);
                break;
            }
            case Nodes.BoundNodeKind.GetExpression:
            {
                this.comment("------------------------------------------");
                this.comment("GetExpression");
                const target = expression as Nodes.BoundGetExpression;
                this.writeAddressExpression(target.left);
                                
                const member = this.structMember(target.left.type, [target.member]);

                if(member.offset > 0)
                {
                    //
                    this.comment(`Reference struct member ${target.member}`);
                    this.instruction(`MVI R2 ${member.offset}`, `Member at ${member.offset} bytes`);
                    this.instruction(`ADD R1 R2`, "add offset");
                }
                this.comment("------------------------------------------");                
                break;
            }
            case Nodes.BoundNodeKind.ArrayIndex:
            {
                this.comment("------------------------------------------");
                this.comment("ArrayIndex");
                const target = expression as Nodes.BoundArrayIndexExpression;
                this.writeExpression(target.index);
                const elementSize = this.typeSize(target.type);
                this.instruction(`MUL R1 ${elementSize}`, "Multiply index by size of element");
                this.instruction("PUSH R1", "Push index for later use");
                this.writeAddressExpression(target.left);

                this.instruction("POP R2", "Pop index for use");
                this.comment("Index into the array");
                this.instruction("ADD R1 R2");

                this.comment("R1 now contains the address of the indexed element");
                break;
            }
            default:
                throw new Error("Not an lvalue");
        }
    }

    private writeArrayComment(stmt: Nodes.BoundVariableDeclaration)
    {
        if (this.writeComments) 
        {
            this.comment("array " + stmt.variable.type.name);
        }
    }

    private writeStructComment(stmt: Nodes.BoundVariableDeclaration) 
    {
        if (this.writeComments) 
        {
            this.comment("struct " + stmt.variable.type.name);
            this.comment("{");
            for (let field of stmt.variable.type.structDetails!.fields) {
                const member = this.structMember(stmt.variable.type, [field.name]);
                const memberSize = this.typeSize(member.type);
                this.comment("\t" + field.name + " : " + field.type.name + "; \t // at [R6-" + member.offset + "]");
            }
            this.comment("}");
        }
    }

    writeReturnStatement(expression: Nodes.BoundExpression) 
    {    
        if(expression.type.isStruct)
        {
            // we are returning a struct, ok. lets copy to the address stored in R3
            const size = this.typeSize(expression.type);
            const dest = (i: number, _: number) => `[R3+${i}]`;
            const source = this.getStructDataReference(expression);
            this.emitStackCopy(dest, source, size);
        }
        else
            this.writeExpression(expression);
    }

    zeroStackbytes(size: number) 
    {        
        let remaining = size;

        while(remaining > 0)
        {
            let inst = `MOVf`;
            let chunk = 8;

            if(remaining < chunk)
            {
                inst = `MOV`
                chunk = 4;
            }

            if(remaining < chunk)
            {
                inst = `MOVw`
                chunk = 2;
            }

            if(remaining < chunk)
            {
                inst = `MOVb`                            
                chunk = 1;
            }

            this.instruction(`${inst} [SP+${size - remaining}] 0`, `initialise ${chunk} byte${chunk > 1 ? "s" : ""} on stack`); 
            remaining -= chunk;
        }
    }

    emitStackCopy(to:(offset:number, size:number)=>string, from:(offset:number, size:number)=>string, size: number) 
    {        
        let remaining = size;

        while(remaining > 0)
        {
            let inst = `MOVf`;
            let chunk = 8;

            if(remaining < chunk)
            {
                inst = `MOV`
                chunk = 4;
            }

            if(remaining < chunk)
            {
                inst = `MOVw`
                chunk = 2;
            }

            if(remaining < chunk)
            {
                inst = `MOVb`                            
                chunk = 1;
            }

            this.instruction(`${inst} ${to(size - remaining, chunk)} ${from(size - remaining, chunk)}`); 
            remaining -= chunk;
        }
    }
    
    popDeclaredVariables() {
        this.instruction("MOV SP R6", "unwind the stack for variables declared in this function");
    }
    
    private typeSizeCache : { [index:number] : number } = {};

    typeSize(type : Type) : number {

        if(type.isPointer)
        {
            // pointers require 4 bytes for storage
            return 4;
        }

        switch(type.type)
        {
            case ValueType.Pointer :
            case ValueType.Int :
                return 4;
            case ValueType.Float :
                return 8;
            case ValueType.Boolean :
                return 1;
            case ValueType.Struct :
            {
                if(!this.typeSizeCache[type.typeid])
                    this.typeSizeCache[type.typeid] = this.structSize(type);
                
                return this.typeSizeCache[type.typeid];
            }
            case ValueType.Array:
            {
                if(this.typeSizeCache[type.typeid])
                    return this.typeSizeCache[type.typeid];

                const elementSize = this.typeSize(type.elementType!);
                const size = type.arrayLength! * elementSize;
                
                this.typeSizeCache[type.typeid] = size;
                
                return this.typeSizeCache[type.typeid];
            }
            default : 
                this.diagnostics.reportUnsupportedType(type.type);
                return 4;                       
        }
    }

    structSize(type: Type): number 
    {
        let size = 0;

        let fields = type.structDetails!.fields;

        for(let field of fields)
        {
            size += this.typeSize(field.type);
        }

        return size;
    }

    structMember(type:Type, memberPath:string[]) : { type: Type, offset : number} {
        let offset = 0;

        while(type.pointerToType)
            type = type.pointerToType;

        for(let field of type.structDetails!.fields)
        {
            if(field.name == memberPath[0])
            {
                if(field.type.type === ValueType.Struct && memberPath.length > 1)                 
                {
                    const result = this.structMember(field.type, memberPath.slice(1));

                    return {
                        type : result.type,
                        offset : offset + result.offset
                    };
                }

                return {
                    type : field.type,
                    offset
                };
            }

            offset += this.typeSize(field.type);
        }
    
        throw new Error(`Member not found on struct ${type.name}`);
    }

    mnemonicForType(type: ValueType) : string
    {
        switch(type) {
            case ValueType.Boolean:
                return "byte";
            case ValueType.Pointer:
            case ValueType.Int:
                return "long";
            case ValueType.Float:
                return "float";
            case ValueType.String:
                return "string";
            default:
                this.diagnostics.reportUnsupportedType(type);
                return "INVALIDTYPE_" + ValueTypeNameMap[type];
        }
    }

    typedMnemonic(type: ValueType, op : string) : string
    {
        switch(type) {
            case ValueType.Boolean:
                return op + "b";
            case ValueType.Pointer:
            case ValueType.Null:
            case ValueType.Struct:
            case ValueType.Array:
            case ValueType.Int:
                return op;
            case ValueType.Float:
                return op + "f";
            default                                     :
                this.diagnostics.reportUnsupportedType(type);
                return op;
        }
    }

    writeExpression(expression: Nodes.BoundExpression) {
        switch(expression.kind)
        {    
            case Nodes.BoundNodeKind.GetExpression:
            {
                let exp = expression as Nodes.BoundGetExpression;                

                this.writeAddressExpression(expression);
                
                if(exp.type.type != ValueType.Struct)
                {                    
                    const mov = this.typedMnemonic(exp.type.type, "MOV");
                    this.instruction(`${mov} R1 [R1]`, "dereference struct member");
                }
                else
                {
                    throw new Error("Unexpected type for Get Expression");
                }
                break;
            }
            case Nodes.BoundNodeKind.LiteralExpression:
            {
                let exp = expression as Nodes.BoundLiteralExpression;           
                let mvi = "";
                
                if(exp.type.type !== ValueType.Struct)
                    mvi = this.typedMnemonic(exp.type.type, "MVI");

                const hannah = "beautiful"; // PB: LEAVE IN PLACE. IT DOESNT WORK WITHOUT THIS LINE.

                switch(exp.type.type)
                {
                    case ValueType.Pointer :
                    case ValueType.Int :
                        this.instruction(`${mvi} R1 ${exp.value}`, "Loading literal int");
                        break;
                    case ValueType.Float :
                        this.setCurrentSection(this.dataSection);                        
                        const label = this.numberedLiteral(ValueType.Float, "floatLiteral", exp.value, "Storing literal float");
                        this.setCurrentSection(this.codeSection);
                        this.instruction(`LDRf R1 ${label}`, "Loading literal float");                            
                        break;
                    case ValueType.Boolean :
                        this.instruction(`${mvi} R1 ${ (exp.value ? "1" : "0") }`, "Loading literal boolean");                    
                        break;
                    case ValueType.Struct :
                        // calculate size of structure
                        const size = this.structSize(exp.type);
                        // reserve space on the stack for this
                        this.instruction(`SUB SP ${size}`, "Reserve space on stack for struct");                                            
                        break;
                    case ValueType.Array :
                        // calculate size of structure
                        const arraySize = this.typeSize(exp.type);
                        // reserve space on the stack for this
                        this.instruction(`SUB SP ${arraySize}`, "Reserve space on stack for array");                                            
                        break;                        
                    case ValueType.Null: 
                        this.instruction(`${mvi} R1 0`, "Loading literal NULL");
                        break;
                    default : 
                        this.diagnostics.reportUnsupportedType(exp.type.type);
                        this.instruction("MVI R1 0", "PLACEHOLDER LOAD");                         
                        break;                       
                }                
                break;
            }
            case Nodes.BoundNodeKind.CallExpression:
            {
                let exp = expression as Nodes.BoundCallExpression;                

                let targetFunction = exp.identifier.name;

                let args = [...exp.callArguments].reverse();
                
                this.comment(`Preparing to call ${targetFunction}`);
                
                this.writeStructReturnTypeSetup(exp);

                const argumentStackSize = this.pushFunctionCallArgumentsToStack(args);

                this.writeCallExpression(exp, targetFunction, args);
                
                this.popFunctionCallArguments(args, argumentStackSize);
                
                break;
            }                    
            case Nodes.BoundNodeKind.VariableExpression:
            {
                const exp = expression as Nodes.BoundVariableExpression;

                if(exp.variable.type.type != ValueType.Struct)
                {
                    const mov = this.typedMnemonic(exp.variable.type.type, "MOV");

                    const description = this.getDataReferenceDescription(exp.variable, true);
                    const address = this.getDataReference(exp.variable, true);

                    this.instruction(`${mov} R1 ${address(0,0)}`, `read ${description.description} ${exp.variable.name} from the ${description.source}`);
                }
                else
                {
                    const mov = this.typedMnemonic(ValueType.Pointer, "MOV");

                    const description = this.getDataReferenceDescription(exp.variable, false);
                    const address = this.getDataReference(exp.variable, false);

                    this.instruction(`${mov} R1, ${address(0,0)}`, `read ${description.description} ${exp.variable.name} from the ${description.source}`);
                }

                break;
            }                  
            case Nodes.BoundNodeKind.UnaryExpression:
            {
                this.writeUnaryExpression(expression as Nodes.BoundUnaryExpression);   
                break;
            }
            case Nodes.BoundNodeKind.BinaryExpression:
            {
                this.writeBinaryExpression(expression as Nodes.BoundBinaryExpression);   
                break;
            }
            case Nodes.BoundNodeKind.ConversionExpression:
            {
                //let expr = expression as Nodes.BoundConversionExpression;
                //this.writeExpression(expr.expression);
                this.writeConversionExpression(expression as Nodes.BoundConversionExpression);   
                break;
            }            
            case Nodes.BoundNodeKind.DereferenceExpression:
            {
                this.writeDereferenceExpression(expression as Nodes.BoundDereferenceExpression);
                break;
            }    
            case Nodes.BoundNodeKind.ArrayIndex:
            {
                this.writeArrayIndexExpression(expression as Nodes.BoundArrayIndexExpression);                 
                break;                
            }                
            default:
            {
                throw new Error(`Unexpected Expression Type ${expression.kind}`);
            }
        }
    }

    private writeDereferenceExpression(expression: Nodes.BoundDereferenceExpression) {
        const variable = expression.operand as Nodes.BoundVariableExpression;
        const address = this.getDataReference(variable.variable, true);
        this.instruction(`MOV R1 ${address(0,0)}`, "value at address");                 
    }

    private writeArrayIndexExpression(expression: Nodes.BoundArrayIndexExpression) {
        // check if index is a literal and shortcut asm.
        //if(expression.index.kind === Nodes.BoundNodeKind.LiteralExpression)

        this.comment("ArrayIndex index expression");
        this.writeExpression(expression.index);

        const elementSize = this.typeSize(expression.type);
        this.instruction(`MUL R1 ${elementSize}`, "Multiply index by size of element");
        this.instruction("PUSH R1", "Push index for later use");
        
        switch(expression.left.kind)
        {
            case Nodes.BoundNodeKind.VariableExpression:
            {
                const variable = expression.left as Nodes.BoundVariableExpression;
                const address = this.getDataReference(variable.variable, false);
                this.instruction(`MOV R1 ${address(0 ,0)}`, "value at address");    
                
                break;
            }
            case Nodes.BoundNodeKind.ArrayIndex:
            {
                const arrayIndexExpression = expression.left as Nodes.BoundArrayIndexExpression;
                this.writeArrayIndexExpression(arrayIndexExpression);
                break;   
            }
            case Nodes.BoundNodeKind.GetExpression:
            {
                const getExpression = expression.left as Nodes.BoundGetExpression;
                this.writeAddressExpression(getExpression);
                break;   
            }            
            default :
            {
                this.diagnostics.reportInvalidIndexing(expression.left.type, new TextSpan(0,0));
                throw new Error("Unexpected indexing source node");
            }
        }

        this.instruction("POP R2", "Pop index and use");
        this.instruction(`ADD R1 R2`, "Add array index to the array start");  

        // if we are getting a primitive type, load the value inself into R1, otherwise the address.
        if(expression.type.isPredefined)
        {
            const mov = this.typedMnemonic(expression.type.type, "MOV");
            this.instruction(`${mov} R1 [R1]`, "value at address");      
        }
    }
    
    private writeStructReturnTypeSetup(exp: Nodes.BoundCallExpression) {
        if (!exp.returnType.isStruct) 
            return;
            
        // struct return types are pushed to the stack, essentially as the first parameter
        // and the location is stored in R3 for easy addressing
        const returnTypeSize = this.typeSize(exp.returnType);
        this.instruction(`SUB SP ${returnTypeSize}`);
        this.zeroStackbytes(returnTypeSize);
        // record the position of the return value in R3
        this.instruction(`MOV R3 SP`);        
    }

    private writeCallExpression(exp: Nodes.BoundCallExpression, targetFunction: string, args: Nodes.BoundExpression[]) {
        if (!!exp.type.function && exp.type.function.isBuiltin) {
            let builtin = this._builtins.findByName(targetFunction);
            this.comment(`Adding INTERUPT FUNC ${targetFunction} params`);
            this.comment(`Pushing 2 arguments onto the stack, interupt number and param count`);
            this.instruction(`MVI R1 ${args.length}`);
            this.instruction("PUSH R1");
            this.instruction(`MVI R1 ${builtin!.interupt}`);
            this.instruction("PUSH R1");
            this.instruction(`INT 1`, "call interupt builtin functions");
            this.instruction(`POP R0`);
            this.instruction(`POP R0`);
        }
        else {
            this.comment(`Calling ${targetFunction}`);
            this.instruction(`CALL ${targetFunction}:`, "call function");
        }
    }

    private pushFunctionCallArgumentsToStack(args: Nodes.BoundExpression[]) : number
    {
        let argumentStackSize: number = 0;

        this.comment(`Pushing ${args.length} arguments onto the stack`);
                
        args.forEach(arg => {
            // accumulate the size of the arguments pushed to the stack for later use.
            const argumentSize = this.typeSize(arg.type);
            argumentStackSize += argumentSize;
        
            if (arg.type.type != ValueType.Struct) {
                // emit the sub expression, which may be arbitrarily complex
                this.writeExpression(arg);
                // push the result, which will always be in R1, to the stack
                const push = this.typedMnemonic(arg.type.type, "PUSH");
                this.instruction(`${push} R1`);
            }
            else 
            {
                // structs types cannot be part of a artithmetic expression
                // so this amounts to only a few possible source memory locations 
                // to copy from
                const source = this.getStructDataReference(arg);
                this.instruction(`SUB SP ${argumentSize}`);
                const dest = (i: number, _: number) => `[SP+${i}]`;
                this.emitStackCopy(dest, source, argumentSize);
            }
        });

        return argumentStackSize;
    }

    popFunctionCallArguments(args: Nodes.BoundExpression[], argumentStackSize: number) {
        if(!args.length)
            return;

        if(this.optimiseForSize)
        {
            this.instruction(`ADD SP ${argumentStackSize}`, `Quickly remove ${argumentStackSize} bytes from stack for pushed arguments.`);
        }
        else
        {
            this.comment(`Removing arguments from stack`);

            args.forEach( arg => {
                if(arg.type.type != ValueType.Struct)
                {
                    const pop = this.typedMnemonic(arg.type.type, "POP");
                    this.instruction(`${pop} R0`);
                }
                else
                {
                    const size = this.typeSize(arg.type);                        
                    this.instruction(`ADD SP ${size}`);
                }
            });
        }
    }
    
    getStructDataReference(expression: Nodes.BoundExpression) : (offset:number, chunk:number)=>string {
        switch(expression.kind)
        {
            case Nodes.BoundNodeKind.LiteralExpression:
            {
                const exp = expression as Nodes.BoundLiteralExpression;

                if(exp.value !== null)
                    throw new Error("Expectng default value");

                return (i, _c) => `0`;
            }
            case Nodes.BoundNodeKind.VariableExpression:
            {
                const exp = expression as Nodes.BoundVariableExpression;
                return this.getDataReference(exp.variable);
            }
            case Nodes.BoundNodeKind.CallExpression:
            {
                const exp = expression as Nodes.BoundCallExpression;
                
                if(exp.returnType.isStruct)
                {
                    // We have a call returning a structure.
                    // once the call is done the returned structure will be on the stack
                    // and its address will be in R3
                    this.writeExpression(exp);

                    // now R3 holds the address of the structure!
                    return (i, _c) => `[R3+${i}]`;
                }
                throw new Error("Expected Struct Type");
            }
            default:
            {
                throw new Error("Unhandled expression type");
            }            
        }
    }

    getDataReference(identifier : Identifier, address:boolean = true) : (offset:number, chunk:number)=>string
    {
        const addAddress = (add:string) => {
            if(address)
                return `[${add}]`;
            return add;
        };

        // assignments for structs are always simple byte copys
        // from a variable, parameter or global.
        if(identifier.variable!.isParameter)
        {
            // assigning to struct parameter
            let spec = this.variableMap.peek()[identifier.name];
            let offset = this.stackOffset + spec.offset;
            return (i,c) => addAddress(`R6+${offset+i}`);
        }
        else if(identifier.variable && identifier.variable!.isGlobal)
        {           
            return (offset) => addAddress(`.${identifier.name}`);
        }
        else
        {
            let spec = this.variableMap.peek()[identifier.name];
            let offset = spec.offset + spec.size;
            return (i, c) => addAddress(`R6-${offset-i}`);
        }
    }

    getDataReferenceDescription(identifier : Identifier, address:boolean = true) : { description : string, source :string }
    {
        const addAddress = (add:string) => {
            if(address)
                return `address of ${add}`;
            return add;
        };

        // assignments for structs are always simple byte copys
        // from a variable, parameter or global.
        if(identifier.variable!.isParameter)
        {
            return {
                description : addAddress(`parameter`),
                source : `stack`
            };
        }
        else if(identifier.variable && identifier.variable!.isGlobal)
        {    
            return {
                description : addAddress(`global variable`),
                source : `data region`
            };       
        }
        else
        {
            return {
                description : addAddress(`local variable`),
                source : `stack`
            };
        }
    }
    
    getExpressionPath(left: Nodes.BoundGetExpression) : string[]
    {
        if(left.left && left.left.kind === Nodes.BoundNodeKind.GetExpression)
            return [...this.getExpressionPath(left.left as Nodes.BoundGetExpression), left.member];        

        return [left.member];
    }

    structMemberRoot(left: Nodes.BoundGetExpression) : Nodes.BoundVariableExpression {
        let current : Nodes.BoundExpression = left;
        let last = current;

        // ick, this needs serious work to find the underlying model at play.
        while(current)
        {
            last = current;
            
            if(current.kind === Nodes.BoundNodeKind.GetExpression)
            {                
                current = (current as Nodes.BoundGetExpression).left;
            }

            if(current && current.kind === Nodes.BoundNodeKind.VariableExpression)
            {
                return current as Nodes.BoundVariableExpression;
            }

            if(current && current.kind === Nodes.BoundNodeKind.DereferenceExpression)
            {
                const t = current as Nodes.BoundDereferenceExpression;
            
                if(t && t.operand.kind === Nodes.BoundNodeKind.VariableExpression)
                {
                    return t.operand as Nodes.BoundVariableExpression;
                }
            }

            if(current.id === last.id)
                throw new Error("No progress made");
        }

        throw new Error("Expected variable expression")
    }
    
    pushStruct(struct: Type, comment:string = "") {
        const fields = struct.structDetails!.fields;
        for(let field of fields)
        {
            if(field.type.type != ValueType.Struct)
            {
                const push = this.mnemonicForType(field.type.type);
                this.instruction(`${push} R1`);
            }
            else this.pushStruct(field.type, `nested struct ${field.type.name}`);
        }
    }

    writeConversionExpression(expression: Nodes.BoundConversionExpression) : void
    {
        this.writeExpression(expression.expression);

        // if identity conversion
        if(expression.type.type == expression.expression.type.type)
        {
            return;
        }

        // if converting to string
        if(expression.type.type === ValueType.String)
        {
            this.comment("CONVERT TO STRING -- NOT IMPLEMENTED");
            return;
        }

        // to type
        switch(expression.type.type)
        {
            case ValueType.Int:
            {
                // from type
                if(expression.expression.type.type == ValueType.Float)
                {
                    this.instruction("TRUNCf R1", "CONVERT FROM FLOAT TO INT");
                    return;
                }
                break;
            }
            case ValueType.Float:
            {
                // from type
                if(expression.expression.type.type == ValueType.Int)
                {
                    this.comment("CONVERT FROM INT TO FLOAT");
                    return;
                }
                break;
            }                
            case ValueType.Boolean:
            {
                // from type
                if(expression.expression.type.type == ValueType.Int)
                {
                    this.comment("CONVERT FROM BOOL TO INT");
                    return;
                }                
                else if(expression.expression.type.type == ValueType.Float)
                {
                    this.comment("CONVERT FROM BOOL TO FLOAT");
                    return;
                }     
                break;                       
            }
        }

        throw new Error("Unexpected conversion");           
    }
    
    numberedLiteral(type: ValueType, namePrefix: string, value: any, comment: string) {
        this.setCurrentSection(this.dataSection);

        const foundItems = this.globalLiterals.filter( (v) => {
            return  v.value == value &&
                    v.type == type;
        });

        if(foundItems.length > 0)
            return foundItems[0].name;

        const label = this.data(type, namePrefix + "_" + this.labelCount, value, comment);        

        this.labelCount++;

        this.globalLiterals.push({
            name : label,
            type : type,
            value : value
        });

        return label;
    }
    
    data(type: ValueType, name: string, value: any, comment: string) {
        let slotType = this.mnemonicForType(type);
        let line = "    ." + name + " " + slotType + " " + value;
        this.lines.push(line);
        return "." + name;
    }

    writeFunctionCallParameter(expr: Nodes.BoundExpression) : void {    
    }
    
    writeUnaryExpression(expression: Nodes.BoundUnaryExpression) : void
    {
        this.writeExpression(expression.operand);

        switch(expression.operator.operatorKind)
        {    
            case Nodes.BoundUnaryOperatorKind.Identity:
            {
                // do nothing. you good to go!
                this.comment("'NOP' unary identity op");                                
                break;
            }
            case Nodes.BoundUnaryOperatorKind.LogicalNegation:
            {
                this.instruction("NOT R1", "unary logical negation op");                                                
                break;
            }
            case Nodes.BoundUnaryOperatorKind.Negation:
            {
                this.instruction(`NEG R1`, "unary negation op");                                              
                break;
            }  
            case Nodes.BoundUnaryOperatorKind.Reference:
            {
                const v = expression.operand as Nodes.BoundVariableExpression;
                const address = this.getDataReference(v.variable, false);

                this.instruction(`MOV R1, ${address(0,0)}`, "address of");                                         
                break;
            }                      
            default:
            {                
                throw new Error(`Unexpected Unary Expression Type ${expression.kind}`);
            }
        }
    }

    writeBinaryExpression(expression: Nodes.BoundBinaryExpression) : void
    {
        let binpreamble = () : ValueType => {
            const type = expression.left.type.type;
            const push = this.typedMnemonic(type, "PUSH");
            const pop = this.typedMnemonic(type, "POP");
            this.writeExpression(expression.left);
            this.instruction(`${push} R1`, "save value of the left hand expression on the stack");
            this.writeExpression(expression.right);
            this.instruction(`${pop} R2`, "pop left hand result from the stack into R2");
            return type;
        };
        
        switch(expression.operator.operatorKind)
        {    
            case Nodes.BoundBinaryOperatorKind.Addition:
            {
                const type = binpreamble();
                const add = this.typedMnemonic(type, "ADD");
                this.instruction(`${add} R1 R2`, "add r1 to r2, save results in r1");                
                break;
            }   
            case Nodes.BoundBinaryOperatorKind.Subtraction:
            {
                const type = binpreamble();
                const sub = this.typedMnemonic(type, "SUB");
                this.instruction("SWAP R1 R2", "Subtraction requires the operand be int he oposite order");
                this.instruction(`${sub} R1 R2`, "subtract r2 from r1, save results in r1");                
                break;
            }
            case Nodes.BoundBinaryOperatorKind.Multiplication:
            {
                const type = binpreamble();
                const mul = this.typedMnemonic(type, "MUL");
                this.instruction(`${mul} R1 R2`, "multiple r1 by r2, save results in r1");                
                break;
            }
            case Nodes.BoundBinaryOperatorKind.Division:
            {
                const type = binpreamble();
                const div = this.typedMnemonic(type, "DIV");
                this.instruction("SWAP R1 R2", "requires the operand be in the oposite order");
                this.instruction(`${div} R1 R2`, "divide r1 by r2, save results in r1");                
                break;   
            }    
            case Nodes.BoundBinaryOperatorKind.Equals:        
                binpreamble();                
                this.instruction("CMPr R1 R2", "EQ : set ZF on if R1 == R2, NF on if R1 < R2");
                this.instruction("SETE R1  ", "set R1 to 1 if ZF is on");
                break;
            case Nodes.BoundBinaryOperatorKind.NotEquals:
                binpreamble();    
                this.instruction("CMPr R1 R2", "NEQ : set ZF on if R1 == R2, NF on if R1 < R2");
                this.instruction("SETNE R1 ", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;                
            case Nodes.BoundBinaryOperatorKind.LessThan:
                binpreamble();    
                this.instruction("SWAP R1 R2", "requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "LT : set ZF on if R1 == R2, NF on if R1 < R2");
                this.instruction("SETLT R1", "set R1 if R1 < R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.LessThanOrEquals:
                binpreamble();    
                this.instruction("SWAP R1 R2", "requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "LTE : set ZF on if R1 == R2, NF on if R1 < R2");
                this.instruction("SETLTE R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.GreaterThan:
                binpreamble();    
                this.instruction("SWAP R1 R2", "requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "GT : set ZF on if R1 == R2, NF on if R1 < R2");
                this.instruction("SETGT R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.GreaterThanOrEquals:
                binpreamble();    
                this.instruction("SWAP R1 R2", "requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "GTE : set ZF on if R1 == R2, NF on if R1 < R2");
                this.instruction("SETGTE R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;      
            case Nodes.BoundBinaryOperatorKind.LogicalAnd:
            {
                this.comment("Logical And");
                this.writeExpression(expression.left);    
                this.instruction("CMPZ R1", "check if left is true");
                let clause2 = this.generateLabel("clause2");
                this.instruction(`JNE ${clause2}:`, "left isn't 0, so we need to evaluate clause 2");                
                let end = this.generateLabel("end");
                this.instruction(`JMP ${end}:`);
                this.label(clause2);
                this.writeExpression(expression.right);                    
                this.instruction("CMPZ R1", "check if right is true");
                this.instruction("SETNE R1", "set R1 register to 1 iff e2 != 0");
                this.label(end);
                break;
            }
            case Nodes.BoundBinaryOperatorKind.LogicalOr:   
            {
                this.comment("Logical Or");
                this.writeExpression(expression.left);    
                this.instruction("CMPZ R1", "check if left is true");
                let clause2 = this.generateLabel("clause2");
                this.instruction(`JEQ ${clause2}:`, "left is 0, so we need to evaluate clause 2");
                this.instruction("MOV R1 1", "we didn't jump, so left is true and therefore result is 1");
                let end = this.generateLabel("end");
                this.instruction(`JMP ${end}:`);
                this.label(clause2);
                this.writeExpression(expression.right);                    
                this.instruction("CMPZ R1", "check if right is true");
                this.instruction("SETNE R1", "set R1 register to 1 iff e2 != 0");
                this.label(end);
                break;
            }
            default:
            {                
                throw new Error(`Unexpected Binary Expression Type ${expression.kind}`);
            }
        }
    }

    private generateLabel(name : string) : string
    {
        return name + this.labelCount++; 
    }

    writeStackFramePrelude() : void{
        this.instruction("PUSH R6", "save old value of stack pointer");
        this.instruction("MOV R6 SP", "R6 is bottom of stack. Make current top of stack the bottom of the new stack frame");
    }

    writeJumpToStackFrameEpilogue(functionName : string) : void
    {
        this.instruction(`JMP ${functionName}_epilogue:`);
    }

    writeStackFrameEpilogue(functionName : string) : void
    {
        // if the previous line was a jump to this epilogue
        if(this.lines[this.lines.length-1].trim() == `JMP ${functionName}_epilogue:`)        
        {
            // just remove the unneeded jump.
            this.lines.splice(this.lines.length-1, 1);
        }

        this.label(`${functionName}_epilogue`);        
        this.instruction("MOV SP R6", "restore SP; now it points to old R6");
        this.instruction("POP R6", "restore old R6; now SP is where it was before prologue");
        this.instruction("RET");
    }

    label(label:string) : void
    {
        this.lines.push(label + ":");
    }

    instruction(instruction : string, comment? : string) : void
    {
        if(this.writeComments && comment)
            instruction += "\t\t\t\t; " + comment;

        this.lines.push("    " + instruction);
    }

    blankLine() : void {
        if(!this.writeBlankLines)
            return;

        this.lines.push("");
    }

    comment(text: string) : void {
        if(!this.writeComments)
            return;

        this.lines.push("; " + text);
    }
}