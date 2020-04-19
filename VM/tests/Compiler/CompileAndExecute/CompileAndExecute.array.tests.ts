import run from "./CompileAndExecute.base";

describe("Complie Assemble and Execute arrays", () => {
    [
[`func main() : int
{
    let root : [3]int;
    root[1] = 123;
    return root[1];
}`, 123],
[`func main() : int
{
    let root : [3]int;
    root[0] = 5;
    root[1] = 123;
    root[2] = 1024;
    return root[1];
}`, 123],
[`func main() : float
{
    let root : [3]float;
    root[0] = 3.14159;
    root[1] = 4.14159;
    root[2] = 5.14159;
    return root[1];
}`, 4.14159],
[`func main() : float
{
    let root : [3]float;
    root[0] = 3.14159;
    root[1] = 2 * 3.14159;
    root[2] = 3 * 3.14159;
    return root[1];
}`, 3.14159 * 2],
[`func main() : float
{
    let root : [3]float;
    root[0] = 3.14159;
    root[1] = 2 * 3.14159;
    root[2] = 3 * 3.14159;
    return root[1] / 2;
}`, 3.14159],
[`func main() : float
{
    let root : [3]float;
    root[0] = 3.14159;
    root[1] = root[0];
    root[2] = root[1];
    return root[2];
}`, 3.14159],
[`func main() : float
{
    let root : [3]float;
    root[0] = 3.14159;
    root[1] = root[0];
    root[2] = root[1] + root[0];
    return root[2];
}`, 3.14159 * 2],
[`func main() : int
{
    let root : [10]int;
    let sum : int;

    for let i in 0 to 9
    {
        root[i] = i;
    }    

    return root[9];
}`, 9],
[`func main() : int
{
    let root : [10]int;
    let sum : int;

    for let i in 0 to 9
    {
        root[i] = i;
    } 
    
    for let i in 0 to 9
    {
        sum = sum + root[i];
    }    

    return sum;
}`, 45],
[`func main() : int
{
    let root : [3][2]int;

    root[0][0] = 1;
    root[0][1] = 2;
    
    root[1][0] = 3;
    root[1][1] = 4;
    
    root[2][0] = 5;
    root[2][1] = 6;

    return root[2][1];
}`, 6],
[`func main() : int
{
    let root : [3][2]int;

    root[0][0] = 1;
    root[0][1] = 2;
    
    root[1][0] = 3;
    root[1][1] = 4;
    
    root[2][0] = 5;
    root[2][1] = 6;

    return root[1][1];
}`, 4],
[`func main() : int
{
    let root : [3][2]int;

    for let x in 0 to 2
    {
        for let y in 0 to 1
        {
            root[x][y] = (x + 1) * (y + 1);
        }
    } 

    return root[2][1];
}`, 6],
[`func main() : int
{
    let root : [5][4][3][2]int;

    for let a in 0 to 4
    for let b in 0 to 3
    for let c in 0 to 2
    for let d in 0 to 1
    {
        root[a][b][c][d] = ((a+1) * 5) * ((b+1) * 4) * ((c+1) * 3) * ((d+1) * 2);
    }     

    return root[3][2][1][0];
}`, 2880],
[`
struct pair
{
    a : int;
    b : int;
}
func main() : int
{
    let root : [5]pair;

    root[1].b = 123;

    return root[1].b;
}`, 123],
[`
struct pair
{
    a : [3]int;
    b : [4]int;
}
func main() : int
{
    let root : pair;

    root.a[1] = 123;
    root.b[2] = 321;

    return root.b[2];
}`, 321],
[`
struct pair
{
    a : [3]int;
    b : [4]int;
}
func main() : int
{
    let root : [3]pair;

    root[0].a[0] = 1;    
    root[1].a[0] = 2;
    root[2].a[0] = 3;

    root[0].a[1] = 4;    
    root[1].a[1] = 5;
    root[2].a[1] = 6;

    root[0].a[2] = 7;
    root[1].a[2] = 8;
    root[2].a[2] = 9;    

    root[0].b[0] = 10;    
    root[1].b[0] = 11;
    root[2].b[0] = 12;

    root[0].b[1] = 13;    
    root[1].b[1] = 14;
    root[2].b[1] = 15;

    root[0].b[2] = 16;
    root[1].b[2] = 17;
    root[2].b[2] = 18; 
    
    root[0].b[3] = 19;
    root[1].b[3] = 20;
    root[2].b[3] = 21;      

    return root[2].b[1]; // 15;
}`, 15],
[`
// function taking a pointer to an array of 5 ints 
func updatearray(a : *[5]int) : int
{ 
  
    // updating the array value at specified index 
    (*a)[3] = 750;

    // HACK : Need to make void functions work
    return 1;
} 
  
// Main Function 
func main() : int { 
  
    let arr : [5]int;
    arr[0] = 78;
    arr[1] = 89;
    arr[2] = 45;
    arr[3] = 56;
    arr[4] = 14;
  
    // passing pointer to an array to a function 
    updatearray(&arr);
  
    // array after updating 
    return arr[3];
}`, 750],
[`
// function taking a copy of an array of 5 ints 
func updatearray(a : [5]int) : int
{ 
    // updating the copy of the arry passed by value
    a[3] = 2;
    
    return a[3];
} 
  
// Main Function 
func main() : int 
{ 
    let arr : [5]int;
    arr[0] = 78;
    arr[1] = 89;
    arr[2] = 45;
    arr[3] = 56;
    arr[4] = 14;
  
    // passing array by value to a function 
    let result : int = updatearray(arr);
  
    // array after updating 
    return arr[3] * result;
}`, 56 * 2],
[`
// function returning an array of 5 ints 
func createarray() : [5]int
{ 
    let arr : [5]int;
    arr[0] = 78;
    arr[1] = 89;
    arr[2] = 45;
    arr[3] = 56;    
    arr[4] = 14;
    
    return arr;
} 
  
// Main Function 
func main() : int {     
    let result = createarray();
  
    // array after updating 
    return result[3];
}`, 56],
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result =  run(text);
            
            expect(result).toEqual(expected);
        });
    });
});