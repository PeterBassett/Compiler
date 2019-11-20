import * as React from "react";
import Parser from "../../Language/Compiler/Syntax/Parser";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import CompilationUnit from "../../Language/Compiler/Syntax/CompilationUnit";
import TextSpan from "../../Language/Compiler/Syntax/Text/TextSpan";
import StringDiagnosticsPrinter from "../../Language/Compiler/Diagnostics/StringDiagnosticsPrinter";
import { LosslessParseTreeView,  DiagnosticViewer } from "../DiagnosticDisplay/DiagnosticViewer";
import Lexer from "../../Language/Compiler/Syntax/Lexer";

interface PlainCodeEditorState
{
    source:SourceText;
    highlightSpan?:TextSpan;
    compilationUnit: CompilationUnit;
}

interface PlainCodeEditorProps
{
    asmFileName:string;
}

export default class PlainCodeEditor extends React.Component<PlainCodeEditorProps, PlainCodeEditorState>
{
    private editor : HTMLTextAreaElement;

    constructor(props){
        super(props);
        
        this.state = {source : new SourceText(`
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
}`), highlightSpan:null, compilationUnit : null};
    }

    handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) 
    {
        let source = new SourceText(e.target.value);
        let lexer = new Lexer(source);
        let parser = new Parser(source);
        
        let compilationUnit = parser.parse();

        this.setState({source : source, compilationUnit : compilationUnit});
    }

    setCursorPos(span:TextSpan) 
    {
        if(!this.editor)
            return;

        if(span)
            this.editor.setSelectionRange(span.start, span.end);
    }

    render() {
        return <div>
            <textarea 
                style={
                    {width : "100%", height:"20em"}
                }
                ref={ (r) => this.editor = r }
                value={this.state.source.text}                                
                onChange={ (evt) => this.handleChange(evt) } 
            />

            {this.state.compilationUnit &&
             !this.state.compilationUnit.success &&
            <div style={ {height:"500px", overflow:"scroll"} }>
                <span>Diagnostics</span>
                <div>
                    <span>{this.state.compilationUnit.success}</span>
                </div>
                <div>
                    {this.diagnostics()}
                </div>            
            </div>}

            <div style={ {height:"500px", overflow:"scroll"} }>
                {this.state.compilationUnit &&
                this.state.compilationUnit.success &&
                <LosslessParseTreeView 
                    compilationUnit={ this.state.compilationUnit.compilationUnit } 
                    onMouseOver={ (s) => this.setCursorPos(s) }
                    onClick={ (s) => {} } />
                }            
            </div>
        </div>;
    }

    diagnostics()
    {
        var formatter = new StringDiagnosticsPrinter();

        return this.state.compilationUnit.diagnostics.map( (d, i) => {
            return <DiagnosticViewer
                        message={formatter.printDiagnostic(this.state.compilationUnit.diagnostics, this.state.compilationUnit.diagnostics.get(i))} 
                        span={d.span} 
                        onMouseOver={ (d) => this.setCursorPos(d) } />;
        });
    }
}