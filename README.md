# Compiler, Assembler, VM

A toy language, something like TypeScript or Go, a compiler, an assembler and a VM
all written in TypeScript

Functionality implemented so far.

* Simple Procedural language with syntax similar to TypeScript or Go. 
* Parsing
* A full Syntax tree, representing every typed character in the input program, comments, whitespace and errors included.
* Type Checking produces a Bound tree. This strips lexical details and includes symantic details and type information.
* The Lowerer is based on a generic Tree Rewriter, it reimplements language constructs in terms of simpler ones.
For loops become While loops, then While loops and If statements become gotos and conditional jumps to labels.
* Optimisation. The same tree rewriter base can also be used to build optimisation passes. The only one available
at the moment precomputes the output of expressions involving literals.
* There are Interpreters at various abstration levels, Parse Tree, Bound Tree, Lowered Tree. These execute the trees at full fidelity, supporting all features and data types.
* Code Generation (ASM)
* An assembly language
* Assembler
* Binary Machine Code
* Virtual Machine to execute the binaries.
* The VM is "low level" in that it does not provide some higher level VM
primitives, it simulates a fairly restricted 16 bit computer.
* Currently the code generator supports generating code for integer, float, boolean and struct varables and parameters. There are some details around structure member referencing to be completed.

Next Steps
* global struct variables
* Pointers
* Arrays