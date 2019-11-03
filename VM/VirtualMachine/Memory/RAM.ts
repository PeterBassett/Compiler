import Memory from "./Memory";

export default class RAM implements Memory
{
    private buffer : ArrayBuffer;
    private view : DataView;

    constructor(sizeInBytes : number)
    {
        this.buffer = new ArrayBuffer(sizeInBytes);
        this.view = new DataView(this.buffer);
    }

    get capacity() : number
    {
        return this.buffer.byteLength;
    }

    readByte(address: number) : number {
       return this.view.getUint8(address);
    }

    storeByte(address: number, value : number) : void{
        this.view.setUint8(address, value);
    }

    readWord(address: number) : number {
        return this.view.getUint16(address, true);
    }

    storeWord(address: number, value : number) : void{
        this.view.setUint16(address, value, true);
    }

    readDWord(address: number) : number {
        return this.view.getUint32(address, true);
    }

    storeDWord(address: number, value : number) : void{
        this.view.setUint32(address, value, true);
    }

    readFloat32(address: number) : number {
        return this.view.getFloat32(address, true);
    }

    storeFloat32(address: number, value : number) : void{
        this.view.setFloat32(address, value, true);
    }

    readFloat64(address: number) : number {
        return this.view.getFloat64(address, true);
    }

    storeFloat64(address: number, value : number) : void{
        this.view.setFloat64(address, value, true);
    }

    readNumber(address: number, size : number) : number {
        switch(size)
        {
            case 1 : 
                return this.view.getUint8(address);
            case 2 : 
                return this.view.getUint16(address, true);
            case 4 : 
                return this.view.getUint32(address, true);
            case 8 : 
                return this.view.getFloat64(address, true);
            default:
                throw RangeError("invalid operand size");
        }   
    }

    storeNumber(address: number, value : number, size : number) : void
    {
        switch(size)
        {
            case 1 : 
                this.view.setUint8(address, value);
                break;
            case 2 : 
                this.view.setUint16(address, value, true);
                break;
            case 4 : 
                this.view.setUint32(address, value, true);
                break;
            case 8 : 
                this.view.setFloat64(address, value, true);
                break;                                                
        }        
    }

    blitStoreBytes(baseAddress: number, buffer : ArrayBuffer) : void {
        const array = new Uint8Array(buffer);

        for(let i = 0; i< array.length; i++)
            this.storeByte(baseAddress + i, array[i]);
    }

    blitReadBytes(baseAddress: number, length : number) : Uint8Array {
        return new Uint8Array(this.buffer.slice(baseAddress, baseAddress + length));
    }

    getDataView(): DataView {
        return new DataView(this.buffer);
    }
}