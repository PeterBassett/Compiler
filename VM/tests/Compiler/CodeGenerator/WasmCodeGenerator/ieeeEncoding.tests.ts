import { encodeFloat32, encodeFloat64 } from "../../../../Language/Compiler/CodeGeneration/WASM/ieeeEncoding";

describe("The encoderFloat32 function", () => {
    [
        [3.14, [195, 245, 72, 64]],
        // examples take from 
        // https://docs.microsoft.com/en-us/dotnet/api/system.bitconverter.getbytes?view=netcore-3.1#System_BitConverter_GetBytes_System_Single_
        [0.0000000E+000,         [0x00, 0x00, 0x00, 0x00]],
        [1.0000000E+000,         [0x00, 0x00, 0x80, 0x3F]],
        [1.5000000E+001,         [0x00, 0x00, 0x70, 0x41]],
        [6.5535000E+004,         [0x00, 0xFF, 0x7F, 0x47]],
        [3.9062500E-003,         [0x00, 0x00, 0x80, 0x3B]],
        [2.3283064E-010,         [0x00, 0x00, 0x80, 0x2F]],
        [1.2345000E-035,         [0x49, 0x46, 0x83, 0x05]],
        [1.2345671E+000,         [0x4B, 0x06, 0x9E, 0x3F]],
        [1.2345673E+000,         [0x4D, 0x06, 0x9E, 0x3F]],
        [1.2345676E+000,         [0x50, 0x06, 0x9E, 0x3F]],
        [1.2345679E+035,         [0x1E, 0x37, 0xBE, 0x79]],
        [-3.4028235E+038,        [0xFF, 0xFF, 0x7F, 0xFF]],
        [3.4028235E+038,         [0xFF, 0xFF, 0x7F, 0x7F]],
        [1.4012985E-045,         [0x01, 0x00, 0x00, 0x00]],
    ].forEach((item) => {
        it(`should encode a 32bit float in a byte array ` + item[0], () => {  
            const input = item[0] as number;
            const expected = item[1] as number[];

            const actual = encodeFloat32(input);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});

describe("The encoderFloat64 function", () => {
    [        
        [3.14, [31, 133, 235, 81, 184, 30, 9, 64]],
        // examples taken from
        // https://docs.microsoft.com/en-us/dotnet/api/system.bitconverter.getbytes?view=netcore-3.1#System_BitConverter_GetBytes_System_Double_
        [0.0000000000000000E+000,       [0x0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
        [1.0000000000000000E+000,       [0x0, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3F]],
        [2.5500000000000000E+002,       [0x0, 0x00, 0x00, 0x00, 0x00, 0xE0, 0x6F, 0x40]],
        [4.2949672950000000E+009,       [0x0, 0x00, 0xE0, 0xFF, 0xFF, 0xFF, 0xEF, 0x41]],
        [3.9062500000000000E-003,       [0x0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x70, 0x3F]],
        [2.3283064365386963E-010,       [0x0, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x3D]],
        [1.2345678901234500E-300,       [0xDF, 0x88, 0x1E, 0x1C, 0xFE, 0x74, 0xAA, 0x01]],
        [1.2345678901234565E+000,       [0xFA, 0x59, 0x8C, 0x42, 0xCA, 0xC0, 0xF3, 0x3F]],
        [1.2345678901234567E+000,       [0xFB, 0x59, 0x8C, 0x42, 0xCA, 0xC0, 0xF3, 0x3F]],
        [1.2345678901234569E+000,       [0xFC, 0x59, 0x8C, 0x42, 0xCA, 0xC0, 0xF3, 0x3F]],
        [1.2345678901234569E+300,       [0x52, 0xD3, 0xBB, 0xBC, 0xE8, 0x7E, 0x3D, 0x7E]],
        [-1.7976931348623157E+308,      [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xEF, 0xFF]],
        [1.7976931348623157E+308,       [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xEF, 0x7F]],
        [4.9406564584124654E-324,       [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]],
    ].forEach((item) => {
        it(`should encode a 64bit float in a byte array ` + item[0], () => {  
            const input = item[0] as number;
            const expected = item[1] as number[];

            const actual = encodeFloat64(input);

            expect(actual.length).toEqual(expected.length);

            for(let i = 0; i < actual.length; i++)
                expect(actual[i]).toEqual(expected[i]);
        });
    });
});