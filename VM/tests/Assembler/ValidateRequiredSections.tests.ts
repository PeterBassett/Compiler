import ValidateRequiredSections from "../../Assembler/ValidateRequiredSections";
import { Logger } from "../../Assembler/interfaces/Logger";
import MockAssemblyLine from "./MockAssemblyLine";

describe("The ValidateRequiredSections function ", () => {
    
    it("is a function", () => {        
        expect(typeof(ValidateRequiredSections)).toEqual("function");
    });

    let loggerCallCount : number;
    let loggerMessages : string [];

    const logger : Logger = (lineNumber : number, characterNumber : number, message : string) => {
        loggerCallCount++;
        loggerMessages.push(message);
    }

    beforeEach(() => {
        loggerCallCount = 0;
        loggerMessages = [];    
    });

    function test(input:string[], expected : boolean, expectedLoggerCallCount?:number)
    {
        let lines = input.map((s) => new MockAssemblyLine(s));
        let actual = ValidateRequiredSections(lines, logger);

        expect(actual).toEqual(expected);

        if(expectedLoggerCallCount)
            expect(loggerCallCount).toEqual(expectedLoggerCallCount);
    }

    it("inspects the assembly looking for .text and .global sections", () => {
        test([""], false, 2);

        expect(loggerMessages.length).toEqual(2);
    });

    it("inspects the assembly looking for a .global section", () => {
        test([".global"], false, 1);

        expect(loggerMessages[0]).toEqual("Required .text section not found.");
    });

    it("inspects the assembly looking for a .text section", () => {
        test([".text"], false, 1);
        expect(loggerMessages[0]).toEqual("Required .global section not found.");
    });

    it("inspects the assembly looking for .text and .global sections", () => {
        test([".text", ".global"], true, 0);
    });

    it("ensures that the .text section comes before the .global section", () => {
        test([".data", ".text", ".global"], true, 0);
    });

    it("ensures that the .text section comes before the .global section", () => {
        test([".data", ".global", ".text"], false, 1);
    });
});