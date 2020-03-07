import { Diagnostics, DiagnosticType } from "../Diagnostics/Diagnostics";
import CompilationUnit from "../Syntax/CompilationUnit";
import * as AST from "../Syntax/AST/ASTNode";
import { SyntaxType } from "../Syntax/SyntaxType";
import { Type, FunctionDetails, StructDetails, ClassType, StructType, ClassDetails } from "../../Types/TypeInformation";
import { ValueType } from "../../Types/ValueType";
import { PredefinedValueTypes } from "../../Types/PredefinedValueTypes";
import { using } from "../../../misc/disposable";
import { exhaustiveCheck } from "../../../misc/exhaustive";
import { DefinitionScope, Identifier } from "../../Scope/DefinitionScope";
import * as Nodes from "./BoundNode";
import TypeQuery from "../../Types/TypeInspection";
import TextSpan from "../Syntax/Text/TextSpan";
import BuiltinFunctions from "../BuiltinFunctions";
import Conversion from "./Conversion";
import Token from "../Syntax/Token";

// responsible for transforming a SyntaxTree into a BoundTree
// this discards syntax detail complexity and enforces semantic rules.
// it is the start of the type checker
export default class Binder
{
    private diagnostics! : Diagnostics;
    private scope!: DefinitionScope;
    
    private functionMap : { [index:string] : AST.CallableExpressionNode } = {};
    private returnStatementsInFunction! : Nodes.BoundReturnStatement[];    
    private _loopStack! : { breakLabel : Nodes.BoundLabel, continueLabel: Nodes.BoundLabel}[];
    private _labelCounter! : number;
    private _globalVariablesDefined : boolean = false;
    private _incompleteCallSites: { call : Nodes.BoundCallExpression, syntax : AST.CallExpressionSyntax }[] = [];
    private _callSitePlaceholdersValid: boolean = false;
    private _function!: Nodes.BoundFunctionDeclaration|null;

    public Bind(compilationUnit : CompilationUnit) : Nodes.BoundGlobalScope
    {
        this._labelCounter = 0;
        this._loopStack = [];
        this.returnStatementsInFunction = []; 
        this.functionMap={};
        this.scope = new DefinitionScope();
        this.diagnostics = new Diagnostics(compilationUnit.diagnostics.text, compilationUnit.diagnostics);

        const declarations = this.BindDeclarations(compilationUnit.compilationUnit.declarations);

        return new Nodes.BoundGlobalScope(this.diagnostics, declarations.variables, declarations.classes, declarations.structs, declarations.functions);
    } 
    
    private BindDeclarations(declarations : AST.DeclarationSyntax[]) : { 
        variables : Nodes.BoundVariableDeclaration[],
        classes : Nodes.BoundClassDeclaration[],
        structs : Nodes.BoundStructDeclaration[],
        functions : Nodes.BoundFunctionDeclaration[],
    }
    {
        this.returnStatementsInFunction = [];
        this._globalVariablesDefined = false;
        const variables : Nodes.BoundVariableDeclaration[] = this.BindGlobalVariableDeclarations(
            declarations.filter(d => {
                return d.kind == "VariableDeclarationSyntax";
            } ) as AST.VariableDeclarationSyntax[]
        );
        this._globalVariablesDefined = true;

        const classes : Nodes.BoundClassDeclaration[] = this.BindClassDeclarations(
            declarations.filter(d => {
                return d.kind == "ClassDeclarationStatementSyntax"
            } ) as AST.ClassDeclarationStatementSyntax[]
        );

        const structs : Nodes.BoundStructDeclaration[] = this.BindStructDeclarations(
            declarations.filter(d => {
                return d.kind == "StructDeclarationStatementSyntax"
            } ) as AST.StructDeclarationStatementSyntax[]
        );

        // three stage
        // record existance of top level functions.
        // bind call stack, putting placeholders inplace of BoundCallExpressions
        // record each time we need to create one of these.
        // second pass of the offending functions, by the second pass all functions should
        // have been bound and will just need their BoundCallExpressions updating with the 
        // correct details.
        
        const callables = declarations.filter(d => {
            return d.kind == "FunctionDeclarationStatementSyntax" ||
                   d.kind == "LambdaDeclarationStatementSyntax"
        });

        this.StoreCallableDeclarations(callables as AST.CallableExpressionNode[]);        

        this._incompleteCallSites = [];
        this._callSitePlaceholdersValid = true;
        const functions : Nodes.BoundFunctionDeclaration[] = this.BindCallableDeclarations(
            declarations.filter(d => {
                return d.kind == "FunctionDeclarationStatementSyntax" ||
                       d.kind == "LambdaDeclarationStatementSyntax"
            }) as any
        );        
        this._callSitePlaceholdersValid = false;
        
        this.FinaliseCallSites();

        return {
            variables,
            classes,
            structs,
            functions
        };
    }

