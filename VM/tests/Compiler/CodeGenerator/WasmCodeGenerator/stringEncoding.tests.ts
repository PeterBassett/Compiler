import { encodeStringAsUint8Array, uintArrayToString, stringToUintArray } from "../../../../Language/Compiler/CodeGeneration/WASM/stringEncoding";

describe("The encodeString function", () => {
    [
        ["hello", [0x5, 0x68, 0x65, 0x6c, 0x6c, 0x6f]],
        ["€", [0x3, 0xE2, 0x82, 0xAC]],
        ["€€", [0x6, 0xE2, 0x82, 0xAC, 0xE2, 0x82, 0xAC]],
    ].forEach((item) => {
        it(`should compress a string into a byte array ` + item[0], () => {  
            const input = item[0] as string;
            const expected = item[1] as number[];

            const actual = encodeStringAsUint8Array(input);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});

describe("The stringToUintArray function", () => {
    [
        ["hello", [0x68, 0x65, 0x6c, 0x6c, 0x6f]],
        ["€", [0xE2, 0x82, 0xAC]]
    ].forEach((item) => {
        it(`should take a string and return the raw utf8 numbers ` + item[0], () => {  
            const input = item[0] as string;
            const expected = item[1] as number[];

            const actual = stringToUintArray(input);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});


describe("The uintArrayToString function", () => {
    [
        [[0x68, 0x65, 0x6c, 0x6c, 0x6f], "hello"],
        [[0xE2, 0x82, 0xAC], "€"],
    ].forEach((item) => {
        it(`should take utf8 numbers and return a string ` + item[0], () => {  
            const input = item[0] as number[];
            const expected = item[1] as string;

            const actual = uintArrayToString(input);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});
