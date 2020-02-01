import Memory from "./Memory";
import Region from "../../Assembler/Region";

export default class RAM implements Memory
{    
    private readonly buffer : ArrayBuffer;
    private readonly view : DataView;
    private readonly readonlyRegions : Region[];
 
    constructor(sizeInBytes : number)
    {
        this.buffer = new ArrayBuffer(sizeInBytes);
        this.view = new DataView(this.buffer);
        this.readonlyRegions = [];
    }

    get capacity() : number
    {
        return this.buffer.byteLength;
    }

    readByte(address: number) : number {
       return this.view.getInt8(address);
    }

    storeByte(address: number, value : number) : void
    {
        this.checkReadonlyAccess(address, 1);

        this.view.setInt8(address, value);
    }

    readWord(address: number) : number {
        return this.view.getInt16(address, true);
    }

    storeWord(address: number, value : number) : void{
        this.checkReadonlyAccess(address, 2);
        this.view.setInt16(address, value, true);
    }

    readDWord(address: number) : number {
        return this.view.getInt32(address, true);
    }

    storeDWord(address: number, value : number) : void{
        this.checkReadonlyAccess(address, 4);
        this.view.setInt32(address, value, true);
    }

    readFloat32(address: number) : number {
        return this.view.getFloat32(address, true);
    }

    storeFloat32(address: number, value : number) : void{
        this.checkReadonlyAccess(address, 4);
        this.view.setFloat32(address, value, true);
    }

    readFloat64(address: number) : number {
        return this.view.getFloat64(address, true);
    }

    storeFloat64(address: number, value : number) : void{
        this.checkReadonlyAccess(address, 8);
        this.view.setFloat64(address, value, true);
    }

    readNumber(address: number, size : number) : number {        
        switch(size)
        {
            case 1 : 
                return this.view.getInt8(address);
            case 2 : 
                return this.view.getInt16(address, true);
            case 4 : 
                return this.view.getInt32(address, true);
            case 8 : 
                return this.view.getFloat64(address, true);
            default:
                throw RangeError("invalid operand size");
        }   
    }

    storeNumber(address: number, value : number, size : number) : void
    {
        this.checkReadonlyAccess(address, size);
        switch(size)
        {
            case 1 : 
                this.view.setInt8(address, value);
                break;
            case 2 : 
                this.view.setInt16(address, value, true);
                break;
            case 4 : 
                this.view.setInt32(address, value, true);
                break;
            case 8 : 
                this.view.setFloat64(address, value, true);
                break;                                                
        }        
    }

    blitStoreBytes(baseAddress: number, buffer : ArrayBuffer) : void {

        this.checkReadonlyAccess(baseAddress, buffer.byteLength);

        const source = new Int8Array(buffer);
        const destinaiton = new Int8Array(this.buffer);

        for(let i = 0; i< source.length; i++)
            destinaiton[baseAddress + i] = source[i];
    }

    blitReadBytes(baseAddress: number, length : number) : Uint8Array {
        return new Uint8Array(this.buffer.slice(baseAddress, baseAddress + length));
    }

    getDataView(): DataView {
        return new DataView(this.buffer);
    }

    setReadonlyRegions(regions: Region[]) {
        for(let region of regions)
            this.readonlyRegions.push( region );
    }

    setReadonlyRegion(start: number, length: number) {
        this.readonlyRegions.push( new Region(start, start + length) );
    }

    checkReadonlyAccess(address: number, length: number) {
        let other = new Region(address, address + length);

        for(let region of this.readonlyRegions)
        {
            if(region.contains(address) ||
               region.overlaps(other))
               throw new Error("INVALID MEMORY WRITE");
        }
    }
}