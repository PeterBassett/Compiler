import * as React from "react";
import Parser from "../../Language/Compiler/Syntax/Parser";
import Lexer from "../../Language/Compiler/Syntax/Lexer";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import CompilationUnit from "../../Language/Compiler/Syntax/CompilationUnit";
import { Diagnostic, Diagnostics } from "../../Language/Compiler/Diagnostics/Diagnostics";
import TextSpan from "../../Language/Compiler/Syntax/Text/TextSpan";
import StringDiagnosticsPrinter from "../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";
import * as CodeMirror from 'react-codemirror';
import "codemirror/addon/selection/active-line";
import { LosslessParseTreeView, DiagnosticViewer } from "../DiagnosticDisplay/DiagnosticViewer";
import Binder from "../../Language/Compiler/Binding/Binder";
import { BoundGlobalScope } from "../../Language/Compiler/Binding/BoundNode";
import GeneratedCode from "../../Language/Compiler/CodeGeneration/GeneratedCode";
import CodeGenerator from "../../Language/Compiler/CodeGeneration/CodeGenerator";
import Lowerer from "../../Language/Compiler/Lowering/Lowerer";
import BoundTreeStructureVisitor from "../../tests/Compiler/BoundTreeStructureVisitor";

interface CodeEditorState
{
    source:SourceText;
    highlightSpan?:TextSpan;
    compilationUnit: CompilationUnit;
    boundTree : BoundGlobalScope;
    diagnostics : Diagnostics;
    asmCode : GeneratedCode;
    boundTreeText : string;
    loweredTreeText : string;
    mode:number;
}

interface CodeEditorProps
{
    asmFileName:string;
}

export default class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState>
{
    private codemirror : ReactCodeMirror.ReactCodeMirror;
    private widgets : CodeMirror.LineWidget[] = [];
    private textMarks : CodeMirror.TextMarker[] = [];

    constructor(props){
        super(props);
        
        this.state = {mode:1, 
            asmCode:null,
            boundTreeText:null,
            loweredTreeText:null,
            source : new SourceText(`
/*
this 
is 
a 
multiline 
commnent
*/

func fib(n:int):int { // this is a single line comment
    if (n == 0 || n == 1) {
        return n;
    } else { /* 

this is a multiline comment

    */
        return fib(n - 1) + fib(n - 2);
    }
}

func main() : int {
    let n : int = 5;
    return fib(n);
}`), highlightSpan:null, diagnostics : null, compilationUnit : null, boundTree:null};
    }

    componentDidUpdate()
    {
        if(!this.codemirror)
            return;

        let instance = this.codemirror.getCodeMirror();

        this.clearDiagnosticMessages();

        for(let i = 0; i < this.state.compilationUnit.diagnostics.length; i++)
        {            
            let diagnostic = this.state.compilationUnit.diagnostics.get(i);
            this.addDiagnosticWidget(instance, diagnostic);
        }        
    }

    clearDiagnosticMessages(): void 
    {
        for(let i = 0; i < this.widgets.length; i++)    
            this.widgets[i].clear();
        this.widgets = [];

        for(let i = 0; i < this.textMarks.length; i++)    
            this.textMarks[i].clear();            
        this.textMarks = [];
    }

    addDiagnosticWidget(instance : CodeMirror.Editor, diagnostic : Diagnostic) : void
    {
        let coords = this.state.source.textSpanToRowColRange(diagnostic.span);

        let from = {line: coords.start.row, ch: coords.start.column};
        let to = {line: coords.end.row, ch: coords.end.column};

        let doc = instance.getDoc();

        this.textMarks.push( doc.markText(from, to, {className: 'CodeMirror-lint-mark-error', title: diagnostic.message}) );
    }

    handleChange(code: string, change: CodeMirror.EditorChange) 
    {
        let source = new SourceText(code);
        let lexer = new Lexer(source);
        let parser = new Parser(source);
        let binder = new Binder();
        let visitor: BoundTreeStructureVisitor;        
        let lowerer = new Lowerer();
        let codeGenerator = new CodeGenerator();
        let compilationUnit : CompilationUnit;
        let boundTree : BoundGlobalScope;
        let boundTreeText : string;
        let newBoundTree : BoundGlobalScope;
        let loweredTreeText : string;
        let result : GeneratedCode;

        try
        {
            compilationUnit = parser.parse();
            boundTree = binder.Bind(compilationUnit);
        }
        catch(e)
        {

        }

        try
        {
            visitor = new BoundTreeStructureVisitor();        
            visitor.Visit(boundTree);
            boundTreeText = visitor.structure;
        }
        catch(e)
        {

        }
        
        try
        {
            visitor = new BoundTreeStructureVisitor();                
            newBoundTree = lowerer.lower(boundTree);
        }
        catch(e)
        {

        }

        try
        {
            visitor.Visit(newBoundTree);
            loweredTreeText = visitor.structure;
        }
        catch(e)
        {

        }

        try
        {
            result = codeGenerator.generate(newBoundTree);
        }
        catch(e)
        {
            
        }

        this.setState({
            source : source,
            diagnostics:boundTree.diagnostics,
            compilationUnit : compilationUnit, 
            boundTree : boundTree, 
            asmCode : result, 
            boundTreeText:boundTreeText, 
            loweredTreeText : loweredTreeText
        });
    }

