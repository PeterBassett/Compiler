export default interface Memory
{
    readonly capacity : number;
    
    readByte(address: number) : number;
    storeByte(address: number, value : number) : void;

    readWord(address: number) : number;
    storeWord(address: number, value : number) : void;
    
    readDWord(address: number) : number;
    storeDWord(address: number, value : number) : void;
    
    readFloat32(address: number) : number;
    storeFloat32(address: number, value : number) : void;
    
    readFloat64(address: number) : number;
    storeFloat64(address: number, value : number) : void;

    readNumber(address: number, bytes : number) : number;
    storeNumber(address: number, value : number, bytes : number) : void;

    blitStoreBytes(baseAddress: number, buffer : ArrayBuffer) : void;
    blitReadBytes(baseAddress: number, length : number) : Uint8Array;
}