import Register from "./Register";

export default class RegisterBank
{        
    public IP: number;
    public SP: number;

    public R0: number;
    public R1: number;
    public R2: number;
    public R3: number;
    public R4: number;
    public R5: number;
    public R6: number;
   
    constructor(ramSize : number)
    {
        this.IP = this.SP = this.R0 = this.R1 = this.R2 = this.R3 = this.R4 = this.R5 = this.R6 = 0;

        // stack starts at the top of memory and grows down.
        this.SP = ramSize - 4;         
    }

    public get(register : number) : number
    {
        if(register == 7)
            return this.SP;

        if(register == 8)
            return this.IP;

        return (this as any)["R" + register] as number;
    }

    public set(register : number, value : number) : void
    {
        if(register == 7)
        {
            this.SP = value;
            return;
        }
        
        (this as any)["R" + register] = value;
    }
}