    run()
    {
        if(!!this.state.asmCode && this.state.asmCode.success)
        {
            let b64 = btoa(this.state.asmCode.text);
            window.open("run.html?asm=" + b64);
        }
    }

    setMode(mode : number) : void
    {
        this.setState( { mode});
    }

    highlightDiagnostic(span:TextSpan) : void
    {
        if(!span)
        {
            let from = {line: 0, ch: 0};
            let to = {line: 0, ch: 0};

            this.codemirror.getCodeMirror().getDoc().setSelection(from, to);
            return;
        }

        let coords = this.state.source.textSpanToRowColRange(span);

        let from = {line: coords.start.row, ch: coords.start.column};
        let to = {line: coords.end.row, ch: coords.end.column};

        this.codemirror.getCodeMirror().getDoc().setSelection(from, to);
    }

    onTreeViewNodeClick(span:TextSpan)
    {
        
    }

    onCursorActivityHandler(cm: CodeMirror.Editor)
    {
        let cursor = cm.getDoc().getCursor();
        let source = this.state.source;
        let line = source.getline(cursor.line);
        
        let position = line.start + cursor.ch;
        //let node = this.state.compilationUnit.compilationUnit.getSyntaxNodeFromPosition(cursor.line, cursor.ch);
        //this.state.compilationUnit.compilationUnit
    }

    render() {

        return <div style={{width:"100vw", height:"100vh", position:"absolute", top:"0px", left:"0px"}}>
            <div style={{height:"100vh", width:"50vw", position:"absolute", top:"0px", left:"0px"}} >
                <CodeMirror 
                    ref={ (r) => this.codemirror = r }
                    value={this.state.source.text}     
                    onChange={ (e, change) => this.handleChange(e, change) }
                    onCursorActivity={ (cm) => this.onCursorActivityHandler(cm)  }
                    options={{
                        gutters:["Codemirror-lint-markers"],
                        lineNumbers: true,  
                    }} />
            </div>
            <div style={{height:"100vh", width:"50vw", position:"absolute", top:"0px", left:"50vw", borderLeft:"solid 1px grey"}} >
                <span className="tabStyle" key="parseTree" onClick={ ()=> this.setMode(1) }>Parse Tree</span>
                <span className="tabStyle" key="boundTree" onClick={ ()=> this.setMode(2) }>Bound Tree</span>
                <span className="tabStyle" key="loweredTree" onClick={ ()=> this.setMode(3) }>Lowered Tree</span>
                <span className="tabStyle" key="asmCode" onClick={ ()=> this.setMode(4) }>ASM</span>
                <span className="tabStyle" key="asmCode" onClick={ ()=> this.run() }>RUN</span>
                {this.state.mode == 1 && this.state.compilationUnit && 
                <div style={{height:"80vh", overflow:"scroll"}}>
                    
                    <LosslessParseTreeView 
                        compilationUnit={ this.state.compilationUnit.compilationUnit } 
                        onMouseOver={ (s) => this.highlightDiagnostic(s) } 
                        onClick={ e => this.onTreeViewNodeClick(e) } />
                                
                </div>
                }
                {this.state.mode == 2 && this.state.asmCode &&
                <div style={{height:"80vh", overflow:"scroll"}}>                    
                    <div>
                        <pre>{this.state.boundTreeText}</pre>
                    </div> 
                </div>
                }
                {this.state.mode == 3 && this.state.asmCode &&
                <div style={{height:"80vh", overflow:"scroll"}}>                    
                    <div>
                        <pre>{this.state.loweredTreeText}</pre>
                    </div> 
                </div>
                }
                {this.state.mode == 4 && this.state.asmCode &&
                <div style={{height:"80vh", overflow:"scroll"}}>                    
                    <div>
                        <pre>{this.state.asmCode.text}</pre>
                    </div> 
                </div>
                }
                {this.state.compilationUnit &&
                <div style={{height:"20vh", width:"50vw", position:"absolute", bottom:"0px", overflow:"scroll", zIndex:10, borderTop:"solid 1px grey"}} >
                    <span>Diagnostics</span>
                    <div>
                        <span>{this.state.compilationUnit.success}</span>
                    </div>
                    <div>
                        {this.diagnostics()}
                    </div>            
                </div>}                
            </div>
        </div>;
    }

    diagnostics()
    {
        let formatter = new StringDiagnosticsPrinter();

        return this.state.diagnostics.map( (d, i) => {
            return <DiagnosticViewer
                        message={formatter.printDiagnostic(this.state.diagnostics, this.state.diagnostics.get(i))} 
                        span={d.span} 
                        onMouseOver={ (d) => this.highlightDiagnostic(d) } />;
        });
    }
}