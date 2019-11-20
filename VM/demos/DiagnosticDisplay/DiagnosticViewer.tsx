import * as React from "react";
import TextSpan from "../../Language/Compiler/Syntax/Text/TextSpan";
import * as AST from "../../Language/Compiler/Syntax/AST/ASTNode";
import { SyntaxType } from "../../Language/Compiler/Syntax/SyntaxType";
import { Diagnostic } from "../../Language/Compiler/Diagnostics/Diagnostics";
import SyntaxTrivia from "../../Language/Compiler/Syntax/SyntaxTrivia";
import Token from "../../Language/Compiler/Syntax/Token";

interface DiagnosticViewerProps
{
    span:TextSpan;
    message:string;
    onMouseOver:(span:TextSpan)=>void;
}

export class DiagnosticViewer extends React.Component<DiagnosticViewerProps, {}>
{
    constructor(props){
        super(props);
    }

    render()
    {
        return <div onMouseEnter={ e => this.props.onMouseOver(this.props.span) }
                    onMouseLeave={ e => this.props.onMouseOver(null) }>
            {this.props.message}       
        </div>;
    }
}

interface LosslessParseTreeViewProps
{
    compilationUnit:AST.CompilationUnitSyntax;
    onMouseOver:(span:TextSpan)=>void;
    onClick:(span:TextSpan)=>void;
}

interface IParseTreeNavigator<T>
{
    visitCompilationUnit(node : AST.CompilationUnitSyntax) : T;

    visitSyntaxNode(node : AST.SyntaxNode) : T;
    visitSyntaxNodeDetail(node : AST.SyntaxNode, children:T[]) : T; 
    
    visitToken(token : Token) : T;

    visitTrivia(trivia : SyntaxTrivia[]) : T[];
    
    visitNodeChildren(node : AST.SyntaxNode | AST.CompilationUnitSyntax) : T[];
    wrapChildren(children: T[]): T;
}

export class ParseTreeLambdaNavigator<T> implements IParseTreeNavigator<T>
{
    private readonly _visitCompilationUnitDetail : (node : AST.CompilationUnitSyntax, children:T[]) => T;
    private readonly _visitSyntaxNodeDetail : (node : AST.SyntaxNode, children:T[]) => T;
    private readonly _visitTokenDetail : (leadingTrivia : T[], token : Token, trailingTrivia : T[]) => T;
    private readonly _visitTrivia : (trivia : SyntaxTrivia) => T;
    private readonly _wrapChildren : (children: T[]) => T;

    constructor(
        visitCompilationUnitDetail : (node : AST.CompilationUnitSyntax, children:T[]) => T,
        visitSyntaxNodeDetail : (node : AST.SyntaxNode, children:T[]) => T,
        visitTokenDetail : (leadingTrivia : T[], token : Token, trailingTrivia : T[]) => T,
        visitTrivia : (trivia : SyntaxTrivia) => T,
        wrapChildren : (children: T[]) => T)
    {
        this._visitCompilationUnitDetail = visitCompilationUnitDetail;
        this._visitSyntaxNodeDetail = visitSyntaxNodeDetail;
        this._visitTokenDetail  = visitTokenDetail;
        this._visitTrivia  = visitTrivia;
        this._wrapChildren = wrapChildren;
    }

    visitCompilationUnit(node : AST.CompilationUnitSyntax) : T
    {   
        let children = this.visitNodeChildren(node);             
        return this._visitCompilationUnitDetail(node, children);        
    }

    visitSyntaxNode(node : AST.SyntaxNode) : T    
    {   
        let children = this.visitNodeChildren(node);             
        return this._visitSyntaxNodeDetail(node, children);            
    }

    visitSyntaxNodeDetail(node : AST.SyntaxNode, children:T[]) : T
    {
        return this._visitSyntaxNodeDetail(node, children);
    }

    visitToken(token : Token) : T
    {
        let leadingTrivia = this.visitTrivia(token.leadingTrivia);
        let trailingTrivia = this.visitTrivia(token.trailingTrivia);

        return this._visitTokenDetail(leadingTrivia, token, trailingTrivia);    
    }

    visitTrivia(trivia:SyntaxTrivia[]) : T[]
    {
        return trivia.map( (t) => {
            return this._visitTrivia(t);
        });
    }

    wrapChildren(children: T[]): T
    {
        return this._wrapChildren(children);
    }

