import { exhaustiveCheck } from "../../misc/exhaustive";
import * as Nodes from "../../Language/Compiler/Binding/BoundNode";
import * as SyntaxFacts from "../../Language/Compiler/Syntax/SyntaxFacts";

export default class BoundTreeStructureVisitor
{
    public structure : string = "";
    private indent : number = 0;
    private boundNodeKindNames : string[];

    constructor()
    {
        this.boundNodeKindNames = Object.keys(Nodes.BoundNodeKind).filter(k => typeof Nodes.BoundNodeKind[k as any] === "number");
    }

    private write(node: Nodes.BoundNode) : boolean
    {
        let value : string = "";

        if(!node)
            return true;

        switch(node.kind)
        {
            case Nodes.BoundNodeKind.LiteralExpression:                
            {
                let exp = node as Nodes.BoundLiteralExpression;                
                value = "<" + exp.value + ":" + exp.type.name + ">";
                break;
            }
            case Nodes.BoundNodeKind.BinaryExpression:
            {
                let exp = node as Nodes.BoundBinaryExpression;
                let op = SyntaxFacts.GetText(exp.operator.syntaxKind);

                value = "<" + op + ">";
                break;
            }
            case Nodes.BoundNodeKind.UnaryExpression:
            {
                let exp = node as Nodes.BoundUnaryExpression;
                value = "<" + exp.operator.syntaxKind + ">";
                break;
            }
            case Nodes.BoundNodeKind.FunctionDefinition:
            {
                let exp = node as Nodes.BoundFunctionDeclaration;

                value = "<" + exp.identifier + ":" + exp.returnType.name + ">\n";
                value += Array(this.indent+2).join("    ") + "ParameterDeclarationList";
                for(let i = 0; i < exp.parameters.length; i++)
                {
                    let parameter = exp.parameters[i];                    
                    value += "\n" + Array(this.indent+3).join("    ");                    
                    value += "ParameterDeclaration<" + parameter.name + ":" + parameter.type.name + ">";
                }
                break;
            }
            case Nodes.BoundNodeKind.VariableDeclaration:
            {
                let exp = node as Nodes.BoundVariableDeclaration;

                value = "<" + exp.variable.name + ":" + exp.variable.type.name + ">";
                break;
            }
            case Nodes.BoundNodeKind.ClassDeclaration:
            {
                let exp = node as Nodes.BoundClassDeclaration;

                value = "<" + exp.name + ">";
                break;
            }
            case Nodes.BoundNodeKind.StructDeclaration:
            {
                let exp = node as Nodes.BoundStructDeclaration;

                value = "<" + exp.name + ">";
                break;
            } 
            case Nodes.BoundNodeKind.StructMemberDeclaration:
            {
                let exp = node as Nodes.BoundStructMemberDeclaration;

                value = "<" + exp.name + ":" + exp.type.name + ">";
                break;
            }                        
            case Nodes.BoundNodeKind.AssignmentExpression:
            {
                let exp = node as Nodes.BoundAssignmentExpression;

                value = "<" + exp.identifier.name + ":" + exp.identifier.type.name + ">";
                break;
            }
            case Nodes.BoundNodeKind.VariableExpression:
            {
                let exp = node as Nodes.BoundVariableExpression;

                value = "<" + exp.variable.name + ":" + exp.variable.type.name + ">";
                break;                
            }  
            case Nodes.BoundNodeKind.CallExpression:
            {
                let exp = node as Nodes.BoundCallExpression;

                value = "<" + exp.identifier.name + ">";
                break;                
            }              
            case Nodes.BoundNodeKind.ConditionalGotoStatement:
            {
                let exp = node as Nodes.BoundConditionalGotoStatement;
                value = "<" + exp.label.name + ":JIT=" + exp.jumpIfTrue + ">";
                break;                
            }
            case Nodes.BoundNodeKind.GotoStatement:
            {
                let exp = node as Nodes.BoundGotoStatement;
                value = "<" + exp.label.name + ">";
                break;                
            }
            case Nodes.BoundNodeKind.LabelStatement:
            {
                let exp = node as Nodes.BoundLabelStatement;
                value = "<" + exp.label.name + ">";
                break;                
            }
            case Nodes.BoundNodeKind.ConversionExpression:
            {
                let exp = node as Nodes.BoundConversionExpression;
                value = "<" + exp.type.name + ">";
                break;                
            }
            case Nodes.BoundNodeKind.GetExpression:
            {
                let exp = node as Nodes.BoundGetExpression;
                value = "<" + exp.member + ":" + exp.type.name + ">";
                break;                
            }
            case Nodes.BoundNodeKind.IfStatement:
            {
                let exp = node as Nodes.BoundIfStatement;
                
                this.structure += Array(this.indent+1).join("    ");
                this.structure += "IfStatement\n";
                this.indent++;
                this.structure += Array(this.indent+1).join("    ");
                this.structure += "Condition\n";

                this.indent++;
                this.Visit(exp.condition);
                this.indent--;
                
                this.structure += Array(this.indent+1).join("    ");
                this.structure += "TrueBranch\n";
                this.indent++;                
                this.Visit(exp.trueBranch);
                this.indent--;

                if(exp.falseBranch)
                {
                    this.structure += Array(this.indent+1).join("    ");
                    this.structure += "FalseBranch\n";
                    this.indent++;                    
                    this.Visit(exp.falseBranch);
                    this.indent--;
                }
                
                this.indent--;

                return false;
            }         
        }
        
        let kind = this.boundNodeKindNames[node.kind];
        this.structure += Array(this.indent+1).join("    ") + kind + value + "\n";

        return true;
    }

    public Visit(node : Nodes.BoundNode | Nodes.BoundNode[] | Nodes.BoundGlobalScope) : void 
    {
        if(!node)
            return;
            
        var keys = Object.keys(node);

        let recurse : boolean = true;
        if(!!(node as any).kind || (node as any).kind >= 0)
            recurse = this.write(node as Nodes.BoundNode);

        if(!recurse)
            return;

        if(!!(node as any).success)
        {
            let bgs = node as Nodes.BoundGlobalScope;
            this.structure += Array(this.indent+1).join("    ") + "BoundGlobalScope\n";

            /*
            if(bgs.variables.length > 0)
            {
                this.structure += Array(this.indent+1).join("    ") + "GlobalVariables\n";
            }

            if(bgs.classes.length > 0)
            {
                this.structure += Array(this.indent+1).join("    ") + "Classes\n";
            }

            if(bgs.functions.length > 0)
            {
                this.structure += Array(this.indent+1).join("    ") + "Functions\n";
            }*/
        }

        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const element = (node as any)[key];
                
                if(!element)
                    continue;
                
                if(typeof element == "object" && typeof element.kind == "number")
                {
                    this.indent++;
                    this.Visit(element);
                    this.indent--;
                }
                else if(typeof element == "object" && typeof element.length == "number")
                {
                    this.indent++;
                    for(let i = 0; i < element.length; i++)
                    {
                        this.Visit(element[i]);
                    }
                    this.indent--;
                }
            }
        }
    }
}