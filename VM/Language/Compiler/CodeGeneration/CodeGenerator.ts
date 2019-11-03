import * as Nodes from "../Binding/BoundNode";
import { ValueType, ValueTypeNameMap } from "../../Types/ValueType";
import { Diagnostics } from "../Diagnostics/Diagnostics";
import { StructDeclarationStatementSyntax, IfStatementSyntax } from "../Syntax/AST/ASTNode";
import GeneratedCode from "./GeneratedCode";
import Stack from "../../../misc/Stack";
import BuiltinFunctions from "../BuiltinFunctions";

export default class CodeGenerator
{
    private diagnostics! : Diagnostics;
    private lines : string[] = [];
    private stackIndex : number = 0;
    private variableMap! : Stack< { [index:string] : number} >;
    private labelCount:number = 0;
    private writeComments : boolean;
    private writeBlankLines : boolean;

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
        this.stackIndex=0;
        this.variableMap = new Stack<{ [index:string] : number}>();
        this.lines = [];    
        this.labelCount = 0;
        this.diagnostics = new Diagnostics(root.diagnostics.text, root.diagnostics);

        this.writeGlobalVariables(root.variables);
        this.writeFunctions(root.functionMap);

        return new GeneratedCode(this.lines, this.diagnostics);
    }
    
    writeGlobalVariables(variables: Nodes.BoundVariableDeclaration[]) 
    {
        this.lines.push(".data");
        
        variables.forEach(v => {
            let slotType = this.mnemonicForType(v.variable.type.type);
            let line = "    ." + v.variable.name + " " + slotType;
            this.lines.push(line);
        });
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

    writeFunctions(functionMap: { [index: string]: Nodes.BoundFunctionDeclaration; }) 
    {
        this.lines.push(".text");

        let main = functionMap["main"];

        if(!main)
            this.diagnostics.reportEntryPointNotFound("main");
        else
        {
            this.lines.push(".global __entrypoint:");
            this.lines.push("__entrypoint:");
            this.instruction("MOV R6 SP", "Initialise Base Pointer");
            this.instruction("CALL main:")
            this.instruction("HALT")

            this.writeFunction(main);             
        }

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
        let items = this.calculateVariablesDefinedAtThisLevel();
        this.variableMap.pop();
        this.stackIndex -= items * 4;
    }

    writeFunction(func: Nodes.BoundFunctionDeclaration) {
        this.blankLine();
        this.label(func.identifier);
    
        let start = this.calculateVariablesDefinedAtThisLevel();
        this.writeStackFramePrelude();
        this.pushVariableMap();

        let params = [...func.parameters].reverse();
        let total = 4 * params.length;
        params.forEach( p => {
            this.variableMap.peek()[p.name] = total;
            total -= 4;
        })
        
        this.writeStatement(func.blockBody);
        this.popVariableMap();       

        let end = this.calculateVariablesDefinedAtThisLevel();        
    }

    writeStatement(statement: Nodes.BoundStatement) {
        switch(statement.kind)
        {   
            case Nodes.BoundNodeKind.BlockStatement:
            {
                let stmt = statement as Nodes.BoundBlockStatement;            

                if(stmt.statements.length > 0)
                {
                    let start = this.calculateVariablesDefinedAtThisLevel();
                    stmt.statements.forEach( s => this.writeStatement(s) );
                    let end = this.calculateVariablesDefinedAtThisLevel();
                
                    // lexical scoping variable deallocation magic to be injected here
                   // console.log(end-start);
                   // let bytesToDeallocate = 4 * (end-start);
                   // if(bytesToDeallocate > 0)
                   // {
                   //     this.instruction(`MVI R3 ${bytesToDeallocate}`);                    
                   //     this.instruction(`ADD SP R3`);
                   // }
                }                    
                break;
            }         
            case Nodes.BoundNodeKind.ReturnStatement:
            {
                let stmt = statement as Nodes.BoundReturnStatement;            

                if(stmt.expression)
                    this.writeExpression(stmt.expression);

                //this.writeStackFrameEpilogue();
                // we need to undo the stack, back to where it was when we started this function
               // this.popDeclaredVariables();
                this.writeStackFrameEpilogue();
                this.instruction("RET");                
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
                this.instruction("CMP R1 0", "");                

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
            
                this.instruction("PUSH R1", `reserve space on stack for variable ${stmt.variable.name}`);
                
                this.variableMap.peek()[stmt.variable.name] = this.stackIndex;

                this.stackIndex += 4;                
                break;
            }                  
        }
    }
    
    popDeclaredVariables() {
        let count = this.calculateVariablesDefinedAtThisLevel();

        this.instruction("MOV SP R6", "unwind the stack for variables declared in this function");
    }
    
    writeExpression(expression: Nodes.BoundExpression) {
        switch(expression.kind)
        {    
            case Nodes.BoundNodeKind.LiteralExpression:
            {
                let exp = expression as Nodes.BoundLiteralExpression;           
                switch(exp.type.type)
                {
                    case ValueType.Int :
                        this.instruction("MVI R1 " + exp.value, "Loading literal int");
                        break;
                    case ValueType.Float :
                        this.instruction("MVI R1 " + exp.value, "Loading literal float");                        
                        break;
                    case ValueType.Boolean :
                        this.instruction("MVI R1 " + (exp.value ? "1" : "0"), "Loading literal boolean");                        
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
                    this.instruction("PUSH R1") 
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
                let bytesToRemove = 4 * args.length;
                for (let index = 0; index < args.length; index++) {
                    this.instruction(`POP R3`);    
                }

                break;
            }                    
            case Nodes.BoundNodeKind.VariableExpression:
            {
                let exp = expression as Nodes.BoundVariableExpression;

                if(exp.variable.variable!.isParameter)
                {
                    let offset = this.variableMap.peek()[exp.variable.name]; //find location of variable on the stack                    
                    this.instruction(`MOV R1 [R6+${offset+4}]`, `read parameter ${exp.variable.name} from the stack`);
                }
                else if(exp.variable.variable!.isGlobal)
                {
                    this.instruction(`MOV R1 ${exp.variable.name}:`, "read global variable");    
                }
                else
                {
                    let offset = this.variableMap.peek()[exp.variable.name]; //find location of variable on the stack
                    this.instruction(`MOV R1 [R6-${offset+4}]`, `read variable ${exp.variable.name} from the stack`);
                }
                break;
            }
            case Nodes.BoundNodeKind.AssignmentExpression:
            {
                let exp = expression as Nodes.BoundAssignmentExpression;
                this.writeExpression(exp.expression);

                if(exp.identifier.variable && exp.identifier.variable!.isGlobal)
                {
                    this.instruction(`MOV ${exp.identifier.name}: R1`, "assign to global variable");
                }
                else
                {
                    let offset = this.variableMap.peek()[exp.identifier.name];
                    this.instruction(`MOV [R6-${offset+4}] R1`, `assign to variable ${exp.identifier.name} on the stack`);
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

    writeFunctionCallParameter(expr: Nodes.BoundExpression) : void {
    
    }
    
    calculateVariablesDefinedAtThisLevel() : number {
        if(this.variableMap.length == 0)
            return 0;

        let i = Object.keys(this.variableMap.peek()).length;

        return i;
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
        let binpreamble = () => {
            this.writeExpression(expression.left);
            this.instruction("PUSH R1", "save value of the left hand expression on the stack");
            this.writeExpression(expression.right);
            this.instruction("POP R2", "pop left hand result from the stack into R2");
        };
        
        switch(expression.operator.operatorKind)
        {    
            case Nodes.BoundBinaryOperatorKind.Addition:
                binpreamble();
                this.instruction("ADD R1 R2", "add r1 to r2, save results in r1");                
                break;
            case Nodes.BoundBinaryOperatorKind.Subtraction:
                binpreamble();
                this.instruction("SWAP R1 R2", "Subtraction requires the operand be int he oposite order");
                this.instruction("SUB R1 R2", "subtract r2 from r1, save results in r1");                
                break;
            case Nodes.BoundBinaryOperatorKind.Multiplication:
                binpreamble();    
                this.instruction("MUL R1 R2", "multiple r1 by r2, save results in r1");                
                break;
            case Nodes.BoundBinaryOperatorKind.Division:
                binpreamble();
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("DIV R1 R2", "divide r1 by r2, save results in r1");                
                break;       
            case Nodes.BoundBinaryOperatorKind.Equals:        
                binpreamble();                
                this.instruction("CMP R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETE R1  ", "set R1 to 1 if ZF is on");
                break;
            case Nodes.BoundBinaryOperatorKind.NotEquals:
                binpreamble();    
                this.instruction("CMP R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETNE R1 ", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;                
            case Nodes.BoundBinaryOperatorKind.LessThan:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMP R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETLT R1", "set R1 if R1 < R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.LessThanOrEquals:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMP R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETLTE R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.GreaterThan:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMP R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETGT R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;
            case Nodes.BoundBinaryOperatorKind.GreaterThanOrEquals:
                binpreamble();    
                this.instruction("SWAP R1 R2", "Division requires the operand be in the oposite order");
                this.instruction("CMP R1 R2", "set ZF on if R1 == R2, NF < 0 if R1 < R2");
                this.instruction("SETGTE R1", "set R1 if R1 <= R2, i.e. if R1 - R2 is negative");
                break;      
            case Nodes.BoundBinaryOperatorKind.LogicalAnd:
            {
                this.writeExpression(expression.left);    
                this.instruction("CMP R1 0", "check if left is true");
                let clause2 = this.generateLabel("clause2");
                this.instruction(`JNE ${clause2}:`, "left isn't 0, so we need to evaluate clause 2");                
                let end = this.generateLabel("end");
                this.instruction(`JMP ${end}:`);
                this.label(clause2);
                this.writeExpression(expression.right);                    
                this.instruction("CMP R1 0", "check if right is true");
                this.instruction("SETNE R1", "set R1 register to 1 iff e2 != 0");
                this.label(end);
                break;
            }
            case Nodes.BoundBinaryOperatorKind.LogicalOr:   
            {
                this.writeExpression(expression.left);    
                this.instruction("CMP R1 0", "check if left is true");
                let clause2 = this.generateLabel("clause2");
                this.instruction(`JEQ ${clause2}:`, "left is 0, so we need to evaluate clause 2");
                this.instruction("MOV R1 1", "we didn't jump, so left is true and therefore result is 1");
                let end = this.generateLabel("end");
                this.instruction(`JMP ${end}:`);
                this.label(clause2);
                this.writeExpression(expression.right);                    
                this.instruction("CMP R1 0", "check if right is true");
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

    writeStackFrameEpilogue() : void
    {
        this.instruction("MOV SP R6", "restore SP; now it points to old R6");
        this.instruction("POP R6", "restore old R6; now SP is where it was before prologue");
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