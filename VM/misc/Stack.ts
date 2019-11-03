
export default class Stack<T>
{
    private readonly stack : T[] = [];

    public get length() : number
    {
        return this.stack.length;
    }

    public clear() : void
    {
        this.stack.splice(0, this.stack.length);
    }

    public push(value : T)
    {
        this.stack.push(value);
    }

    public pop() : T
    {
        if(this.stack.length == 0)
            throw new Error("Stack is empty");

        return this.stack.pop()!;
    }

    public peek() : T
    {
        if(this.stack.length == 0)
            throw new Error("Stack is empty");

        return this.stack[this.stack.length - 1];
    }
}