    public visitNodeChildren(node : AST.SyntaxNode | AST.CompilationUnitSyntax) : T[]
    {
        var keys = Object.keys(node);

        return keys.filter( (key) => node.hasOwnProperty(key) )
            .map( (key) => {
                const element = (node as any)[key];
                if(!element)
                {
                    return null;
                }
                else if(typeof element == "object" && typeof element.lexeme == "string")
                {
                    return this.visitToken(element);
                }
                else if(typeof element == "object" && typeof element.kind == "string")
                {
                    return this.visitSyntaxNode(element);
                }
                else if(typeof element == "object" && typeof element.length == "number")
                {
                    let children = element.map( (e) => this.visitSyntaxNode(e) );

                    return this.wrapChildren(children);
                }
                else
                    return null;
            });
    }
}

interface LosslessParseTreeViewState
{
    selectedSpan?:TextSpan;
}

export class LosslessParseTreeView extends React.Component<LosslessParseTreeViewProps, LosslessParseTreeViewState>
{
    constructor(props){
        super(props);

        this.state = {
            selectedSpan:null
        };
    }

    onMouseOver(textspan:TextSpan)
    {
        this.setState({ selectedSpan:textspan });
        this.props.onMouseOver(textspan);
    }
    
    visitCompilationUnitDetail(node : AST.CompilationUnitSyntax, children : JSX.Element[]) : JSX.Element
    {
        let textspan = node.span();
        let selectedClass = this.isSelected(textspan) ? "selected-tree-view-node" : "";
        return <div className={selectedClass} style={ { marginLeft:"1em"} } onClick={ e => this.props.onClick(textspan) } >
            <span onMouseEnter={ e => this.onMouseOver(textspan) }
                  onMouseLeave={ e => this.onMouseOver(null) }>
                {node.kind} ({textspan.start}, {textspan.length})
            </span>
            { children }
        </div>;
    }

    visitSyntaxNodeDetail(node : AST.SyntaxNode, children:JSX.Element[]) : JSX.Element
    {
        let textspan = node.span();        
        let selectedClass = this.isSelected(textspan) ? "selected-tree-view-node" : "";
        return <div className={selectedClass} style={ { marginLeft:"1em"} } onClick={ e => this.props.onClick(textspan) } >
            <span onMouseEnter={ e => this.onMouseOver(textspan) }
                     onMouseLeave={ e => this.onMouseOver(null) }>
                {node.kind} ({textspan.start}, {textspan.length})
            </span>
            { children }
        </div>;
    }

    visitTokenDetail(leadingTrivia : JSX.Element[], token : Token, trailingTrivia : JSX.Element[]) : JSX.Element
    {
        let textspan = token.span;
        let selectedClass = this.isSelected(textspan) ? "selected-tree-view-node" : "";
        return <div className={selectedClass} style={ { marginLeft:"1em"} } onClick={ e => this.props.onClick(textspan) } >
            <div>
                {leadingTrivia}
            </div>
            <div onMouseEnter={ e => this.onMouseOver(textspan) }
                 onMouseLeave={ e => this.onMouseOver(null) }>
                 Token &nbsp;<span>{token.lexeme} ({textspan.start}, {textspan.length})</span>
            </div>
            <div>
                {trailingTrivia}
            </div>
        </div>;
    }

    visitTrivia(trivia:SyntaxTrivia) : JSX.Element
    {
        let textspan = trivia.span;
        let selectedClass = this.isSelected(textspan) ? "selected-tree-view-node" : "";
        return <div className={selectedClass} onMouseEnter={ e => this.onMouseOver(textspan) }
                      onMouseLeave={ e => this.onMouseOver(textspan) }
                      onClick={ e => this.props.onClick(null) } >
            { SyntaxType[trivia.kind] } <pre style={ { display:"inline"} }>"{ trivia.lexeme }" ({textspan.start}, {textspan.length})</pre>
        </div>;
    }

    wrapChildren(children: JSX.Element[]): JSX.Element {
        return <div>{children}</div>
    }

    
    isSelected(span:TextSpan) : boolean
    {
        return this.state.selectedSpan && 
                this.state.selectedSpan.start === span.start &&
                this.state.selectedSpan.length === span.length;
    }

    render()
    {
        var renderer = new ParseTreeLambdaNavigator<JSX.Element>(
            this.visitCompilationUnitDetail.bind(this),
            this.visitSyntaxNodeDetail.bind(this),            
            this.visitTokenDetail.bind(this),
            this.visitTrivia.bind(this),
            this.wrapChildren.bind(this)
        );

        return renderer.visitCompilationUnit(this.props.compilationUnit);
    }
}