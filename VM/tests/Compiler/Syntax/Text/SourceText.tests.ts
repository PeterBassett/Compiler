import SourceText from "../../../../Language/Compiler/Syntax/Text/SourceText";
import TextSpan from "../../../../Language/Compiler/Syntax/Text/TextSpan";

describe("A SourceText object", () => {

let source = `func fib(n:int):int {
    if (n == 0 || n == 1) {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}

func main() : int {
    let n : int = 5;
    return fib(n);
}`;

    describe("The textSpanToRowColRange function", () => {

        function test(source:string, span:TextSpan, start_row:number, start_col:number, end_row:number, end_col:number)
        {
            let target = new SourceText(source);
            let actual = target.textSpanToRowColRange(span);

            expect(start_row).toEqual(actual.start.row);
            expect(start_col).toEqual(actual.start.column);
            expect(end_row).toEqual(actual.end.row);  
            expect(end_col).toEqual(actual.end.column);
        }

        it(`converts spans into row col coordinates`, () => {              
            test("#", new TextSpan(0, 1), 0, 0, 0, 1);      
        });

        it(`converts spans into row col coordinates`, () => {              
            test("########", new TextSpan(3, 2), 0, 3, 0, 5);      
        });

        it(`converts spans into row col coordinates`, () => {              
            test(source, new TextSpan(58, 6), 2, 8, 2, 14);      
        });
    });      
});