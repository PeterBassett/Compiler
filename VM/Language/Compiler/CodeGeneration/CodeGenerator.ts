import * as Nodes from "../Binding/BoundNode";
import { ValueType, ValueTypeNameMap } from "../../Types/ValueType";
import { Diagnostics } from "../Diagnostics/Diagnostics";
import { StructDeclarationStatementSyntax, IfStatementSyntax } from "../Syntax/AST/ASTNode";
import GeneratedCode from "./GeneratedCode";
import Stack from "../../../misc/Stack";
import BuiltinFunctions from "../BuiltinFunctions";

export default class CodeGenerator
{
    private functionName! : string;
    private diagnostics! : Diagnostics;    
    private sections : string[][] = [];
    private lines : string[] = [];
    private stackIndex : number = 0;
    private variableMap! : Stack< { [index:string] : { offset:number, size:number } } >;
    private labelCount:number = 0;
    private writeComments : boolean;
    private writeBlankLines : boolean;
    private globalLiterals : { name :string, type: ValueType, value : any }[] = [];

    private dataSection = 0;
    private entrySection = 0;
    private initSection = 0;
    private codeSection = 0;
    
    private readonly stackOffset : number = 8;

    constructor( options? : { comments:boolean, blankLines:boolean} )
    {
        this.writeComments = true;
        this.writeBlankLines = true;

        if(options)
        {
            this.writeComments = options.comments;
            this.writeBlankLines = options.blankLines;
        }
    }

