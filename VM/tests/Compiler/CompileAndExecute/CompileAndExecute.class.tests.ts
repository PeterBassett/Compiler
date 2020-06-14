import run, { printPerformance, resetPerformance } from "./CompileAndExecute.base";

describe("Complie Assemble and Execute classes", () => {
    beforeAll(() =>
    {
        resetPerformance();
    });
    
    afterAll(() => {
        printPerformance("class");
    });
    
    [
/*[`
class test
{
    let a : int = 50;
}

func main() : int
{
    let c : test;
    
    return c.a;
}`, 50]*/
    ].forEach((item) => {
        it(`should compile, assemble and execute to return the right value ` + item[0], () => {  
            const text = item[0] as string;
            const expected = item[1] as number;

            const result =  run(text);
            
            expect(result).toEqual(expected);
        });
    });
});