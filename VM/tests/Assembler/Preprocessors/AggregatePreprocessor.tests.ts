import createAggregatePreprocessor from "../../../Assembler/Preprocessors/AggregatePreprocessor";
import Preprocessor from "../../../Assembler/interfaces/Preprocessor";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The createAggregatePreprocessor function ", () => {
    
    it("is a function", () => {        
        expect(typeof(createAggregatePreprocessor)).toEqual("function");
    });

    function test(input:string[], expected:string[], ...processors:Preprocessor[]):void{
        let processor = createAggregatePreprocessor(...processors);

        let lines = input.map((s) => new MockAssemblyLine(s));
        let actual = processor(lines);
        
        for(let i = 0; i < input.length; i++)
            expect(actual[i].source).toEqual(expected[i]);
    }

    it("runs preprocessors on lines", () => {
        test(["a"], ["a2"], (lines) => {
            for(let i = 0; i < lines.length; i++)
                lines[i].source = lines[i].source + "2";

            return lines;
        });
    });

    it("runs preprocessors on each line", () => {
        test(["a", "b"], ["a2", "b2"], (lines) => {
            for(let i = 0; i < lines.length; i++)
                lines[i].source = lines[i].source + "2";

            return lines;
        });
    });

    it("runs each preprocessor in turn on each line", () => {
        test(["a", "b"], ["a23", "b23"], (lines) => {
            for(let i = 0; i < lines.length; i++)
                lines[i].source = lines[i].source + "2";

            return lines;
        },
        (lines) => {
            for(let i = 0; i < lines.length; i++)
                lines[i].source = lines[i].source + "3";

            return lines;
        });
    });

    it("runs each preprocessor in turn on each line", () => {
        test(["one", "two"], ["oneoneoneone", "twotwotwotwo"], (lines) => {
            for(let i = 0; i < lines.length; i++)
                lines[i].source = lines[i].source + lines[i].source;

            return lines;
        },
        (lines) => {
            for(let i = 0; i < lines.length; i++)
                lines[i].source = lines[i].source + lines[i].source;

            return lines;
        });
    });
});