    public generate(root : Nodes.BoundGlobalScope) : GeneratedCode
    {
        this.dataSection = this.codeSection = this.initSection = this.entrySection = 0;;

        this.stackIndex = 0;
        this.variableMap = new Stack<{ [index:string] : { offset:number, size:number } }>();
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
            const expression = v.initialiser;

            if(expression.kind == Nodes.BoundNodeKind.LiteralExpression)
            {                
                let exp = expression as Nodes.BoundLiteralExpression;           
                this.data(v.variable.type.type, v.variable.name, exp.value, `Global variable Declaration for ${v.variable.name}`);
            }            
            else
            {
                this.setCurrentSection(this.dataSection);
                this.data(v.variable.type.type, v.variable.name, 0, `Global variable Declaration for ${v.variable.name}`);

                this.setCurrentSection(this.initSection);
                this.writeExpression(expression);                
                const str = this.typedMnemonic(v.variable.type.type, "STR");
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
                return prev + level[curr].size;
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
            const size = this.typeSize(p.type.type);
            this.variableMap.peek()[p.name] = { offset:offset, size:size };            
            offset += size;
        })
        
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
                    stmt.statements.forEach( s => this.writeStatement(s) );
                }                    
                break;
            }         
            case Nodes.BoundNodeKind.ReturnStatement:
            {
                let stmt = statement as Nodes.BoundReturnStatement;            

                if(stmt.expression)
                    this.writeExpression(stmt.expression);

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
                this.instruction("CMPZ R1", "");                

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
                let stmt = statement as Nodes.BoundVariableDeclaration;            

                this.comment(`declare variable ${stmt.variable.name}`);
                if(stmt.initialiser)
                {
                    this.comment(`calculate initialisation value for variable ${stmt.variable.name}`);
                    this.writeExpression(stmt.initialiser);
                }
                else
                {
                    this.comment(`default initialisation value for variable ${stmt.variable.name}`);
                    this.instruction("MOV R1 0")
                }
            
                const size = this.typeSize(stmt.variable.type.type);
                this.variableMap.peek()[stmt.variable.name] = { offset:this.stackIndex, size:size };
                this.stackIndex += size;                

                this.comment(`reserve space on stack for variable ${stmt.variable.name}`);                            

                const push = this.typedMnemonic(stmt.variable.type.type, "PUSH");
                const type = this.mnemonicForType(stmt.variable.type.type);
                this.instruction(`${push} R1`, `reserve space for a ${type} variable ${stmt.variable.name}`);                
                break;
            }                  
        }
    }
    
    popDeclaredVariables() {
        this.instruction("MOV SP R6", "unwind the stack for variables declared in this function");
    }
    
    typeSize(type : ValueType) : number {

        //return 4;

        switch(type)
        {
            case ValueType.Int :
                return 4;
            case ValueType.Float :
                return 8;
            case ValueType.Boolean :
                return 1;
            default : 
                this.diagnostics.reportUnsupportedType(type);
                return 4;                       
        }
    }

    mnemonicForType(type: ValueType) : string
    {
        switch(type) {
            case ValueType.Boolean:
                return "byte";
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
            case Nodes.BoundNodeKind.LiteralExpression:
            {
                let exp = expression as Nodes.BoundLiteralExpression;           
                let mvi = this.typedMnemonic(exp.type.type, "MVI");
                const hannah = "beautiful";
                switch(exp.type.type)
                {
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
                this.comment(`Pushing ${args.length} arguments onto the stack`);
                args.forEach( arg => {
                    this.writeExpression( arg );
                    const push = this.typedMnemonic(arg.type.type, "PUSH");
                    this.instruction(`${push} R1`); 
                });

                if(!!exp.type.function && exp.type.function.isBuiltin)
                {
                    let builtin = BuiltinFunctions.find(targetFunction);

                    this.comment(`Adding INTERUPT FUNC ${targetFunction} params`);
                    this.comment(`Pushing 2 arguments onto the stack, interupt number and param count`);                    

                    this.instruction(`MVI R1 ${args.length}`);
                    this.instruction("PUSH R1")
                
                    this.instruction(`MVI R1 ${builtin!.interupt}`);
                    this.instruction("PUSH R1")
                
                    this.instruction(`INT 1`, "call interupt builtin functions");
                    this.instruction(`POP R3`);    
                    this.instruction(`POP R3`);
                }
                else
                {        
                    this.comment(`Calling ${targetFunction}`);
                    this.instruction(`CALL ${targetFunction}:`, "call function");
                }

                this.comment(`Removing arguments from stack`);
                args.forEach( arg => {
                    const pop = this.typedMnemonic(arg.type.type, "POP");
                    this.instruction(`${pop} R3`);    
                });

                break;
            }                    
            case Nodes.BoundNodeKind.VariableExpression:
            {
                const exp = expression as Nodes.BoundVariableExpression;

                const mov = this.typedMnemonic(exp.variable.type.type, "MOV");

                if(exp.variable.variable!.isParameter)
                {                    
                    const spec = this.variableMap.peek()[exp.variable.name];
                    // find location of variable on the stack.
                    // skip over the RETurn IP and the previous base pointer
                    let offset = this.stackOffset + spec.offset;                     
                    this.instruction(`${mov} R1 [R6+${offset}]`, `read parameter ${exp.variable.name} from the stack`);
                }
                else if(exp.variable.variable!.isGlobal)
                {
                    const ldr = this.typedMnemonic(exp.variable.type.type, "LDR");
                    this.instruction(`${ldr} R1 .${exp.variable.name}`, "read global variable");   
                    //this.instruction(`${mov} R1 .${exp.variable.name}`, "read global variable");    
                }
                else
                {
                    const spec = this.variableMap.peek()[exp.variable.name];
                    // find the variable on the stack.
                    // since we are going down the stack below the base pointer
                    // we need to use both the offset and the size of the variable
                    let offset = spec.offset + spec.size; 
                    this.instruction(`${mov} R1 [R6-${offset}]`, `read variable ${exp.variable.name} from the stack`);
                }
                break;
            }
            case Nodes.BoundNodeKind.AssignmentExpression:
            {
                let exp = expression as Nodes.BoundAssignmentExpression;
                this.writeExpression(exp.expression);

                const mov = this.typedMnemonic(exp.type.type, "MOV");

                if(exp.identifier.variable!.isParameter)
                {
                    let spec = this.variableMap.peek()[exp.identifier.name];
                    let offset = this.stackOffset + spec.offset;
                    this.instruction(`${mov} [R6+${offset}] R1`, `assignt to parameter ${exp.identifier.name} on the stack`);
                }
                else if(exp.identifier.variable && exp.identifier.variable!.isGlobal)
                {
                    const str = this.typedMnemonic(exp.identifier.type.type, "STR");
                    this.instruction(`${str} R1 .${exp.identifier.name}`, "read global variable");                       
                    //this.instruction(`${mov} .${exp.identifier.name} R1`, "assign to global variable");
                }
                else
                {
                    let spec = this.variableMap.peek()[exp.identifier.name];
                    let offset = spec.offset + spec.size;
                    this.instruction(`${mov} [R6-${offset}] R1`, `assign to variable ${exp.identifier.name} on the stack`);
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
        }
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
        switch(expression.operator.kind)
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
                this.instruction("NEG R1", "unary negation op");                                              
                break;
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
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction(`${div} R1 R2`, "divide r1 by r2, save results in r1");                
                break;   
            }    
            case Nodes.BoundBinaryOperatorKind.Equals:        
                binpreamble();                
                this.instruction("CMPr R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETE R1  ", "set R1 to 1 if ZF is on");
                break;
            case Nodes.BoundBinaryOperatorKind.NotEquals:
                binpreamble();    
                this.instruction("CMPr R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETNE R1 ", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;                
            case Nodes.BoundBinaryOperatorKind.LessThan:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETLT R1", "set R1 if R1 < R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.LessThanOrEquals:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETLTE R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.GreaterThan:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETGT R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.GreaterThanOrEquals:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMPr R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETGTE R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;      
            case Nodes.BoundBinaryOperatorKind.LogicalAnd:
            {
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