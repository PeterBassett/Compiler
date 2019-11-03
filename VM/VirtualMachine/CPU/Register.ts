import RAM from "../Memory/RAM";

export default class Register
{
    private ram : RAM;
    constructor(size : number | void)
    {
        size = size || 2;

        if(size != 1 && size != 2)
            throw new RangeError("Registers an only be 1 or 2 bytes wide.")

        this.ram = new RAM(size);
    }

    readWord() : number
    {
        return this.ram.readWord(0);
    }

    readLowByte() : number
    {
        return this.ram.readByte(0);
    }

    readHighByte() : number
    {
        return this.ram.readByte(1);
    }

    writeWord(value : number) : void
    {
        this.ram.storeWord(0, value);
    }

    writeLowByte(value : number) : void
    {
        this.ram.storeByte(0, value);
    }

    writeHighByte(value : number) : void
    {
        this.ram.storeByte(1, value);
    }


}