    private FinaliseCallSites(): void {
        this._incompleteCallSites.forEach( cs => {
            const func = this.scope.FindVariable(cs.call.name);
            
            const callArguments = cs.syntax.callArguments.map(a => {
                const exp = this.BindExpression(a);
                return exp;
            });

            cs.call.populate(func, callArguments);
        })
    }

    private BindStatement(syntax : AST.StatementNode)  : Nodes.BoundStatement 
    {
        switch (syntax.kind)
        {
            case "FunctionDeclarationStatementSyntax" : 
                return this.BindFunctionDeclaration(syntax)
            case "LambdaDeclarationStatementSyntax" : 
                return this.BindLambdaDeclaration(syntax)
            case "BlockStatementSyntax":
                return this.BindBlockStatement(syntax);
            case "VariableDeclarationSyntax":
                return this.BindVariableDeclaration(syntax);
            case "IfStatementSyntax":
                return this.BindIfStatement(syntax);
            case "ForStatementSyntax":
                return this.BindForStatementSyntax(syntax);
            case "WhileStatementSyntax":
                return this.BindWhileStatementSyntax(syntax);                
            case "BreakStatementSyntax":
                return this.BindBreakStatement(syntax);
            case "ContinueStatementSyntax":
                return this.BindContinueStatement(syntax);                
            case "ExpressionStatementSyntax":
                return this.BindExpressionStatement(syntax);
            case "ReturnStatementSyntax" : 
                return this.BindReturnStatement(syntax); 
            case "StructDeclarationStatementSyntax" :     
                return this.BindStructDeclarationStatement(syntax);             
            case "AssignmentStatementSyntax":               
                return this.BindAssignmentStatement(syntax);                                
            case "ElseStatementSyntax" :
            case "ParameterDeclarationSyntax" : 
            case "ParameterDeclarationListSyntax" :               
            case "StructMemberDeclarationStatementSyntax" :            
            case "ClassDeclarationStatementSyntax" :       
                throw new Error("");
/*            case "ParameterDeclarationSyntax" : 
                return this.BindParameterDeclarationSyntax(syntax);
            case "ParameterDeclarationListSyntax" : 
                return this.BindParameterDeclarationSyntax(syntax); */
            default:
                return exhaustiveCheck(syntax);                
            //default:
              //  throw new Error("Unexpected syntax {syntax.Kind}");
        }
    }

    private BindReturnStatement(syntax: AST.ReturnStatementSyntax): Nodes.BoundStatement {
        let expression  : Nodes.BoundExpression | null = null;
        if(syntax.expression)
        {
            expression = this.BindExpression(syntax.expression);
            expression = this.BindConversion(syntax.expression.span(), expression, this._function!.returnType);
        }
            
        const rs = new Nodes.BoundReturnStatement(expression, syntax.span());

        this.returnStatementsInFunction.push(rs);

        return rs;
    }

    private BindForStatementSyntax(syntax: AST.ForStatementSyntax): Nodes.BoundStatement {
        const lowerBound = this.BindExpressionAndTypeCheck(syntax.lowerBound, PredefinedValueTypes.Integer);
        const upperBound = this.BindExpressionAndTypeCheck(syntax.upperBound, PredefinedValueTypes.Integer);

        let variable! : Nodes.VariableSymbol;
        let statement! : Nodes.BoundStatement;
        let breakLabel! : Nodes.BoundLabel;
        let continueLabel! : Nodes.BoundLabel;

        using(this.scope.PushScope(), () => {
            const name = syntax.identifier.lexeme;

            variable = new Nodes.VariableSymbol(name, true, PredefinedValueTypes.Integer, false);
            
            if (this.scope.FindVariable(variable.name) != Identifier.Undefined)
                this.diagnostics.reportVariableAlreadyDeclared(syntax.identifier.span, name);
            
            this.scope.DefineVariableFromSymbol(variable, PredefinedValueTypes.Integer);
     
            ({breakLabel, continueLabel, statement} = this.BindLoopBody(syntax.body));
        });

        return new Nodes.BoundForStatement(variable, lowerBound, upperBound, statement, breakLabel, continueLabel);
    }

    private BindWhileStatementSyntax(syntax: AST.WhileStatementSyntax): Nodes.BoundStatement {        
        const condition = this.BindExpressionAndTypeCheck(syntax.condition, PredefinedValueTypes.Boolean);
        
        const { breakLabel, continueLabel, statement } = this.BindLoopBody(syntax.body);

        return new Nodes.BoundWhileStatement(condition, statement, breakLabel, continueLabel);
    }
    
