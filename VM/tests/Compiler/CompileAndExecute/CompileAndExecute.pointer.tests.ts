import run, { printPerformance, resetPerformance } from "./CompileAndExecute.base";

describe("Complie Assemble and Execute pointer", () => {
    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("pointers");
    });
    
[
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap != null)
        return 1;
    else
        return 0;
}`, 0],
[
`func main() : int
{
    let ap : *int = null;
    
    if(ap == null)
        return 1;
    else
        return 0;
}`, 1],
[`
func main() : int
{
    let a : int = 5;
    let ap : *int = null;
    
    ap = &a;
    *ap = 6;

    return a;
}`, 6],
[`
func update(b : *int) : int
{
    *b = 50;
    return 1;
}
func main() : int
{
    let a : int = 5;

    update(&a);

    return a;
}`, 50],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let root : item;

    root.value = 10;

    let a : *item;
    
    a = &root;
    (*a).value = 51;

    return root.value;
}`, 51],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let root : item;
    let a : *item;
    
    a = &root;
    a.value = 51;

    return root.value;
}`, 51],
[`
func main() : int
{
    let i : int = 0;
    let pi : *int;

    pi = &i;

    if(pi != null) 
    {
        return 1;
    }

    return 0;
}`, 1],
[`
func main() : int
{
    let i : int = 0;
    let pi : *int = null;

    if(pi != null) 
    {
        return 1;
    }

    return 0;
}`, 0],
[`
func main() : int
{
    let i : int = 0;
    let pi : *int = null;

    if(pi == null) 
    {
        return 1;
    }

    return 0;
}`, 1],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let i : item;
    i.value = 101;

    let pi : *item = null;

    if(pi == null) 
    {
        return 1;
    }

    return 0;
}`, 1],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let i : item;
    i.value = 102;

    let pi : *item = null;

    pi = &i;

    if(pi == null) 
    {
        return 1;
    }

    return 0;
}`, 0],
[`
struct item 
{
    value : int;
}

func main() : int
{
    let i : item;
    i.value = 103;

    let pi : *item = null;

    pi = &i;

    if(pi != null) 
    {
        return (*pi).value;
    }

    return 0;
}`, 103],
[`
struct item 
{
    value : int;
}

func main() : int
{
    let i : item;
    i.value = 104;

    let pi : *item = null;

    pi = &i;

    return (*pi).value;
}`, 104],
[`
struct item 
{
    value : int;    
    next : *item;
}

func main() : int
{
    let i : item;
    i.value = 105;

    let pi : *item = null;

    pi = &i;

    if(pi != null) 
    {
        return pi.value;
    }

    return 0;
}`, 105],
[`
struct item 
{
    value : int;    
    next : *item;
}

func length(a : *item) : int
{
    let i : int = 0;

    while (a != null) 
    {
        i = i + 1;
        a = a.next;
    }

    return i;
}

func main() : int
{
    let root : item;
    let mid : item;
    let end : item;

    root.value = 1;
    mid.value = 2;
    end.value = 3;

    root.next = &mid;
    mid.next = &end;
    end.next = null;

    let len = length(&root);

    return len;
}`, 3],
[`
struct Node
{
    value : int;    
    next : *Node;
}

//Floyd’s Cycle-Finding Algorithm
func detectloop(list : *Node) : bool 
{ 
    let slow : *Node = list;
    let fast : *Node = list; 
  
    while (slow != null && 
           fast != null && 
           fast.next != null)
    { 
        slow = slow.next; 
        fast = fast.next.next; 

        if (slow == fast) 
        { 
            // Found Loop 
            return true; 
        } 
    } 

    // no loop found
    return false; 
} 

func main() : bool
{
    let a : Node;
    let b : Node;
    let c : Node;
    let d : Node;
    let e : Node;

    a.next = &b;
    b.next = &c;
    c.next = &d;
    d.next = &e;
    e.next = &b; // loop introduced here

    let loop = detectloop(&a);

    return loop;
}`, 1],
[`
struct Node
{
    value : int;    
    next : *Node;
}

//Floyd’s Cycle-Finding Algorithm
func detectloop(list : *Node) : bool 
{ 
    let slow : *Node = list;
    let fast : *Node = list; 
  
    while (slow != null && 
           fast != null && 
           fast.next != null)
    { 
        slow = slow.next; 
        fast = fast.next.next; 

        if (slow == fast) 
        { 
            // Found Loop 
            return true; 
        } 
    } 

    // no loop found
    return false; 
} 

func main() : bool
{
    let a : Node;
    let b : Node;
    let c : Node;
    let d : Node;
    let e : Node;

    a.next = &b;
    b.next = &c;
    c.next = &d;
    d.next = &e;
    e.next = null; // no loop introduced here

    let loop = detectloop(&a);

    return loop;
}`, 0],
[`
struct Node
{
    value : int;    
    next : *Node;
}

//Floyd’s Cycle-Finding Algorithm
func detectloop(list : *Node) : bool 
{ 
    let slow : *Node = list;
    let fast : *Node = list; 
  
    while (slow != null && 
           fast != null && 
           fast.next != null)
    { 
        slow = slow.next; 
        fast = fast.next.next; 

        if (slow == fast) 
        { 
            // Found Loop 
            return true; 
        } 
    } 

    // no loop found
    return false; 
} 

func main() : bool
{
    let a : Node;
    let b : Node;
    let c : Node;
    let d : Node;
    let e : Node;
    let f : Node;
    let g : Node;
    let h : Node;
    let i : Node;
    let j : Node;
    let k : Node;
    let l : Node;
    let m : Node;
    let n : Node;
    let o : Node;

    a.next = &b;
    b.next = &c;
    c.next = &d;
    d.next = &e;
    e.next = &f;
    f.next = &g;
    g.next = &h;
    h.next = &i;
    i.next = &j;
    j.next = &k;
    k.next = &l;
    l.next = &m;
    m.next = &n;
    n.next = &o;
    o.next = &a; // back to the start

    let loop = detectloop(&a);

    return loop;
}`, 1]
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result = run(text);
            
            expect(result).toEqual(expected);
        });
    });
});