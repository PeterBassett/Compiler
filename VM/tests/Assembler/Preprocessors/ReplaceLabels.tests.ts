import * as ReplaceLabels from "../../../Assembler/Preprocessors/ReplaceLabels";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";
import InstructionCoder32Bit from "../../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";

describe("The buildLabelMap function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    it("is a function", () => {        
        expect(typeof(ReplaceLabels.buildLabelMap)).toEqual("function");
    });

    function test(instructions : string [], 
                    expectedlines : string [], 
                    expectedLabels : {[label:string] : number})
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const encoder = new InstructionCoder32Bit()
        const actual = ReplaceLabels.buildLabelMap(lines, encoder);

        expect(actual.lines.length).toEqual(expectedlines.length);

        for(let i = 0; i < actual.lines.length; i++)
        {
            expect(actual.lines[i].source).toEqual(expectedlines[i]);
        }

        const labels = Object.keys(actual.labels);
        const expectedLabelNames = Object.keys(expectedLabels);

        expect(labels.length).toEqual(expectedLabelNames.length);
        
        for(let i = 0; i < labels.length; i++)
        {
            expect(actual.labels[labels[i]]).toEqual(expectedLabels[expectedLabelNames[i]]);
        }
    }

    it("removes a single label and returns a map of containing the replacement", () => {
        test([
            "call other:",
            "other:",
            "mvi r3 123"
        ],
        [
            "call other:",
            "mvi r3 123"            
        ],
        {"other:" : 1})
    });

    
    it("removes multiple labels and returns a map of all the replacements", () => {
        test([
            "start:",
            "jmp third:",
            "first:",
            "mvi r3 123",
            "jmp start:",
            "second:",
            "mvi r3 234",
            "jmp first:",
            "third:",
            "mvi r3 345",
            "jmp second:",            
        ],
        [
            "jmp third:",
            "mvi r3 123",
            "jmp start:",
            "mvi r3 234",
            "jmp first:",
            "mvi r3 345",
            "jmp second:",
        ],
        {
            "start:" : 0,
            "first:" : 1,
            "second:" : 3,
            "third" : 5
        })
    });
});

describe("The replaceLabels function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    it("is a function", () => {        
        expect(typeof(ReplaceLabels.replaceLabels)).toEqual("function");
    });

    function test(instructions : string [], 
                    expectedlines : string [])
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const instructionEncoder = new InstructionCoder32Bit();
        const actual = ReplaceLabels.replaceLabels(0, lines, instructionEncoder);

        expect(actual.length).toEqual(expectedlines.length);

        for(let i = 0; i < actual.length; i++)
        {
            expect(actual[i].source).toEqual(expectedlines[i]);
        }
    }

    it("replaces a single label and all instances of its use", () => {
        test([
            "call other:",
            "other:",
            "mvi r3 123"
        ],
        [
            "call 4",
            "mvi r3 123"            
        ])
    });

    it("replaces a label and all instances of its use regardless of case", () => {
        test([
            "Label1:",
            "call Other:",
            "other:",
            "mvi r3 123",            
            "JMP Label1:"

        ],
        [
            "call 4",
            "mvi r3 123",
            "JMP 0"
        ])
    });

    
    it("removes multiple labels and returns a map of all the replacements", () => {
        test([
            "start:",
            "jmp third:",
            "first:",
            "mvi r3 123",
            "jmp start:",
            "second:",
            "mvi r3 234",
            "jmp first:",
            "third:",
            "mvi r3 345",
            "jmp second:",            
        ],
        [
            "jmp 20",
            "mvi r3 123",
            "jmp 0",
            "mvi r3 234",
            "jmp 4",
            "mvi r3 345",
            "jmp 12",
        ])
    });

    it("removes multiple labels and returns a map of all the replacements even when some labels are prefixes of other longer ones", () => {
        test([
            "one:",
            "mvi r0 456",
            "oneone:",
            "mvi r0 567",
            "oneoneone:",
            "mvi r0 678",
            "oneoneoneone:",
            "mvi r0 789",
            "jmp oneone:",
            "jmp oneoneone:",
            "jmp one:",
            "jmp oneoneoneone:"
        ],
        [
            "mvi r0 456",
            "mvi r0 567",
            "mvi r0 678",
            "mvi r0 789",
            "jmp 4",
            "jmp 8",
            "jmp 0",
            "jmp 12"
        ])
    });
});