interface CharType {
}
export type Char = string & CharType;
//const isChar = (str: string): str is Char => /^(.|\n|\r)$/.test(str);
export function char(c: string): Char {
    //you can also use is char here for to test whether actually is char
    if (c.length != 1 /*|| !isChar(c)*/) {
        throw new Error('not a char');
    }
    return c;
}
