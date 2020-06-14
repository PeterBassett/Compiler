import run, { printPerformance, resetPerformance } from "./CompileAndExecute.base";

describe("Complie Assemble and Execute", () => {
    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("general");
    });

[
[`func main() : int
{
    return 5;
}`, 5],   
[`func main() : int
{
    return 5 + 1;
}`, 6],
[`func main() : int
{
    return 5 - 1;
}`, 4],
[`func main() : int
{
    return 5 * 2;
}`, 10],
[`func main() : int
{
    return 10 / 2;
}`, 5],
[`func main() : int
{
    let i : int = 5;
    return i;
}`, 5],
[`func main() : int
{
    let i : int = 5;
    return i * i;
}`, 25],
[`func main() : int
{
    let i : int = 5;
    let n : int = 10;
    return i * n;
}`, 50],
[`func main() : int
{
    var n : int = 0;
    n = 5;
    return n;
}`, 5],
[`func main() : int
{
    let i : int = 0;
    i = 10;
    return i;
}`, 10],
[`func main() : int
{
    let i : int;
    i = 10;
    let n : int;
    n = 20;
    return i + n;
}`, 30],
[`func main() : int
{
    if true
        return 1;
    else
        return 0;        
}`, 1],
[`func main() : int
{
    if false
        return 1;
    else
        return 0;        
}`, 0],
[`func main() : int
{
    if false
        return 1;
    
    return 0;        
}`, 0],
[`func main() : int
{
    let x : int = 0;
    for let i in 1 to 10
        x = x + i;
        
    return x;
}`, 55],
[`func main() : int
{
    let x : int = 0;
    while x < 10
        x = x + 1;
        
    return x;
}`, 10],
[`func main() : int
{
    let x : int = 0;
    
    for let a in 1 to 10
        for let b in 1 to 10
            x = x + 1;
    
    return x;
}`, 100],
[`func main() : int
{
    if true
    {
        let i : int = 0;
        i = i + 5;
    }
    let j : int = 1;
    return j;
}`, 1],
[`func plusOne(n:int):int {
    return n + 1;
}

func main() : int {
    return plusOne(1);
}`, 2],
[`func add(a:int, b:int):int {
    return a + b;
}

func main() : int {
    return add(1, 2);
}`, 3],
[`
func a(x:int):int
{
    return x + 1;
}
func b(x:int):int
{
    return a(x) + 1;
}
func c(x:int):int
{
    return b(x) + 1;
}
func d(x:int):int
{
    return c(x) + 1;
}
func main() : int {
    return d(1);
}`, 5],
[`func add(a:int, b:int, c:int, d:int):int {
    return a + b + c + d;
}

func main() : int {
    return add(1, 2, 3, 4);
}`, 10],
[`func plusOne(n:int):int {
    return n + 1;
}

func timesTwo(n:int):int {
    return n * 2;
}

func main() : int {
    return timesTwo(plusOne(1));
}`, 4],
[`func fib(n:int):int {
    if (n == 0 || n == 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}

func main() : int {
    let n : int = 13;
    return fib(n);
}`, 233],
[`func main() : int {
    // integer division
    return 5 / 2;
}`, 2],
[`func main() : float {
    return 3.14159;
}`, 3.14159],
[`func main() : int {
    let f : bool = true;
    if f
        return 45;
    
    return 123;
}`, 45],
[`func a(n:int):int {
    n = 5;
    return n;
}
func main() : int {
    return a(1);
}`, 5],
[`func f(flag:bool):bool {
    return flag;
}
func main() : int {
    if f(true)
        return 45;
    
    return 123;
}`, 45],
[`func iif(n:int, flag:bool, n2:int):int {
    if flag    
        return n;
    else
        return n2;
}
func main() : int {
    return iif(45, true, 123);
}`, 45],
[`func iif(n:int, flag:bool, n2:int):int {
    if flag    
        return n;
    else
        return n2;
}
func main() : int {
    return iif(45, false, 123);
}`, 123],
[`func three(n1:int, n2:int, n3:int):int {
    return n2;
}
func main() : int {
    return three(1, 2, 3);
}`, 2],
[`func three(n1:int, n2:int, n3:int):int {
    return (n3*n2)/n1;
}
func main() : int {
    return three(1, 2, 3);
}`, 6],
[`func test(
	a : int, 
	b : bool, 
    c : int, 
    d : bool) : int 
{ 
	return c;
}

func main() : int 
{
    let a : int = 5;
    let b : bool = true;
    let c : int = 15;
    let d : bool = false;

	return test(a, b, c, d);
}`, 15],
[
`let secondsInAYear : int = 60*60*24;
func main() : int
{
    return secondsInAYear;
}`, 86400
],
[
`var a : int = 1;
func change() : int
{
    // assign to global
    a = 5;
    return 1;
}
func main() : int
{
    // assign to global
    a = 2;        
    change();

    // read from global
    return a;
}`, 5
],
[
`
var a1 : float = 1.2;
var a2 : float = 2.3;
var a3 : float = 3.4;
var a4 : float = 4.5;
var b1 : float;
var b2 : float; 
func main() : float
{
    b1 = 1.2;
    b2 = 2.3;

    return a1;
}`, 1.2
],
[`func main() : float
{
    return 1.2 + 2.3;
}`, 3.5
],
[`func main() : bool
{
    return true;
}`, 1
],
[`func main() : bool
{
    return false;
}`, 0
],
[`func main() : bool
{
    return 1.2 < 2.0;
}`, 1
],
[`func main() : bool
{
    return 1.2 > 2.0;
}`, 0
],
[`func main() : bool
{
    return 1.2 == 2.0;
}`, 0
],
[`func main() : bool
{
    return 2.0 == 2.0;
}`, 1
],
[`func main() : bool
{
    return 2.0 < 2.0;
}`, 0
],
[`func main() : bool
{
    return 2.0 > 2.0;
}`, 0
],
[`func main() : bool
{
    return 2.0 >= 2.0;
}`, 1
],
[`func main() : bool
{
    return 2.0 <= 2.0;
}`, 1
],
[`func main() : float {
    // floating point division
    return 5.0 / 2;
}`, 2.5],
[`func main() : int {
    return 5 / 2;
}`,
2],
[`func main() : int {
    return int(5.5);
}`,
5],
[
`func test(num:int):int  
{
    // test the greater than or equal to operator
    if (num >= 0)
    {
		return 1;
    }
	else
    {
    	return 2;
    }    
}
func main() : int {
	var a : int = 0;
    var b : int = 5;
    return test(a-b);
}`, 2],
[
`func fib(num:int):int 
{
	var a : int = 1;
    var b : int = 0;
    var temp : int = 0;

    while (num >= 0)
    {
      temp = a;
      a = a + b;
      b = temp;
      num = num - 1;
    }

  	return b;
}

func main() : int {
    return fib(25);
}`, 121393],
[
`func McCarthy(n:int) : int
{
    if (n > 100)
        return n - 10;

    return McCarthy(McCarthy(n + 11));
}
func main() : int
{
    return McCarthy(45);
}
`, 91],
[`
func main() : int
{            
    let i : int = 1;
    for let counter in 0 to 10
    {
        // variable declared and assigned inside a loop.
        let r : int = counter * i; 
        
        i = i + r;
    }

    return i;
}`, 39916800],
[`
func main() : int
{            
    let i : int = 1;

    for let x in 0 to 10 // loop inclusive
    {
        let x1 = x * 2;
        for let y in 0 to 10 // loop inclusive
        {
            // variable declared and assigned inside a loop.
            let y1 : int = x1 * y; 
        
            i = i + y1;
        }        
    }

    return i;
}`, 6051],
[
`func main() : float
{
    let a : float = -0.7;
    let b : float = 0.004;

    return b + a; 
}`, -0.696],
[
`func main() : float
{
    let a : float = 0.7;
    let b : float = 0.30001;
    let c :float = a * b;

    if(b + a > 1)
        return 1;
    else
        return 0;

}`, 1],
[
`func main() : float
{
    let a : float = 1.9;

    if(a * a > 1)
        return 1;
    else
        return 0;

}`, 1],
[`func main() : int
{
    let i : int = 62;

    if (i < 16)
    {
        return 1;
    }
    else if (i < 32)
    {
        return 2;
    }
    else if (i < 64)
    {
        return 3;
    }
    else
    { 
        return 4;
    }
}`, 3]
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});