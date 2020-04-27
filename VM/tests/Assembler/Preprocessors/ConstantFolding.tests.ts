import {performConstantFolding} from "../../../Assembler/Preprocessors/ConstantFolding";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The performConstantFolding function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    it("is a function", () => {        
        expect(typeof(performConstantFolding)).toEqual("function");
    });

    function test(source : string, 
                expected : string)
    {
        const line = new MockAssemblyLine(source, 0);

        const actual = performConstantFolding([line]);

        expect(actual[0].source).toEqual(expected);
    }

[ 
    ["MOV R1, 1+1", "MOV R1, 2"],
    ["MOV R1, 2+1", "MOV R1, 3"],
    ["MOV 1+1, R1", "MOV 2, R1"],
    ["MOV 1+3, 1+1", "MOV 4, 2"],
    ["MOV R1, [284+8]", "MOV R1, [292]"],
].forEach((item) => {
    it(`should fold constants and pre compute simple math` + item[0], () => {  
        const text = item[0] as string;
        const expected = item[1] as string;

        test(text, expected);
    });
});
});