    private BindBreakStatement(syntax : AST.BreakStatementSyntax) : Nodes.BoundStatement
    {
        if (this._loopStack.length == 0)
        {
            this.diagnostics.reportInvalidBreakOrContinue(syntax.breakKeyword.span, syntax.breakKeyword.lexeme);
            return this.BindErrorStatement();
        }

        const breakLabel = this._loopStack[this._loopStack.length-1].breakLabel;
        return new Nodes.BoundGotoStatement(breakLabel);
    }

    private BindContinueStatement(syntax : AST.ContinueStatementSyntax) : Nodes.BoundStatement
    {
        if (this._loopStack.length == 0)
        {
            this.diagnostics.reportInvalidBreakOrContinue(syntax.continueKeyword.span, syntax.continueKeyword.lexeme);
            return this.BindErrorStatement();
        }

        const continueLabel = this._loopStack[this._loopStack.length-1].continueLabel;
        return new Nodes.BoundGotoStatement(continueLabel);
    }

    private BindLoopBody(body : AST.StatementNode) : { breakLabel : Nodes.BoundLabel, continueLabel : Nodes.BoundLabel, statement : Nodes.BoundStatement }
    {
        this._labelCounter++;
        const breakLabel = new Nodes.BoundLabel(`break${this._labelCounter}`);
        const continueLabel = new Nodes.BoundLabel(`continue${this._labelCounter}`);

        this._loopStack.push({ breakLabel, continueLabel });
        let statement : Nodes.BoundStatement|null = null; 
        using(this.scope.PushScope(), () => {     
            statement = this.BindStatement(body);
        });
        this._loopStack.pop();

        if(breakLabel == null ||
            continueLabel == null ||
            statement == null)
            throw new Error("Unexpected Null");

        return { breakLabel, continueLabel, statement };
    }

    private BindExpressionStatement(syntax: AST.ExpressionStatementSyntax): Nodes.BoundStatement {
        const expression = this.BindExpression(syntax.expression);
        return new Nodes.BoundExpressionStatement(expression);
    }

    private BindIfStatement(syntax: AST.IfStatementSyntax): Nodes.BoundStatement {
        const condition = this.BindExpressionAndTypeCheck(syntax.condition, PredefinedValueTypes.Boolean);
        const trueStatement = this.BindStatement(syntax.trueBranch);
        const falseStatement = syntax.falseBranch == null ? null : this.BindStatement(syntax.falseBranch.body);
        return new Nodes.BoundIfStatement(condition, trueStatement, falseStatement);
    }

    private BindClassDeclarations(declarations: AST.ClassDeclarationStatementSyntax[]): Nodes.BoundClassDeclaration[] {
        return declarations.map(d => this.BindClassDeclaration(d));
    }

    private BindClassDeclaration(declaration: AST.ClassDeclarationStatementSyntax): Nodes.BoundClassDeclaration {
        const name = declaration.identifier.lexeme;

        const type = new ClassType(name);
        this.scope.DefineType(name, type);

        const boundDeclarations = this.BindDeclarations(declaration.declarations);        
        type.classDetails = new ClassDetails(name, 
            boundDeclarations.classes,
            boundDeclarations.variables,
            boundDeclarations.functions);

        return new Nodes.BoundClassDeclaration(name,
            boundDeclarations.variables,
            boundDeclarations.classes,
            boundDeclarations.functions);
    }
    
    private BindGlobalVariableDeclarations(declarations: AST.VariableDeclarationSyntax[]): Nodes.BoundVariableDeclaration[]
    {
        return declarations.map(d => this.BindGlobalVariableDeclaration(d));
    }

    private BindGlobalVariableDeclaration(declaration: AST.VariableDeclarationSyntax): Nodes.BoundVariableDeclaration
    {
        return this.BindVariableDeclaration(declaration);
    }

