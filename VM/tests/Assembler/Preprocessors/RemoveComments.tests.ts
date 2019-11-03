import RemoveComments from "../../../Assembler/Preprocessors/RemoveComments";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The removeComments function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    beforeEach(() => {
        lines = [
            new MockAssemblyLine("; comment "),
            new MockAssemblyLine("abcdefg; removed ;;;"),
            new MockAssemblyLine("     ; comment ;;;"),
            new MockAssemblyLine(";;;;; this is a comment ;;;;;;"),
            new MockAssemblyLine("nothing to remove here"),
            new MockAssemblyLine("leading content;;;;; this is a comment ;;;;;;")
        ];

        actual = RemoveComments(lines);    
    });

    it("is a function", () => {        
        expect(typeof(RemoveComments)).toEqual("function");
    });

    it("takes an array of AssemblyLine objects and returns an array of the same length", () => {        
        expect(actual.length).toEqual(lines.length);
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

    it("writes only to the source property", () => {
        for(let i = 0; i < lines.length; i++) 
        {
            expect(lines[i]._sourceSETCount).toEqual(1);
            expect(lines[i]._originalSourceSETCount).toEqual(0);
            expect(lines[i]._lineNumberSETCount).toEqual(0);
            expect(lines[i]._outputIPSETCount).toEqual(0);
        }
    });

    
    function test(input:string, expected:string):void{
        let actual = RemoveComments([new MockAssemblyLine(input)]);

        expect(actual[0].source).toEqual(expected);
    }

    it("removes entire line comment", () => {
        test(";remove this comment", "");
    });

    it("removes comments trailing content", () => {
        test("leading content;remove this comment", "leading content");
    });

    it("removes entire line heading comment ", () => {
        test(";;;;;;;;remove this comment;;;;;;;;", "");
    });

    it("removes comments with whitespace leading content", () => {
        test("   \t   ;remove this comment;;;;;;;;", "   \t   ");
    });
});