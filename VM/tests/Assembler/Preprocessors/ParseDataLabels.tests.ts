import * as DataLabels from "../../../Assembler/Preprocessors/ParseDataLabels";
import AssemblyLine from "../../../Assembler/AssemblyLine";
import MockAssemblyLine from "../MockAssemblyLine";

describe("The parseDataLabels function ", () => {
    let lines : MockAssemblyLine[];
    let actual : AssemblyLine[];

    it("is a function", () => {        
        expect(typeof(DataLabels.parseDataLabels)).toEqual("function");
    });

    function test(instructions : string [], 
                    expected : DataLabels.DataLabel[])
    {
        const lines = instructions.map( (s, i) => {
            return new MockAssemblyLine(s, i);
        });


        const actual = DataLabels.parseDataLabels(0, lines);

        expect(actual.length).toEqual(expected.length);

        for(let i = 0; i < actual.length; i++)
        {
            expect(actual[i].label).toEqual(expected[i].label);
            expect(actual[i].data).toEqual(expected[i].data);
            expect(actual[i].size).toEqual(expected[i].size);
            expect(actual[i].type).toEqual(expected[i].type);
            expect(actual[i].address).toEqual(expected[i].address);
        }
    }

    it("parses the data section to extract the declarations", () => {
        test([
            ".one 'test'",
            ".two byte 123",
            ".three size 456",
            ".four \"another test\"",
            ".five word 345",
        ],
        [
            { label : ".one", data : "test", size: 9, type : DataLabels.DataLabelType.String, address: 0 },
            { label : ".two", data : 123, size : 1, type : DataLabels.DataLabelType.Byte, address : 9 },
            { label : ".three", data:null, size : 456, type : DataLabels.DataLabelType.Buffer, address : 10 },
            { label : ".four", data : "another test", size : 25, type : DataLabels.DataLabelType.String, address : 466 },
            { label : ".five", data : 345, size : 2, type : DataLabels.DataLabelType.Int16, address : 491 }            
        ])
    });  
    
    it("parses the ignores additional whitespace when parsing", () => {
        test([
            ".one   'test'",
            ".two   byte         123",
            "   .three  size     456    ",
            "    .four      \"another test\"",
            "     .five      word     345     ",
        ],
        [
            { label : ".one", data : "test", size: 9, type : DataLabels.DataLabelType.String, address: 0 },
            { label : ".two", data : 123, size : 1, type : DataLabels.DataLabelType.Byte, address : 9 },
            { label : ".three", data:null, size : 456, type : DataLabels.DataLabelType.Buffer, address : 10 },
            { label : ".four", data : "another test", size : 25, type : DataLabels.DataLabelType.String, address : 466 },
            { label : ".five", data : 345, size : 2, type : DataLabels.DataLabelType.Int16, address : 491 }            
        ])
    });  
});