    private BindVariableDeclaration(syntax : AST.VariableDeclarationSyntax) : Nodes.BoundVariableDeclaration
    {
        const name = syntax.identifier.lexeme;
        const isReadOnly = syntax.declarationTypeToken.kind == SyntaxType.LetKeyword;

        let type : Type | null = null;

        if(syntax.typeName)
        {
            type = TypeQuery.getTypeFromTypeSyntax(syntax.typeName, this.scope);
        }

        let initialiser : Nodes.BoundExpression | null = null;        
        if(syntax.initialiserExpression)
        {
            initialiser = this.BindExpression(syntax.initialiserExpression);

            // if we have a declared type
            if(type)
                // checkto make sure we can convert the initialiser to that type.
                initialiser = this.BindConversion(syntax.initialiserExpression.span(), initialiser, type);
        }
        else
            initialiser = this.BindDefaultExpressionForType(syntax.typeName!);            

        if(!type)
            type = initialiser.type

        const variable = new Nodes.VariableSymbol(name, isReadOnly, type, !this._globalVariablesDefined);

        const node = new Nodes.BoundVariableDeclaration(variable, initialiser);

        if (this.scope.FindVariable(variable.name) != Identifier.Undefined)
            this.diagnostics.reportVariableAlreadyDeclared(syntax.identifier.span, name);
        else
            this.scope.DefineVariableFromDeclaration(variable.name, node, variable);

        return node;
    }
    
    private BindStructDeclarations(declarations: AST.StructDeclarationStatementSyntax[]): Nodes.BoundStructDeclaration[] {
        return declarations.map(d => this.BindStructDeclarationStatement(d));
    }    

    private BindStructDeclarationStatement(syntax : AST.StructDeclarationStatementSyntax) : Nodes.BoundStructDeclaration
    {
        const name = syntax.identifier.lexeme;

        const type = new StructType(name);
        this.scope.DefineType(name, type);
        
        const boundDeclarations = this.BindStructMemberDeclarations(syntax, syntax.declarations);

        type.structDetails = new StructDetails(name, boundDeclarations);

        return new Nodes.BoundStructDeclaration(name, boundDeclarations);
    }

    private BindStructMemberDeclarations(structSyntax : AST.StructDeclarationStatementSyntax, declarations: AST.StructMemberDeclarationStatementSyntax[]) : Nodes.BoundStructMemberDeclaration[]
    {
        let names = declarations.map ( d => d.identifier.lexeme );
        let nameToDeclaration : { [index:string] : AST.StructMemberDeclarationStatementSyntax } = {};        
        let nameCount : { [index:string] : number } = {};

        for(let declaration of declarations)
        {
            nameToDeclaration[declaration.identifier.lexeme] = declaration;
            nameCount[declaration.identifier.lexeme] = (nameCount[declaration.identifier.lexeme] | 0) + 1;
        }

        for(let name of names)
        {
            if(nameCount[name] > 1)
                this.diagnostics.reportDuplicateStructMember(structSyntax.identifier.lexeme, name, nameToDeclaration[name].span());
        }

        const boundDeclarations : Nodes.BoundStructMemberDeclaration [] = [];

        for(let declaration of declarations)
        {
            const memberType = TypeQuery.getTypeFromTypeSyntax(declaration.typeName, this.scope, true);            

            if(memberType.type === PredefinedValueTypes.Unit.type)
            {
                this.diagnostics.reportInvalidTypeName(nameToDeclaration[name].typeName.identifier);
            }

            boundDeclarations.push(new Nodes.BoundStructMemberDeclaration(
                declaration.identifier.lexeme,
                memberType
            ));
        }

        return boundDeclarations;
    }

    private BindDefaultExpressionForType(typeName: AST.TypeNameSyntax): Nodes.BoundExpression {        
        const type = TypeQuery.getTypeFromTypeSyntax(typeName, this.scope);
        const value = TypeQuery.getDefaultValueForType(type, this.scope);

        return new Nodes.BoundLiteralExpression(value, type);
    }

    private BindBlockStatement(syntax: AST.BlockStatementSyntax): Nodes.BoundBlockStatement {
        let statements : Nodes.BoundStatement[] = [];
        
        using(this.scope.PushScope(), () => {
            for(let statementSyntax of syntax.statements)
            {
                const statement = this.BindStatement(statementSyntax);
                statements.push(statement);
            }
        });

        return new Nodes.BoundBlockStatement(statements);
    }

    private StoreCallableDeclarations(nodes: AST.CallableExpressionNode[]) : void 
    {
        for(let n of nodes)
            this.StoreCallableDeclaration(n.identifier.lexeme, n);                                                
    }

    private BindCallableDeclarations(nodes: AST.CallableExpressionNode[]): Nodes.BoundFunctionDeclaration[] 
    {
        const declarations : Nodes.BoundFunctionDeclaration[] = [];

        for(let n of nodes)
        {
            switch(n.kind)
            {
                case "FunctionDeclarationStatementSyntax":
                    declarations.push(this.BindFunctionDeclaration(n));
                    break;
                case "LambdaDeclarationStatementSyntax":
                    declarations.push(this.BindLambdaDeclaration(n));
                    break;             
                default:
                    return exhaustiveCheck(n);
            }            
        }

        return declarations;
    }

