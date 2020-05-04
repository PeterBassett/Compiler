import run from "./CompileAndExecute.base";

describe("Complie Assemble and Execute byte data type", () => {

[
[`func main() : byte
{
    return 5;
}`, 5],   
[`func main() : byte
{
    return 5 + 1;
}`, 6],
[`func main() : byte
{
    return 5 - 1;
}`, 4],
[`func main() : byte
{
    return 5 * 2;
}`, 10],
[`func main() : byte
{
    return 10 / 2;
}`, 5],
[`func main() : byte
{
    let i : byte = 5;
    return i;
}`, 5],
[`func main() : byte
{
    let i : byte = 5;
    return i * i;
}`, 25],
[`func main() : byte
{
    let i : byte = 5;
    let n : byte = 10;
    return i * n;
}`, 50],
[`func main() : byte
{
    var n : byte = 0;
    n = 5;
    return n;
}`, 5],
[`func main() : byte
{
    let i : byte = 0;
    i = 10;
    return i;
}`, 10],
[`func main() : byte
{
    let i : byte;
    i = 10;
    let n : byte;
    n = 20;
    return i + n;
}`, 30],
[`func main() : byte
{
    if true
        return 1;
    else
        return 0;        
}`, 1],
[`func main() : byte
{
    if false
        return 1;
    else
        return 0;        
}`, 0],
[`func main() : byte
{
    if false
        return 1;
    
    return 0;        
}`, 0],
[`func main() : byte
{
    let x : byte = 0;
    for let i in 1 to 10
        x = byte(x + i);
        
    return x;
}`, 55],
[`func main() : byte
{
    let x : byte = 0;
    while x < 10
        x = byte(x + 1);
        
    return x;
}`, 10],
[`func main() : byte
{
    let x : byte = 0;
    
    for let a in 1 to 10
        for let b in 1 to 10
            x = byte(x + 1);
    
    return x;
}`, 100],
[`func main() : byte
{
    if true
    {
        let i : byte = 0;
        i = byte(i + 5);
    }
    let j : byte = 1;
    return j;
}`, 1],
[`func plusOne(n:byte):byte {
    return byte(n + 1);
}

func main() : byte {
    return plusOne(1);
}`, 2],
[`func add(a:byte, b:byte):byte {
    return a + b;
}

func main() : byte {
    return add(1, 2);
}`, 3],
[`
func a(x:byte):byte
{
    return byte(x + 1);
}
func b(x:byte):byte
{
    return byte(a(x) + 1);
}
func c(x:byte):byte
{
    let dummy = byte(b(x) + 1);
    return dummy;
}
func d(x:byte):byte
{
    let dummy = byte(c(x) + 1);
    return dummy;
}
func main() : byte {
    return d(1);
}`, 5],
[`func add(a:byte, b:byte, c:byte, d:byte):byte {
    return a + b + c + d;
}

func main() : byte {
    return add(1, 2, 3, 4);
}`, 10],
[`func plusOne(n:byte):byte {
    return byte(n + 1);
}

func timesTwo(n:byte):byte {
    return byte(n * 2);
}

func main() : byte {
    return timesTwo(plusOne(1));
}`, 4],
[`func fib(n:byte):byte {
    if (n == 0 || n == 1) {
        return n;
    } else {
        return fib(byte(n - 1)) + fib(byte(n - 2));
    }
}

func main() : byte {
    let n : byte = 10;
    return fib(n);
}`, 55],
[`func main() : byte {
    // byteeger division
    return 5 / 2;
}`, 2],
[`func main() : float {
    return 3.14159;
}`, 3.14159],
[`func main() : byte {
    let f : bool = true;
    if f
        return 45;
    
    return 123;
}`, 45],
[`func a(n:byte):byte {
    n = 5;
    return n;
}
func main() : byte {
    return a(1);
}`, 5],
[`func f(flag:bool):bool {
    return flag;
}
func main() : byte {
    if f(true)
        return 45;
    
    return 123;
}`, 45],
[`func iif(n:byte, flag:bool, n2:byte):byte {
    if flag    
        return n;
    else
        return n2;
}
func main() : byte {
    return iif(45, true, 123);
}`, 45],
[`func iif(n:byte, flag:bool, n2:byte):byte {
    if flag    
        return n;
    else
        return n2;
}
func main() : byte {
    return iif(45, false, 123);
}`, 123],
[`func three(n1:byte, n2:byte, n3:byte):byte {
    return n2;
}
func main() : byte {
    return three(1, 2, 3);
}`, 2],
[`func three(n1:byte, n2:byte, n3:byte):byte {
    return (n3*n2)/n1;
}
func main() : byte {
    return three(1, 2, 3);
}`, 6],
[`func test(
	a : byte, 
	b : bool, 
    c : byte, 
    d : bool) : byte 
{ 
	return c;
}

func main() : byte 
{
    let a : byte = 5;
    let b : bool = true;
    let c : byte = 15;
    let d : bool = false;

	return test(a, b, c, d);
}`, 15],
[
`let secondsInAMinute : byte = 60;
func main() : byte
{
    return secondsInAMinute;
}`, 60
],
[
`var a : byte = 1;
func change() : byte
{
    // assign to global
    a = 5;
    return 1;
}
func main() : byte
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
    // floating pobyte division
    return 5.0 / 2;
}`, 2.5],
[`func main() : byte {
    return 5 / 2;
}`,
2],
[`func main() : byte {
    return byte(5.5);
}`,
5],
[
`func test(num:byte):byte  
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
func main() : byte {
    return test(0);
}`, 1],
[
`func test(num:byte):byte  
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
func main() : byte {
    return test(1);
}`, 1],
[
`func test(num:byte):byte  
{
    // test the greater than or equal to operator
    if (num > 0)
    {
        return 1;
    }
    else
    {
        return 2;
    }    
}
func main() : byte {
    return test(0);
}`, 2],
[
`func test(num:byte):byte  
{
    // test the greater than or equal to operator
    if (num > 0)
    {
        return 1;
    }
    else
    {
        return 2;
    }    
}
func main() : byte {
    return test(1);
}`, 1],
[
`func fib(num:byte):byte 
{
	var a : byte = 1;
    var b : byte = 0;
    var temp : byte = 0;

    while (num > 0)
    {
      temp = a;
      a = a + b;
      b = temp;
      num = byte(num - 1);
    }

  	return b;
}

func main() : byte {
    return fib(10);
}`, 55],
[
`func McCarthy(n:byte) : byte
{
    if (n > 100)
        return byte(n - 10);

    return McCarthy(McCarthy(byte(n + 11)));
}
func main() : byte
{
    return McCarthy(45);
}
`, 91],
[`
func main() : byte
{            
    let i : byte = 1;

    for let x in 0 to 2 // loop inclusive
    {
        let x1 = byte(x * 2);
        for let y in 0 to 2 // loop inclusive
        {
            // variable declared and assigned inside a loop.
            let y1 : byte = byte(x1 * y); 
        
            i = i + y1;
        }        
    }

    return i;
}`, 19],
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
[`func main() : byte
{
    let i : byte = 62;

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