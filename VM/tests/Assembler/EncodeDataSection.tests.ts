import { encodeDataSection } from "../../Assembler/Assemble";
import AssemblyLine from "../../Assembler/AssemblyLine";
import MockAssemblyLine from "./MockAssemblyLine";
import { DataLabel, DataLabelType } from "../../Assembler/Preprocessors/ParseDataLabels";

describe("The encodeDataSection function ", () => {
    let buffer : ArrayBuffer;
    let buffer16bit : Uint16Array;
    let buffer8bit : Uint16Array;
    let output : DataView;
    beforeEach(() =>{
        buffer  = new ArrayBuffer(1 << 10);        
        buffer16bit = new Uint16Array(buffer);
        buffer16bit.fill(5);
        buffer8bit = new Uint8Array(buffer);
        output = new DataView(buffer);
    });

    function test(output : DataView, data : DataLabel[], offset : number)
    {
        encodeDataSection(output, data, offset);
    }

    it("is a function", () => {        
        expect(typeof(encodeDataSection)).toEqual("function");
    });

    function testString(offset : number, compare : string)
    {
        for(let i = 0; i < compare.length; i++)
            expect(output.getUint16(offset + (i * 2), true)).toEqual(compare.charCodeAt(i));

        expect(output.getUint16(offset + compare.length * 2, true)).toEqual(0);
    }

    function testBuffer(offset : number, size : number, value : number = 0)
    {
        for(let i = 0; i < size; i++)
            expect(output.getUint8(offset + i)).toEqual(value);
    }

    function testFloat(offset : number, compare : number)
    {
        expect(output.getFloat64(offset, true)).toEqual(compare);
    }

    function testNumber16(offset : number, compare : number)
    {
        expect(output.getUint16(offset, true)).toEqual(compare);
    }

    function testNumber32(offset : number, compare : number)
    {
        expect(output.getUint32(offset, true)).toEqual(compare);
    }

    it("encodes a single string", () => {
        const value = "this is a test";

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.String, "1", value, 0)
        ];

        encodeDataSection(output, data, 0);
        
        testString(0, value);        
    });

    it("encodes a single number", () => {
        const value = 31415;

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.Int16, "1", value, 0)
        ];
        encodeDataSection(output, data, 0);
        
        testNumber16(0, value);        
    });

    it("encodes a single 32bit number", () => {
        const value = 10000000;

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.Int32, "1", value, 0)
        ];
        encodeDataSection(output, data, 0);
        
        testNumber32(0, value);        
    });

    it("encodes a single float number", () => {
        const value = Math.PI;

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.Float, "1", value, 0)
        ];
        encodeDataSection(output, data, 0);
        
        testFloat(0, value);        
    });

    it("encodes a blank buffer", () => {
        buffer16bit.fill(5);

        const value = 123;

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.Buffer, "1", 123, 0)
        ];
        encodeDataSection(output, data, 0);
        
        testBuffer(0, value);        
    });

    it("encodes a string followed by a number followed by a buffer followed by a number", () => {
        buffer16bit.fill(1 << 16);

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.String, "1", "ABCDE", 0),/*
            {
                address : 0,
                label : "1",
                data : "ABCDE",
                size : 6 * Uint16Array.BYTES_PER_ELEMENT,
                type : DataLabelType.String
            },*/
            new DataLabel(DataLabelType.Int16, "2", 456, 12),/*            
            {
                address : 12,
                label : "2",
                data : 456,
                size : 1 * Uint16Array.BYTES_PER_ELEMENT,
                type : DataLabelType.Number
            },*/
            new DataLabel(DataLabelType.Buffer, "3", 10, 14),/*            
            {
                address : 14,
                label : "3",
                data : null,
                size : 10,
                type : DataLabelType.Buffer
            },*/
            new DataLabel(DataLabelType.Int16, "4", 789, 24),/*            
            {
                address : 24,
                label : "4",
                data : 789,
                size : 1 * Uint16Array.BYTES_PER_ELEMENT,
                type : DataLabelType.Number
            },*/
        ];
        encodeDataSection(output, data, 0);

        testString(0, "ABCDE");
        testNumber16(12, 456);
        testBuffer(14, 10);
        testNumber16(24, 789);
    });

    it("encodes a value offset into memory by a fixed amount", () => {
        buffer8bit.fill((1 << 8) - 1);

        let data : DataLabel[] = [
            new DataLabel(DataLabelType.String, "1", "ABCDE", 0),/*
            /*            {
                address : 0,
                label : "1",
                data : "ABCDE",
                size : 6 * Uint16Array.BYTES_PER_ELEMENT,
                type : DataLabelType.String
            },*/
            new DataLabel(DataLabelType.Int16, "2", 456, 12),/*
            /*
            {
                address : 12,
                label : "2",
                data : 456,
                size : 1 * Uint16Array.BYTES_PER_ELEMENT,
                type : DataLabelType.Number
            },*/
            new DataLabel(DataLabelType.Buffer, "3", 10, 14),/*
            /*
            {
                address : 14,
                label : "3",
                data : null,
                size : 10,
                type : DataLabelType.Buffer
            },*/
            new DataLabel(DataLabelType.Int16, "4", 789, 24),/*
            /*
            {
                address : 24,
                label : "4",
                data : 789,
                size : 1 * Uint16Array.BYTES_PER_ELEMENT,
                type : DataLabelType.Number
            },*/
        ];
    
        encodeDataSection(output, data, 30);

        testBuffer(0, 30, 255);        
        testString(30, "ABCDE");
        testNumber16(42, 456);
        testBuffer(44, 10);
        testNumber16(54, 789);
    });
});