    private BindFunctionDeclaration(node: AST.FunctionDeclarationStatementSyntax): Nodes.BoundFunctionDeclaration 
    {        
        return this.BindFunction(node.identifier, node.parameterList, node.body, node.returnValue)
    }

    private BindFunction(identifier : Token, parameterList : AST.ParameterDeclarationListSyntax,
        body : AST.BlockStatementSyntax, returnValue : AST.TypeNameSyntax) : Nodes.BoundFunctionDeclaration
    {
        const parameters = this.BindFunctionParameterList(parameterList);

        let declaration : Nodes.BoundFunctionDeclaration;

        const returnType = TypeQuery.getTypeFromTypeSyntax(returnValue, this.scope);

        declaration = new Nodes.BoundFunctionDeclaration(identifier.lexeme, parameters, returnType, undefined);

        this._function = declaration;

        this.scope.DefineFunction(identifier.lexeme, declaration);

        using(this.scope.PushArguments(parameters.map(p => p.name), parameters.map(p => p.type), parameters.map(p => p.variable)), () => {
            const boundBody = this.BindBlockStatement(body);
            
            const returns = this.returnStatementsInFunction.slice();

            returns.map( rs => {
                if(rs.expression == null)
                {
                    if(returnType.type != ValueType.Unit)
                        this.diagnostics.reportExpressionConvertableToTypeRequired(returnType, rs.span);
                }
                else
                {
                    if(rs.expression.kind === Nodes.BoundNodeKind.ErrorExpression)
                    {
                        // already dealt with
                    }
                    else if(returnType.type == ValueType.Unit)
                        this.diagnostics.reportFunctionReturnsVoid(identifier.lexeme, rs.span);
                    else if(!rs.expression.type.isAssignableTo(returnType))
                        this.diagnostics.reportNotAssignableToType(rs.expression.type, returnType, rs.span);
                }
            }); 

            declaration.defineBody(boundBody);            
        });

        this.returnStatementsInFunction = [];
        this._function = null;

        return declaration!;
    }

    private StoreCallableDeclaration(lexeme: string, node: AST.CallableExpressionNode) : void
    {
        this.functionMap[lexeme] = node;
    }

    private StoreIncompleteCallSite(call : Nodes.BoundCallExpression, syntax : AST.CallExpressionSyntax) : void
    {
        this._incompleteCallSites.push( { call, syntax } );
    }

    private BindLambdaDeclaration(node: AST.LambdaDeclarationStatementSyntax): Nodes.BoundFunctionDeclaration 
    {        
        const parameters = this.BindFunctionParameterList(node.parameterList);

        const returnType = TypeQuery.getTypeFromTypeSyntax(node.returnValue, this.scope);

        const declaration = new Nodes.BoundFunctionDeclaration(node.identifier.lexeme,
            parameters,          
            returnType,      
            undefined);

        const definition = this.scope.DefineFunction(node.identifier.lexeme, declaration);

        using(this.scope.PushArguments(parameters.map(p => p.name), parameters.map(p => p.type), parameters.map(p => p.variable)), () => {
            const body = this.BindExpression(node.body);
                 
            if(!body.type.isAssignableTo(returnType))
                this.diagnostics.reportNotAssignableToType(body.type, returnType, node.body.span());

            const returnStatement = new Nodes.BoundReturnStatement(body, node.body.span());
            const block = new Nodes.BoundBlockStatement([returnStatement]);
            
            declaration.defineBody(block);            
        });

        definition.type.setFunctionReturnType(returnType);
       
        return declaration!;
    }

    private BindFunctionParameterList(parameters : AST.ParameterDeclarationListSyntax) : Nodes.ParameterDeclaration[]
    {
        let declarations : Nodes.ParameterDeclaration[] = [];

        for(let p of parameters.params)
            declarations.push(this.BindFunctionParameter(p));

        return declarations;
    }

    private BindFunctionParameter(parameter : AST.ParameterDeclarationSyntax) : Nodes.ParameterDeclaration
    {    
        const name = parameter.identifier.lexeme;        
        
        const type = TypeQuery.getTypeFromTypeSyntax(parameter.typeName, this.scope);

        const variable = new Nodes.VariableSymbol(name, false, type, false, true);

        return new Nodes.ParameterDeclaration(name, type, variable);
    }

    private BindExpressionAndTypeCheck(syntax : AST.ExpressionNode, targetType : Type) : Nodes.BoundExpression
    {
        const exp = this.BindExpression(syntax);
        const result = this.BindConversion(syntax.span(), exp, targetType);
        
        if (!result.type.isAssignableTo(targetType))
            this.diagnostics.reportCannotConvert(syntax.span(), result.type, targetType);

        return result;
    }

