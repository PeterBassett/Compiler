/*
function Mask(bits : number) : number
{
    return Math.pow(2, bits) - 1;
}

export const OpCodeOffset = 0;
export const OpCodeBits = 6;
export const OpCodeMask = Mask(OpCodeBits);
export const OpCode32BitMask = OpCodeMask << OpCodeOffset;

export const OpcodeModeOffset = OpCodeOffset + OpCodeBits;
export const OpcodeModeBits = 4;
export const OpcodeModeMask = Mask(OpcodeModeBits);
export const OpcodeMode32BitMask = OpcodeModeMask << OpcodeModeOffset;

export const SourceRegisterOffset = OpcodeModeOffset + OpcodeModeBits;
export const SourceRegisterBits = 3
export const SourceRegisterMask = Mask(SourceRegisterBits);
export const SourceRegister32BitMask = SourceRegisterMask << SourceRegisterOffset;

export const DestinationRegisterOffset = SourceRegisterOffset + SourceRegisterBits;
export const DestinationRegisterBits = 3
export const DestinationRegisterMask = Mask(DestinationRegisterBits);
export const DestinationRegister32BitMask = DestinationRegisterMask << DestinationRegisterOffset;

export const MemoryAddressOffset = DestinationRegisterOffset + DestinationRegisterBits;
export const MemoryAddressBits = 16;
export const MemoryAddressMask = Mask(MemoryAddressBits);
export const MemoryAddress32BitMask = MemoryAddressMask << MemoryAddressOffset;
*/
// 6 bit opcode | 4 bit opcode mode (general purpose) | 3 bit destination register | 3 bit source register |  16 bit memory address