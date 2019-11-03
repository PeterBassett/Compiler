import * as SectionExtraction from "../../Assembler/SectionExtraction";
import AssemblyLine from "../../Assembler/AssemblyLine";
import MockAssemblyLine from "./MockAssemblyLine";

describe("A findSections function ", () => {
    
    function test(instructions : string [], expectedData : number, expectedText : number, expectedGlobal : number)
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const actual = SectionExtraction.findSections(lines);

        expect(actual.data).toEqual(expectedData);
        expect(actual.text).toEqual(expectedText);
        expect(actual.global).toEqual(expectedGlobal);
    }

    it("is a function", () => {        
        expect(typeof(SectionExtraction.findSections)).toEqual("function");
    });

    it("", () => {
        test([
            ".data",
            ".counter 1",
            ".text",
            ".global entryPoint:",
            "entryPoint:",
            "mvi R1 1"
        ],
        0, 2, 3)
    });
});


describe("The extractSections function ", () => {
    
    function test(instructions : string [], expectedData : string [], expectedText : string [])
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const actual = SectionExtraction.extractSections(lines);

        expect(actual.data.length).toEqual(expectedData.length);
        expect(actual.text.length).toEqual(expectedText.length);

        for(let i = 0; i < actual.data.length; i++)
            expect(actual.data[i].source).toEqual(expectedData[i]);

        for(let i = 0; i < actual.text.length; i++)
            expect(actual.text[i].source).toEqual(expectedText[i]);
    }

    it("is a function", () => {        
        expect(typeof(SectionExtraction.extractSections)).toEqual("function");
    });

    it("separates the text and data sections of the assembly", () => {
        test([
            ".data",
            "   .counter 1",
            "   .hello string 'test'",
            "   .length size 256",
            ".text",
            ".global entryPoint:",
            "entryPoint:",
            "mvi R1 1"
        ],
        [
            "   .counter 1",
            "   .hello string 'test'",
            "   .length size 256"
        ],
        [
            ".global entryPoint:",
            "entryPoint:",
            "mvi R1 1"
        ])
    });
});