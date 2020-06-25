
// https://en.wikipedia.org/wiki/LEB128
/* 
   624485 is encoded as 0xE5 0x8E 0x26
   MSB ------------------ LSB
      10011000011101100101  In raw binary
     010011000011101100101  Padded to a multiple of 7 bits
 0100110  0001110  1100101  Split into 7-bit groups
00100110 10001110 11100101  Add high 1 bits on all but last (most significant) group to form bytes
    0x26     0x8E     0xE5  In hexadecimal

→ 0xE5 0x8E 0x26            Output stream (LSB to MSB)
*/

export function encodeUnsignedLEB128(value:number) : number[]
{
    const bytes :number[] = [];

    do 
    {
        let byte = value & 0x7F;
        
        value >>>= 7;

        // are we at the end?
        if (value != 0) 
            byte = byte | 0x80;

        bytes.push(byte);

    } while (value != 0);

    return bytes;
}

/*
-123456 is encoded as 0xC0 0xBB 0x78:

MSB ------------------ LSB 
         11110001001000000  Binary encoding of 123456
     000011110001001000000  As a 21-bit number
     111100001110110111111  Negating all bits (one’s complement)
     111100001110111000000  Adding one (two’s complement)
 1111000  0111011  1000000  Split into 7-bit groups
01111000 10111011 11000000  Add high 1 bits on all but last (most significant) group to form bytes
    0x78     0xBB     0xC0  In hexadecimal

→ 0xC0 0xBB 0x78            Output stream (LSB to MSB)
*/
export function encodeSignedLEB128(value:number) : number[]
{
    const bytes :number[] = [];

    while (true) 
    {
        let byte = value & 0x7F;
        value >>= 7;
          
        // sign bit of byte is second high order bit (0x40)
        if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0))
        {
            bytes.push(byte);
            return bytes
        }
        
        byte = byte | 0x80;
        
        bytes.push(byte);
    }
}