import RemoveEmptyLines from "../../../Assembler/Preprocessors/RemoveEmptyLines";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The removeEmptyLines function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    beforeEach(() => {
        lines = [
            new MockAssemblyLine("noteremoved"),
            new MockAssemblyLine("noteremoved    "),
            new MockAssemblyLine("    noteremoved"),
            new MockAssemblyLine(" "),
            new MockAssemblyLine("  "),
            new MockAssemblyLine(""),
            new MockAssemblyLine("    noteremoved    "),
            new MockAssemblyLine("\tnoteremoved\t"),
            new MockAssemblyLine("\t"),            
            new MockAssemblyLine("\t\t\t\t"),
            new MockAssemblyLine("\t\t\t        \t"),            
            new MockAssemblyLine("     noteremoved  noteremoved  noteremoved  noteremoved  noteremoved  noteremoved    "),
            new MockAssemblyLine(" noteremoved ")
        ];

        actual = RemoveEmptyLines(lines);    
    });

    it("is a function", () => {        
        expect(typeof(RemoveEmptyLines)).toEqual("function");
    });

    it("takes an array of AssemblyLine objects and returns an array of the same type", () => {        
        expect(actual.length).toBeLessThan(lines.length);
    }); 

    it("removes lines consisting entirely of whitepsace", () => {
        expect(actual.length).toEqual(7);
    }); 

    it("does not read from the originalSource property", () => {
        for(let i = 0; i < lines.length; i++) 
            expect(lines[i]._originalSourceGETCount).toEqual(0);
    }); 

    it("reads only from the source property", () => {
        for(let i = 0; i < lines.length; i++) 
        {
            expect(lines[i]._sourceGETCount).toBeGreaterThanOrEqual(1);

            expect(lines[i]._originalSourceGETCount).toEqual(0);
            expect(lines[i]._lineNumberGETCount).toEqual(0);
            expect(lines[i]._outputIPGETCount).toEqual(0);
        }
    });

    it("does not write to any properties", () => {
        for(let i = 0; i < lines.length; i++) 
        {
            expect(lines[i]._sourceSETCount).toEqual(0);
            expect(lines[i]._originalSourceSETCount).toEqual(0);
            expect(lines[i]._lineNumberSETCount).toEqual(0);
            expect(lines[i]._outputIPSETCount).toEqual(0);
        }
    });
});