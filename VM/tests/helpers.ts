export function randomFloat(min : number, max : number) : number
{
    if(min > max)
        throw new RangeError("Min must be less than max.");

    return Math.random() * (max - min) + min;
}

export function randomInt(min : number, max : number) : number
{
    return Math.floor(randomFloat(min, max));
}