import run, { printPerformance, resetPerformance } from "./CompileAndExecute.base";

describe("Complie Assemble and Execute unions", () => {
    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("unions");
    });
    
    [
[`union root 
{
    a : int;
    b : int;
}

func main() : int
{
    let u : root;

    u.a = 5;

    return u.b;
}`, 5],
[`

struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union color 
{
    value : int;
    components : rgba;
}

func main() : int
{
    let a : color;
    
    a.components.r = 1;
    
    return a.value;
}`, 1],
[`

struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union color 
{
    value : int;
    components : rgba;
}

func main() : int
{
    let a : color;
    
    a.components.g = 1;
    
    return a.value;
}`, 256],
[`

struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union color 
{
    value : int;
    components : rgba;
}

func main() : int
{
    let a : color;
    
    a.components.b = 1;
    
    return a.value;
}`, 65536],
[`

struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union color 
{
    value : int;
    components : rgba;
}

func main() : int
{
    let a : color;
    
    a.components.a = 1;
    
    return a.value;
}`, 16777216],
[`
struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union color 
{
    value : int;
    components : rgba;
    indexable : [4]byte;
}

func main() : int
{
    let a : color;
    
    a.components.r = 127;
    
    a.indexable[1] = a.indexable[0];

    return a.value;
}`, 127 | 127 << 8],
[`
struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union wxyz
{
    a:rgba;
    b:rgba;
}

union root 
{
    value : int;
    col : wxyz;
}

func main() : int
{
    let a : root;
    
    a.col.a.r = 1;
    
    return a.col.b.r;
}`, 1],
[`
struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union wxyz
{
    a:rgba;
    b:rgba;
}

union root 
{
    value : int;
    col : wxyz;
}

func main() : int
{
    let a : root;
    
    a.col.a.r = 1;

    a.col.b.g = a.col.a.r;
    
    return a.value;
}`, 257],
[`
struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union wxyz
{
    a:rgba;
    b:rgba;
}

union root 
{
    value : int;
    col : wxyz;
}

func main() : int
{
    let a : root;
    
    a.col.a.r = 1;
    a.col.b.g = 2;
    a.col.a.b = 4;
    a.col.b.a = 8;

    return a.col.a.b;
}`, 4],
[`
struct rgba
{
    r:byte;
    g:byte;
    b:byte;
    a:byte;
}

union wxyz
{
    a:rgba;
    b:rgba;
}

union root 
{
    value : int;
    col : wxyz;
}

func main() : int
{
    let a : root;
    
    a.col.a.r = 1;
    a.col.b.g = 2;
    a.col.a.b = 4;
    a.col.b.a = 8;

    return a.value;
}`, 134480385],
[`
union readPointer
{
    value : int;
    pointer : *readPointer;
}

func main() : int
{
    let a : readPointer;
    
    a.pointer = &a;

    return a.value;
}`, 65520 /* this is an arbitrary memory location. If memory size changes, this value will change.
if there is another local, parameter or function call in used in the sample program, this value will change */]
,
[`
union root
{
    value : int;
    bytes : [4]byte;
}

func main() : int
{
    let a : root;
    
    a.bytes[0] = 1;
    a.bytes[1] = 2;
    a.bytes[2] = 4;
    a.bytes[3] = 8;

    return a.value;
}`, 134480385]
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});