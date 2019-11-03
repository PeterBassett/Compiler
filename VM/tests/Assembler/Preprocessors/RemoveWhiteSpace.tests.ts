import RemoveWhiteSpace from "../../../Assembler/Preprocessors/RemoveWhiteSpace";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The removeWhiteSpace function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    beforeEach(() => {
        lines = [
            new MockAssemblyLine("nosspaces"),
            new MockAssemblyLine("trailingspace    "),
            new MockAssemblyLine("    leadingspace"),
            new MockAssemblyLine("    trailingandleadingspace    "),
            new MockAssemblyLine("\ttabs\t"),
            new MockAssemblyLine("     only  trailing  and  leading  space is  removed    "),
            new MockAssemblyLine(" evensinglespacesareremoved ")
        ];

        actual = RemoveWhiteSpace(lines);    
    });

    it("is a function", () => {        
        expect(typeof(RemoveWhiteSpace)).toEqual("function");
    });

    it("takes an aray of AssemblyLine objects and returns an array of the same type", () => {        
        expect(actual.length).toEqual(lines.length);
    }); 

    it("removes trailing and leading spaces in the source property", () => {

        expect(actual[0].source).toEqual("nosspaces");
        expect(actual[1].source).toEqual("trailingspace");
        expect(actual[2].source).toEqual("leadingspace");
        expect(actual[3].source).toEqual("trailingandleadingspace");
        expect(actual[4].source).toEqual("tabs");
        expect(actual[5].source).toEqual("only  trailing  and  leading  space is  removed");
        expect(actual[6].source).toEqual("evensinglespacesareremoved");
    }); 

    it("does not read from the originalSource property", () => {
        for(let i = 0; i < lines.length; i++) 
            expect(lines[i]._originalSourceGETCount).toEqual(0);
    }); 

    it("reads from the source property", () => {
        for(let i = 0; i < lines.length; i++) 
            expect(lines[i]._sourceGETCount).toEqual(1);
    });

    it("writes to  the source property", () => {
        for(let i = 0; i < lines.length; i++) 
            expect(lines[i]._sourceSETCount).toEqual(1);
    });
    
    it("does not set any other properties", () => {
        for(let i = 0; i < lines.length; i++) 
        {
            expect(lines[i]._originalSourceSETCount).toEqual(0);
            expect(lines[i]._lineNumberSETCount).toEqual(0);
            expect(lines[i]._outputIPSETCount).toEqual(0);
        }
    });
});