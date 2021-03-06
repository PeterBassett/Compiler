import run, { printPerformance, resetPerformance } from "./CompileAndExecute.base";

describe("Complie Assemble and Execute structs", () => {
    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("structs");
    });
    
    [
[`struct root 
{
    a1 : int;
}

struct leaf1
{
    b1 : int;
    b2 : root;
}

struct leaf2
{
    c1 : int;
    c2 : leaf1;
}

struct leaf3
{
    d1 : int;
    d2 : leaf2;
}

func main() : int
{
    let l3 : leaf3;
    let l2 : leaf2;

    // complex multilevel referencing
    l2.c2.b2.a1 = 3;

    l3.d2.c2.b2.a1 = l2.c2.b2.a1;

    return l3.d2.c2.b2.a1;
}`, 3],
[`struct leaf 
{
    a : int;
}

struct branch 
{
    a : int;
    b: leaf;
}

struct root 
{
    a : int;
    b:branch;
}

func foo() : int
{
    let a : root;
    let b : leaf;
    let c : branch;

    return 1+2;
}

func main() : int
{
    // local variables only
    let a : root;
    let b : leaf;
    let c : branch;

    return foo();
}`, 3],
[`struct leaf 
{
    a : int;
}
func main() : int
{
    let b : leaf;
    b.a = 3;
    return b.a;
}`, 3],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}
func main() : int
{
    let a : root;
    a.a.la = 3;
    a.a.lb = 1;

    let l : leaf;
    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    a : int;
}

struct branch 
{
    a : int;
    b: leaf;
}

struct root 
{
    a : int;
    b:branch;
}

func main() : int
{
    // multilevel assignment
    let r : root;
    r.a = 5;
    r.b.a = 15;
    r.b.b.a = 25;

    return r.b.a;
}`, 15],
[`struct root 
{
    a : int;
}

func main() : int
{
    // simple assignment and member referencing
    let r : root;
    r.a = 5;

    return r.a;
}`, 5],
[`struct root 
{
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct root 
{
    flag : bool;
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : float
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.b;
}`, 5.3],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : bool
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.flag;
}`, 0],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

func main() : bool
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;
 
    // create copy of struct
    s2 = s1;

    return s2.flag;
}`, 1],
[`struct root 
{
    a : int;
}

func main() : int
{
    // struct assignment
    let s1 : root;
    let s2 : root;
    s1.a = 6;
    s2.a = 4;
    
    // create copy of struct
    s2 = s1;

    s1.a = 5;

    return s2.a;
}`, 6],
[`struct root 
{
    a : int;
    b : int;
    c : int;
}

func foo(s : root) : int
{
    return s.b;
}

func main() : int
{
    // simple struct parameter and member referencing
    let r : root;
    r.a = 1;
    r.b = 5;
    r.c = 12;

    return foo(r);
}`, 5],
[`struct root 
{
    a : int;
    b : int;
    c : int;
}

func foo() : root
{
    let r : root;
    r.a = 1;
    r.b = 5;
    r.c = 12;

    return r; // struct return type
}

func main() : int
{
    let r : root;
    // struct return types!
    r = foo();
    return r.b;
}`, 5],
[`struct root 
{
    a : float;
    b : int;
    c : bool;
}

func foo() : root
{
    let r : root;
    r.a = 3.14159;
    r.b = 5;
    r.c = true;
    return r;
}

func main() : int
{
    // rvalue member reference
    return foo().b;
}`, 5],
[`struct root 
{
    a : float;
    b : int;
    c : bool;
}

func foo() : root
{
    let bar1:int;
    let bar2:bool;
    let r : root;
    let bar3:float;

    r.a = 3.14159;
    r.b = 5;
    r.c = true;
    return r;
}

func main() : int
{
    let bar1:int;
    let bar2:bool;
    let bar3:float;
    let bar4:float;

    // rvalue member reference with complex stack allocations
    return foo().b;
}`, 5],
[`struct root 
{
    a : float;
    b : int;
    c : bool;
}

func makeRoot() : root
{
    let r : root;

    r.a = 3.14159;
    r.b = 4;
    r.c = true;
    
    return r;
}

func main() : int
{
    let bar1:int;

    // struct initialisation from function call
    let r:root = makeRoot();
    let bar3:float;
    let bar4:float;

    return r.b;
}`, 4],
[`struct root 
{
    a : int;    
    b : float;
    c : bool;
    d: int;
    e: float;
}

func foo() : root
{
    let r : root;
    r.a = 1;
    r.b = 3.14159;
    r.c = true;
    r.d = 7;
    r.e = 0.7171;

    return r; // struct return type
}

func foo2() : float
{
    let r : root = foo();
    return r.b;
}

func main() : float
{
    return foo2();
}`, 3.14159],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    return s1.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : float
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    return s1.b;
}`, 5.3],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : bool
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    return s1.flag;
}`, 0],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;

func main() : bool
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;
 
    return s1.flag;
}`, 1],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s0 : root;
let s1 : root;
let s2 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;
 
    return s1.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s0 : root;
let s1 : root;
let s2 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = true;

    s2.a = s1.a;
    s2.b = s1.b;
    s2.flag= s1.flag;
 
    return s2.a;
}`, 6],
[`struct root 
{
    b:float;
    flag : bool;
    a : int;
}

// global structs
let s1 : root;
let s2 : root;

func main() : int
{
    // struct assignment
    s1.a = 6;
    s1.b = 5.3;
    s1.flag = false;
 
    // create copy of struct
    s2 = s1;

    return s2.a;
}`, 6],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let a : root;

func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    let l : leaf;
    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let l : leaf;
 
func main() : int
{
    let a : root;
    a.a.la = 3;
    a.a.lb = 1;

    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let a : root;
let l : leaf;
 
func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

// other way around
let l : leaf;
let a : root;
 
func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    l.la = 5;
    l.lb = 8;

    a.b = l;

    return a.b.la + a.b.lb;
}`, 13],
[`struct leaf 
{
    la : int;
    lb : int;
}
struct root 
{
    a : leaf;
    b : leaf;
}

let a : root;
 
func main() : int
{
    a.a.la = 3;
    a.a.lb = 1;

    a.b = a.a;

    return a.b.la + a.b.lb;
}`, 4],
/*
,
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
`false`]*/
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});