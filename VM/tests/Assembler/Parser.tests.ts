import Parser from "../../Assembler/Parser";

describe("A parser function ", () => {
    
    it("is a function", () => {        
        expect(typeof(Parser)).toEqual("function");
    });

    it("takes a string and splits it into the correct number of lines", () => {
        let actual = Parser("a\nb\nc");

        expect(actual.length).toEqual(3);
    });
    
    it("returns object which give access to the original line source", () => {
        let actual = Parser("a\nb\nc");

        expect(actual[0].originalSource).toEqual("a");
        expect(actual[1].originalSource).toEqual("b");
        expect(actual[2].originalSource).toEqual("c");
    });    

    it("returns object which defaults the source property to the original line source", () => {
        let actual = Parser("a\nb\nc");

        expect(actual[0].source).toEqual("a");
        expect(actual[1].source).toEqual("b");
        expect(actual[2].source).toEqual("c");
    }); 

    it("splits text into lines and doesnot remove empty lines", () => {
        let actual = Parser("a\nb\nc\n\nd");

        expect(actual[0].source).toEqual("a");
        expect(actual[1].source).toEqual("b");
        expect(actual[2].source).toEqual("c");
        expect(actual[3].source).toEqual("");
        expect(actual[4].source).toEqual("d");
    }); 
    
    it("returns object which provides a lineNumber property", () => {
        let actual = Parser("a\nb\nc\nddd\n\neee");

        expect(actual[0].lineNumber).toEqual(1);
        expect(actual[1].lineNumber).toEqual(2);
        expect(actual[2].lineNumber).toEqual(3);
        expect(actual[3].lineNumber).toEqual(4);
        expect(actual[4].lineNumber).toEqual(5);
        expect(actual[5].lineNumber).toEqual(6);
    }); 
});