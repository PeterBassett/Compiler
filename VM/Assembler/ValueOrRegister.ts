export default class ValueOrRegister
{
    constructor(register?:string, isPointer?:boolean, value?:number) {
        this.register = register;
        this.isPointer = isPointer || false;
        this.value = value;
    }

    value? : number;
    register? : string;
    isPointer : boolean;
}