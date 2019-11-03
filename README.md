# Compiler, Assembler, VM

A toy language, something like TypeScript or Go, a compiler, an assembler and a VM
all written in TypeScript

Functionality implemented so far.

Primitives
* Very simple Procedural language with syntax similar to TypeScript or Go. 
* Parsing
* A Full syntax Tree, representing every typed character in the input program, commentsm whitespace and errors included
* Type Checking produces a Bound tree. This strips lexical details and includes symantic details and type information.
* The Lowerer is based on a generit Tree Rewriter, it reimplements language constructs in terms of simpler ones.
for loops become while loops, then while loops and if statements become gotos and conditional jumps to labels.
* Optimisation. The same tree rewriter base can also be used to build optimisation passes. The only one available
at the moment is precomputing the output of expressions involving literals.
* There are Interpreters at various abstration levels, Parse Tree, Bound Tree, Lowered Tree. These execute the trees at full fidelity, supporting all features and data types.
* Code Generation (ASM)
* A Toy assembly language
* Assembler
* Binary Machine Code
* Virtual Machine to execute the binaries.
* The VM is "low level" in that it does not provide some higher level VM
primitives, it simulates a fairly restricted 16 bit computer.
* Currently the code generator only supports generating code for integer varables and parameters. I need to figure out the details around emitting the right opcodes for different data types and keeping track of the stack positions etc.