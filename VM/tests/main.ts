///<reference path='../node_modules/@types/requirejs/index.d.ts' />

// Requirejs Configuration Options
require.config({
  // to set the default folder
  baseUrl: "../js/tests/tests", 
  // paths: maps ids with paths (no extension)
  paths: {
      "jasmine": ["../../../node_modules/jasmine-core/lib/jasmine-core/jasmine"],
      "jasmine-html": ["../../../node_modules/jasmine-core/lib/jasmine-core/jasmine-html"],
      "jasmine-boot": ["../../../node_modules/jasmine-core/lib/jasmine-core/boot"]
  },
  // shim: makes external libraries compatible with requirejs (AMD)
  shim: {
    "jasmine-html": {
      deps : ["jasmine"]
    },
    "jasmine-boot": {
      deps : ["jasmine", "jasmine-html"]
    }
  }
});

require(["jasmine-boot"], () => 
{
  require(["./Memory/RAM.tests", 
            "./CPU/Instructions/InstructionCoder32Bit.tests",
            "./CPU/Instructions/InstructionCoderVariable.tests",
            "./CPU/CPU.tests",
            "./CPU/AssembleAndExecute.tests",
            "./CPU/AssembleAndExecute_Assembler2.tests",
            "./CPU/AssembleAndExecuteVariableLengthInstructions.tests",
            "./Assembler/encodeInstructionOperand.tests",
            // Second assembler tests
            "./Assembler/AssemblyLexer.tests",
            "./Assembler/AssemblyParser.tests",        
            // Compiler 
            "./Compiler/Lexer.tests",
            "./Compiler/Parser.tests",
            "./Compiler/Interpreter.tests",
            "./Compiler/Diagnostics/StringDiagnosticsPrinter.tests",
            "./Compiler/Syntax/Text/SourceText.tests",
            "./Compiler/SyntaxFacts.tests",
            "./Compiler/Binding/Binder.tests",
            "./Compiler/Lowering/Lowerer.tests",
            "./Compiler/LoweredBoundTreeInterpreter.tests",
            "./Compiler/CodeGenerator/AssemblyLanguage/AssemblyCodeGenerator.tests",
            "./Compiler/CodeGenerator/WasmCodeGenerator/LEBencoding.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.tests",
            "./Compiler/CompileAndExecute/CompilerIntrinsicExecute.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.struct.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.pointer.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.array.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.class.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.byte.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.union.tests",
            "./Compiler/Optimisation/ExpressionOptimiser.tests",
            "./Compiler/Binding/ControlFlowAnalysis/ControlFlowAnalyser.tests",
            "./Compiler/CompileAndExecute/CompileAndExecute.performance.tests",            
          ], () => {
            //trigger Jasmine
          (window as any).onload();
    });
});