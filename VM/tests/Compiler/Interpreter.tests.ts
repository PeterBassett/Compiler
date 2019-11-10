import Parser from "../../Language/Compiler/Syntax/Parser";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import Interpreter from "../../Language/SyntaxLevelInterpreter/Interpreter";

describe("An Interpreter object", () => {

    function test(text : string, expected : any) : void
    {
        let source = new SourceText(text);        
        let parser = new Parser(source);
        let compilationUnit = parser.parse();

        expect(compilationUnit.success).toEqual(true);

        let interpreter = new Interpreter()
        let actual = interpreter.Execute(compilationUnit.compilationUnit);
        
        expect(expected).toEqual(actual.ToObject());
    }

    [
[`func main() : int
{
    return 1;
}`, 
1],

[`func main() : float
{
    return 3.14;
}`, 
3.14],

[`func main() : string
{
    return "TEST";
}`, 
`TEST`],
        
[`func main() : int
{
    if 1 == 2
    {
        return 1;
    }
    else
    {
        return 2;
    }
}`, 
2 ],

[`func main() : int
{
    return 1;
}

func a() : int
{
    return 2;
}

func b() : int
{
    return 3;
}
`,
1],

[`func add(a:int, b:int) : int 
{ 
    return a + b;
}
func main() : int
{
    return add(1, 2);
}`, 
3],

[`func add(a:int, b:int) :int => a + b;
func main() : int
{
    return add(1, 2);
}`, 
3],
[
`func fib(n:int):int {
    if (n == 0 || n == 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}

func main() : int {
    let n : int = 13;
    return fib(n);
}`,
233
],
[`func plusOne(n:int):int {
    return n + 1;
}

func main() : int {
    return plusOne(1);
}`, 2],
[`func plusOne(n:int):int {
    return n + 1;
}

func timesTwo(n:int):int {
    return n * 2;
}

func main() : int {
    return timesTwo(plusOne(1));
}`, 4],
[`func plusOne(n:int):int {
    return n + 1;
}

func main() : int {
    return plusOne(1);
}`, 2],
[`func plusOne(n:int):int {
    return n + 1;
}

func timesTwo(n:int):int {
    return n * 2;
}

func main() : int {
    return timesTwo(plusOne(1));
}`, 4],
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
[
`func main() : int
{
    return 10*2/5+3-1;
}
`, 6],
[
`func main() : boolean
{
    return true;
}
`, true],
[
`func main() : boolean
{
    return false;
}
`, false],
[
`func main() : boolean
{
    return true && true;
}
`, true],
[
`func main() : boolean
{
    return true || false;
}
`, true],
[
`func main() : boolean
{
    return !true;
}
`, false],
[
`func main() : boolean
{
    return 1 < 2;
}
`, true],
[
`func main() : boolean
{
    return 1 < 1;
}
`, false],
[
`func main() : boolean
{
    return 1 > 2;
}
`, false],
[
`func main() : boolean
{
    return 1 == 2;
}
`, false],
[
`func main() : boolean
{
    return 1 != 2;
}
`, true],
[
`func main() : boolean
{
    return 1 <= 2;
}
`, true],
[
`func main() : boolean
{
    return 1 >= 2;
}
`, false],
[
`func main() : boolean
{
    return 2 >= 2;
}
`, true],
[
`func main() : string
{
    return "HELLO" + "WORLD";
}
`, "HELLOWORLD"],
[
`func main() : int
{
    let n : int = 0;

    for let i in 1 to 100
        n = n + i;

    return n;
}`, (function() { 
    let n = 0;
    for(var i = 1; i <= 100; i++)
        n = n + i;
    return n;
})()
],
[
`func main() : int
{
    let n : int = 0;

    for let i in 100 to 100
        n = n + i;

    return n;
}`, 100
],
[`func main() : int
{
    let n : int = 0;

    for let i in 100 to 99
        n = n + i;

    return n;
}`, 0],
[
`func main() : int
{
    let n : int = 0;

    for let i in 1 to 3
        n = n + i;

    return n;
}`, 6
],
[
`func Lower(n : int) : int
{
    return n * 3;
}
func Upper(n : int) : int
{
    return n * 2;
}
func main() : int
{
    let lower : int = Lower(10);
    let upper : int = Upper(50);
    let n : int = 0;
    for let i in lower to upper
        n = n + i;

    return n;
}`, 4615
],
[
`func main() : int
{
    let n : int = 0;
    for let i in -1 + 2 - 1 to 50 * 2
        n = n + i;

    return n;
}`, 5050
],
[
`func main() : int
{
    let n : int = 0;
    for let i in 0 to 10
        n = n + i;

    return n;
}`, 55
], 
[
`
func main() : int
{
    let n : int = 0;
    while n < 100
        n = n + 2;
    return n;
}`, 100
], 
[
`
func main() : int
{
    let n : int = 0;
    let i : int = 1;
    while n < 10
    {
        n = n + 1;
        i = i * 2;
    }
    return i;
}`, 1024
],
[`func main() : int {
    return int(5.5);
}`,
5],
[`func main() : string {
    return string(3.14159);
}`,
`3.14159`],
[`func main() : string {
    return string(true);
}`,
`true`],
[`func main() : string {
    return string(1==2);
}`,
`false`]
    ].forEach((item) => {
        it(`should execute an AST correctly : ` + item[0], () => {  
            let text = item[0] as string;
            let expected = item[1];
            test(text, expected);
        });
    });

[
[
`
func a() : int
{
    return b(123) + 1;
}

func b(one : int) : int
{    
    return one + 1;
}

func main() : int
{
    return a();
}`, 125
]
    ].forEach((item) => {
        it(`should execute a program defined in a backwards order correctly`, () => {  
            let text = item[0] as string;
            let expected = item[1];
            test(text, expected);
        });
    });

});