    private BindExpression(syntax: AST.ExpressionNode) : Nodes.BoundExpression
    {
        switch(syntax.kind)
        {
            case "FloatLiteralExpressionSyntax":
                return new Nodes.BoundLiteralExpression(parseFloat(syntax.literalToken.lexeme), PredefinedValueTypes.Float);
            case "BooleanLiteralExpressionSyntax":
                const boolLiteral = syntax.literalToken.lexeme === "true";
                return new Nodes.BoundLiteralExpression(boolLiteral, PredefinedValueTypes.Boolean);
            case "StringLiteralExpressionSyntax":
                return new Nodes.BoundLiteralExpression(syntax.literalToken.lexeme, PredefinedValueTypes.String);
            case "IntegerLiteralExpressionSyntax":
                return new Nodes.BoundLiteralExpression(parseInt(syntax.literalToken.lexeme), PredefinedValueTypes.Integer);
            case "NullLiteralExpressionSyntax":
                return new Nodes.BoundLiteralExpression(0, PredefinedValueTypes.Null);                
            case "ParenthesizedExpressionSyntax":
                return this.BindExpression(syntax.expression);                
            case "BinaryExpressionSyntax":
                return this.BindBinaryExpression(syntax);
            case "UnaryExpressionSyntax":
                return this.BindUnaryExpression(syntax);                                            
            case "NameExpressionSyntax":
                return this.BindNameExpression(syntax);
            case "CallExpressionSyntax":                 
                return this.BindCallExpression(syntax);                        
            case "GetExpressionSyntax":               
                return this.BindGetExpression(syntax);              
            case "DereferenceExpressionSyntax":
                return this.BindDereferenceExpression(syntax);
            case "TypeNameSyntax":             
            case "ArrayIndexExpressionSyntax":            
                throw new Error("Not Implemented");
        }
    }
    
    private BindGetExpression(syntax: AST.GetExpressionSyntax) : Nodes.BoundExpression {
        const left = this.BindExpression(syntax.left);
        
        if(!left.type.isStruct)
        {
            this.diagnostics.reportExpectedClass(syntax.left.span(), syntax.name.lexeme);
            return new Nodes.BoundErrorExpression();
        }

        //if(left.type.isPointer)
        //{
            // we will automatically dereference one
        //}
        const structDetails = left.type.structDetails!;
        const structName = structDetails.structName;
        const result = structDetails.get(syntax.name.lexeme);

        if(!result)
        {                        
            this.diagnostics.reportUndefinedStructMember(structName, syntax.name.lexeme, syntax.span());
            return new Nodes.BoundErrorExpression();        
        }   
        
        return new Nodes.BoundGetExpression(left, result.type, result.name);
    }

    BindNameExpression(syntax: AST.NameExpressionSyntax): Nodes.BoundVariableExpression 
    {
        const name = syntax.identifierToken.lexeme;

        if (!name && name.length == 0)
        {
            // This means the token was inserted by the parser. We already
            // reported error so we can just return an error expression.
            return new Nodes.BoundVariableExpression(Identifier.Undefined);
        }

        const identifier = this.scope.FindVariable(name);

        if (!identifier)
        {
            this.diagnostics.reportUndefinedName(syntax.identifierToken.span, name);
            return new Nodes.BoundVariableExpression(Identifier.Undefined);
        }

        return new Nodes.BoundVariableExpression(identifier);
    }

