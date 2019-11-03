import InjectEntryPoint from "../../../Assembler/Preprocessors/InjectEntryPoint";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The injectEntryPoint function ", () => {
    function test(instructions : string [], expected : string [])
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const actual = InjectEntryPoint(lines);

        expect(actual.length).toEqual(expected.length);

        for(let i = 0; i < actual.length; i++)
        {
            expect(actual[i].source).toEqual(expected[i]);
        }
    }

    it("is a function", () => {        
        expect(typeof(InjectEntryPoint)).toEqual("function");
    });

    it("replaces the .global symbol with a move and jump", () => {
        test([
            ".data",
            ".counter 1",
            ".text",
            ".global entryPoint:",
            "entryPoint:",
            "mvi R6 3"
        ],
        [
            ".data",
            ".counter 1",
            ".text",
            "MVI R0 entryPoint:",
            "JMR R0",
            "entryPoint:",
            "mvi R6 3"
        ])
    });

    it("replaces the .global symbol with a move and jump even in incorrectly ordered programs", () => {
        test([
            ".text",
            ".global entryPoint:",
            "entryPoint:",
            "mvi R7 3",
            ".data",
            ".counter 1"                
        ],
        [
            ".text",
            "MVI R0 entryPoint:",
            "JMR R0",
            "entryPoint:",
            "mvi R7 3",
            ".data",
            ".counter 1"            
        ])
    });

    it("inserts new instructions to replace the .global statement. The new instructions have the same linenumber as the original", () => {
        const lines = [
            ".data",
            ".counter 1",
            ".text",
            ".global entryPoint:",
            "entryPoint:",
            "mvi R7 3"
        ].map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const actual = InjectEntryPoint(lines);

        expect(lines[3].lineNumber).toEqual(lines[3].lineNumber);
        expect(lines[3].lineNumber).toEqual(lines[4].lineNumber);
    })
});