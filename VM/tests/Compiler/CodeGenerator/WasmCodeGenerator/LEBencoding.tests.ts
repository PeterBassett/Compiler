import { encodeUnsignedLEB128, encodeSignedLEB128 } from "../../../../Language/Compiler/CodeGeneration/WASM/LEBencoding";

describe("The encodeUnsignedLEB128 function", () => {
[
    [624485, [0xE5, 0x8E, 0x26]],
    [1045, [149, 8]],
    [0, [0x0]],
    [1, [0x1]],
    [15, [0xF]]
].forEach((item) => {
        it(`should compress numbers into byte arrays ` + item[0], () => {  
            const input = item[0] as number;
            const expected = item[1] as number[];

            const actual = encodeUnsignedLEB128(input);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});

describe("The encodeSignedLEB128 function", () => {
[
    [-123456, [0xC0, 0xBB, 0x78]]
    
].forEach((item) => {
        it(`should compress numbers into byte arrays ` + item[0], () => {  
            const input = item[0] as number;
            const expected = item[1] as number[];

            const actual = encodeSignedLEB128(input);            
            
            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});