    private BindCallExpression(syntax: AST.CallExpressionSyntax): Nodes.BoundExpression 
    {
        const name = syntax.nameExpression.identifierToken.lexeme;
        const variableFound = this.BindExpression(syntax.nameExpression) as Nodes.BoundVariableExpression;
        const declaration = this.functionMap[name];
        
        const typeConversionCall = TypeQuery.getTypeFromName(syntax.nameExpression.identifierToken.lexeme, this.scope, true);

        if (syntax.callArguments.length == 1 && typeConversionCall.type != ValueType.Unit && typeConversionCall.isPredefined)
        {
            const argument = this.BindExpression(syntax.callArguments[0]);
            return this.BindConversion(syntax.callArguments[0].span(), argument, typeConversionCall, true);
        }
            
        let variable : Identifier | null = null;
        
        if(variableFound && variableFound.variable != Identifier.Undefined)
        {
            variable = variableFound.variable;
        }

        let callName = name;
        let returnType : Type;
        let builtin : Type | null = null;

        if(!declaration)
        {
            const func = BuiltinFunctions.find(name);
            if(!!func)
            {
                builtin = func.type;
                callName = name;
                returnType = builtin
            }
            else
            {
                this.diagnostics.reportUndefinedName(syntax.nameExpression.span(), name);
                return new Nodes.BoundErrorExpression();                
            }
        }
        else
        {
            callName = declaration.identifier.lexeme;
            returnType = TypeQuery.getTypeFromTypeSyntax(declaration.returnValue, this.scope);
        }

        // if we have not found a definition and we are currently NOT allowed to make placeholders we have an error
        if (!this._callSitePlaceholdersValid && variable == Identifier.Undefined)
        {
            this.diagnostics.reportUndefinedName(syntax.nameExpression.span(), name);
            return new Nodes.BoundErrorExpression();
        } // if we have not found a definition and we are currently allowed to make placeholders
        else if(this._callSitePlaceholdersValid && (!variable || variable == Identifier.Undefined) && !builtin)
        {
            const callExpression = new Nodes.BoundCallExpression(name, returnType);

            this.StoreIncompleteCallSite(callExpression, syntax);

            return callExpression;

        } // if we found a definition then lets just get on with it.       
        else if(variable != Identifier.Undefined || !!builtin)
        {
            const declaredParameters : Type[] = (!!variable && variable != Identifier.Undefined) ? variable!.type.function!.parameterTypes : builtin!.function!.parameterTypes || [];

            if(declaredParameters.length != syntax.callArguments.length)
            {
                this.diagnostics.reportIncorrectArgumentCount(declaredParameters.length, syntax.callArguments.length, syntax.span());
            }

            const parameters = syntax.callArguments.map( node => {
                return {
                    expression : this.BindExpression(node),
                    span : node.span
                };
            });        

            for(let i = 0; i < Math.min(parameters.length, declaredParameters.length); i++)
            {
                if(!parameters[i].expression.type.isAssignableTo( declaredParameters[i] ))
                {
                    this.diagnostics.reportCannotConvertParameter(parameters[i].expression.type, declaredParameters[i], parameters[i].span());
                }
            }

            const callExpression = new Nodes.BoundCallExpression(syntax.nameExpression.identifierToken.lexeme, returnType);
            
            if(variable && variable != Identifier.Undefined)
            {            
                callExpression.populate(variable!, parameters.map( p => p.expression ));
            }
            else
            {
                const variableIdentifier = new Identifier(name, builtin!);
                callExpression.populate(variableIdentifier, parameters.map( p => p.expression ));
            }

            // no need to store this one as it is complete as is.
            return callExpression;
        }

        throw new Error("");
    }

    private validateCallsiteParameters(parameters : Type[], callArguments : Type[], span : TextSpan) 
    {

    }

    private BindBinaryExpression(syntax : AST.BinaryExpressionSyntax) : Nodes.BoundExpression
    {
        let boundLeft =  this.BindExpression(syntax.left);
        let boundRight = this.BindExpression(syntax.right);

        let boundOperator = Nodes.BoundBinaryOperator.Bind(syntax.operatorToken.kind, boundLeft.type, boundRight.type);

        if (boundOperator == null)
        {
            const leftToRight = this.BindConversion(syntax.span(), boundLeft, boundRight.type, false, false);

            if(leftToRight.kind == Nodes.BoundNodeKind.ErrorExpression)
            {            
                const rightToLeft = this.BindConversion(syntax.span(), boundRight, boundLeft.type, false, false);

                if(rightToLeft.kind == Nodes.BoundNodeKind.ErrorExpression)
                {
                    this.diagnostics.reportUndefinedBinaryOperator(syntax.operatorToken.span, 
                        syntax.operatorToken.lexeme, boundLeft.type, boundRight.type);                            
                    
                    return boundLeft;
                }
                else
                {
                    boundRight = rightToLeft;
                }
            }
            else
            {                
                boundLeft = leftToRight;
            }

            boundOperator = Nodes.BoundBinaryOperator.Bind(syntax.operatorToken.kind, boundLeft.type, boundRight.type);

            if(boundOperator == null)
            {
                this.diagnostics.reportUndefinedBinaryOperator(syntax.operatorToken.span, 
                    syntax.operatorToken.lexeme, boundLeft.type, boundRight.type);                            
                
                return boundLeft;
            }
        }

        return new Nodes.BoundBinaryExpression(boundLeft, boundOperator, boundRight);        
    }

