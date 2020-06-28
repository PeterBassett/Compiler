import { encodeUnsignedLEB128, encodeSignedLEB128, encodeVector, encodeArrays } from "../../../../Language/Compiler/CodeGeneration/WASM/LEBencoding";

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

function fillArray(value:number, len:number) : number[]
{
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
  }

describe("The encodeVector function", () => {
    [
        [[1,2,3,4], [0x4, 1, 2, 3, 4]],
        [[1], [0x1, 1]],
        [[], [0x0]],
        [[255], [0x1, 255]],    
        [[256], [0x1, 0]], // all values truncated to 8 bits 
        [[257], [0x1, 1]], // all values truncated to 8 bits
        [ [...fillArray(1, 512)], [128, 4, ...fillArray(1, 512)]] // length encoded in the firsttwo bytes in this case.

    ].forEach((item) => {
        it(`should prefix an array with a LEB128 length ` + item[0].toString().substr(0, 100), () => {  
            const input = item[0] as number[];
            const expected = item[1] as number[];

            const actual = encodeVector(input);            
            const expectedEncodedLength = encodeUnsignedLEB128(input.length);
            
            for(let i = 0; i < expectedEncodedLength.length; i++)
                expect(actual[i]).toEqual(expectedEncodedLength[i]);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});

describe("The encodeArrays function", () => {
    [
        // still works with single arrays
        [[1,2,3,4], [0x4, 1, 2, 3, 4], 4],
        [[1], [0x1, 1], 1],
        [[], [0x0], 0],
        [[255], [0x1, 255], 1],    
        [[256], [0x1, 0], 1], // all values truncated to 8 bits 
        [[257], [0x1, 1], 1], // all values truncated to 8 bits
        [ [...fillArray(1, 512)], [128, 4, ...fillArray(1, 512)], 512], // length encoded in the firsttwo bytes in this case.

        // also works with nultiple arrays
        [  [[1,2,3,4],[5,6,7,8],[9, 10, 11, 12]], [3, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3],
        [  [[1,2,3,4],[5,6,7,8],[1223, 454545, 566565656]], [3, 1, 2, 3, 4, 5, 6, 7, 8, 199, 145, 24], 3],

    ].forEach((item) => {
        it(`should prefix an array with a LEB128 length ` + item[0].toString().substr(0, 100), () => {  
            const inputs = item[0] as any[];
            const expected = item[1] as number[];
            const length = item[2] as number;
            
            const actual = encodeArrays(inputs);            
            const expectedEncodedLength = encodeUnsignedLEB128(length);
            
            for(let i = 0; i < expectedEncodedLength.length; i++)
                expect(actual[i]).toEqual(expectedEncodedLength[i]);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});
