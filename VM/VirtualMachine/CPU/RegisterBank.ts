export default class RegisterBank
{        
    public reg : number[];

    public get R0() : number {
        return this.reg[0];
    }
    public get R1() : number {
        return this.reg[1];
    }
    public get R2() : number {
        return this.reg[2];
    }
    public get R3() : number {
        return this.reg[3];
    }
    public get R4() : number {
        return this.reg[4];
    }
    public get R5() : number {
        return this.reg[5];
    }
    public get R6() : number {
        return this.reg[6];
    }
    public get SP() : number {
        return this.reg[7];
    }
    public get IP() : number {
        return this.reg[8];
    }    

    public set R0(r:number) {
        this.reg[0] = r;
    }
    public set R1(r:number) {
        this.reg[1] = r;
    }
    public set R2(r:number) {
        this.reg[2] = r;
    }
    public set R3(r:number) {
        this.reg[3] = r;
    }
    public set R4(r:number) {
        this.reg[4] = r;
    }
    public set R5(r:number) {
        this.reg[5] = r;
    }
    public set R6(r:number) {
        this.reg[6] = r;
    }
    public set SP(r:number) {
        this.reg[7] = r;
    }
    public set IP(r:number) {
        this.reg[8] = r;
    }
   
    constructor(ramSize : number)
    {
        this.reg = [0,0,0,0,0,0,0,0,0];
        
        // stack starts at the top of memory and grows down.
        this.SP = ramSize - 4;         
    }

    public get(register : number) : number
    {
        return this.reg[register];        
    }

    public set(register : number, value : number)
    {
        this.reg[register] = value;
    }
}