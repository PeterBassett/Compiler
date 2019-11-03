import {DataLabel, DataLabelType} from "../../../Assembler/Preprocessors/ParseDataLabels";
import {replaceDataLabels} from "../../../Assembler/Preprocessors/ReplaceDataLabels";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The replaceDataLabels function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    it("is a function", () => {        
        expect(typeof(replaceDataLabels)).toEqual("function");
    });

    function test(dataLabels : DataLabel[],
                  instructions : string [],
                  expected : string [])
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });

        const actual = replaceDataLabels(lines, dataLabels, 3);

        expect(actual.length).toEqual(expected.length);

        for(let i = 0; i < actual.length; i++)
        {
            expect(actual[i].source).toEqual(expected[i]);                        
        }
    }

    it("replaces instances of data labels with their addresses", () => {
        test([
            { label : ".one", data : "test", size: 5, type : DataLabelType.String, address: 0 },
            { label : ".two", data : 123, size : 1, type : DataLabelType.Int16, address : 5 },
            { label : ".three", data:null, size : 456, type : DataLabelType.Buffer, address : 6 },
            { label : ".four", data : "another test", size : 13, type : DataLabelType.String, address : 462 }            
        ],
        [            
            "mvi r1 .one",
            "lrd .two r2",
            "halt .three .four"            
        ],
        [
            "mvi r1 3",
            "lrd 8 r2",
            "halt 9 465"
        ])
    });    
});