    private BindUnaryExpression(syntax : AST.UnaryExpressionSyntax) : Nodes.BoundExpression
    {
        const boundOperand = this.BindExpression(syntax.operand);
        const boundOperator = Nodes.BoundUnaryOperator.Bind(syntax.operatorToken.kind, boundOperand.type);

        if (boundOperator == null)
        {
            this.diagnostics.reportUndefinedUnaryOperator(syntax.operatorToken.span, syntax.operatorToken.lexeme, boundOperand.type);
            return boundOperand;
        }

        return new Nodes.BoundUnaryExpression(boundOperator, boundOperand);
    }

    private BindAssignmentStatement(syntax : AST.AssignmentStatementSyntax) : Nodes.BoundStatement
    {
        switch(syntax.target.kind)
        {
            case "NameExpressionSyntax":
                return this.BindAssignToVariableStatement(syntax.target, syntax.expression);
            case "GetExpressionSyntax":
                return this.BindAssignToGetExpressionStatement(syntax.target, syntax.expression);
            case "DereferenceExpressionSyntax":
                return this.BindAssignToDereferenceExpressionStatement(syntax.target, syntax.expression);                
            case "ArrayIndexExpressionSyntax":
                return this.BindAssignToArrayIndexExpressionStatement(syntax.target, syntax.expression);                
        }
    }

    private BindAssignToVariableStatement(target: AST.NameExpressionSyntax, source : AST.ExpressionNode): Nodes.BoundStatement {
        const identifier = this.BindNameExpression(target);
        const right = this.BindExpression(source);
        const convertedExpression = this.BindConversion(source.span(), right, identifier.type);

        return new Nodes.BoundAssignmentStatement(identifier, convertedExpression);
    }

    BindAssignToGetExpressionStatement(target: AST.GetExpressionSyntax, expression: AST.ExpressionNode): Nodes.BoundStatement 
    {
        const left = this.BindGetExpression(target);
        const right = this.BindExpression(expression);

        const convertedExpression = this.BindConversion(expression.span(), right, left.type);

        return new Nodes.BoundAssignmentStatement(left, convertedExpression);
    }

    BindAssignToDereferenceExpressionStatement(target: AST.DereferenceExpressionSyntax, expression: AST.ExpressionNode): Nodes.BoundStatement 
    {
        const left = this.BindDereferenceExpression(target);
        const right = this.BindExpression(expression);

        const convertedExpression = this.BindConversion(expression.span(), right, left.type);

        return new Nodes.BoundAssignmentStatement(left, convertedExpression);
    }

    BindDereferenceExpression(syntax: AST.DereferenceExpressionSyntax) : Nodes.BoundExpression{
        const operand = this.BindExpression(syntax.operand);
        if(syntax.operatorToken.kind !== SyntaxType.Star)
        {
            this.diagnostics.report("Dereference expression received with incorrect operator syntax", DiagnosticType.AssignmentRequiresLValue, syntax.operatorToken.span);
            return new Nodes.BoundErrorExpression();            
        }

        if(!operand.type.isPointer)
        {
            this.diagnostics.report("Cannot Dereference Non Pointer Type", DiagnosticType.AssignmentRequiresLValue, syntax.operatorToken.span);
            return new Nodes.BoundErrorExpression();            
        }

        return new Nodes.BoundDereferenceExpression(operand, operand.type.pointerToType!);
    }

    BindAssignToArrayIndexExpressionStatement(target: AST.ArrayIndexExpressionSyntax, expression: AST.ExpressionNode): Nodes.BoundExpression
    {
        throw new Error("Arrays not implemented yet.");
    }
    
    private BindErrorStatement() : Nodes.BoundStatement
    {
        return new Nodes.BoundExpressionStatement(new Nodes.BoundErrorExpression());
    }
    
    private BindConversion(diagnosticSpan : TextSpan, expression : Nodes.BoundExpression, type : Type, allowExplicit : boolean = false, logDiagnostics : boolean = true) : Nodes.BoundExpression
    {
        const conversion = Conversion.classifyConversion(expression.type, type);

        if (!conversion.Exists)
        {
            if(logDiagnostics)
                this.diagnostics.reportCannotConvert(diagnosticSpan, expression.type, type);
            return new Nodes.BoundErrorExpression();
        }

        if (!allowExplicit && conversion.IsExplicit)
        {
            if(logDiagnostics)
                this.diagnostics.reportCannotConvertImplicitly(diagnosticSpan, expression.type, type);
            return new Nodes.BoundErrorExpression();
        }

        if (conversion.IsIdentity)
            return expression;

        if(conversion.IsImmediate)
        {
            return new Nodes.BoundLiteralExpression(conversion.ConvertToValue, type);
        }

        if(conversion.IsImplicit)
        {
            return new Nodes.BoundConversionExpression(conversion.ConvertTo, expression);
        }

        return new Nodes.BoundConversionExpression(type, expression);
    }
}