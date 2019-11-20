import { SyntaxType } from "../../Language/Compiler/Syntax/SyntaxType";
import * as SyntaxFacts from "../../Language/Compiler/Syntax/SyntaxFacts";
import SourceText from "../../Language/Compiler/Syntax/Text/SourceText";
import Lexer from "../../Language/Compiler/Syntax/Lexer";
import Token from "../../Language/Compiler/Syntax/Token";

describe("A Lexer object", () => {
    let target : Lexer;

    const syntaxTypeKeys = Object.keys(SyntaxType).filter(k => typeof SyntaxType[k as any] === "number");
    const syntaxTypes = syntaxTypeKeys.map(k => SyntaxType[k as any] as unknown as SyntaxType);

    const keywordTypes = syntaxTypes.filter( type => {
        let name = syntaxTypeKeys[type] || "";
        return name.match("Keyword$") != null;
    });

    let invalidCombinations : SyntaxType[][] = [
        [SyntaxType.Plus, SyntaxType.Plus],
        [SyntaxType.Plus, SyntaxType.PlusPlus],
        [SyntaxType.Minus, SyntaxType.Minus],
        [SyntaxType.Minus, SyntaxType.MinusMinus],
        [SyntaxType.Equals, SyntaxType.Equals],
        [SyntaxType.Equals, SyntaxType.EqualsEquals],
        [SyntaxType.Equals, SyntaxType.FatArrow],
        [SyntaxType.Equals, SyntaxType.GreaterThan],
        [SyntaxType.Equals, SyntaxType.GreaterThanOrEqual],
        [SyntaxType.Identifier, SyntaxType.Identifier],
        [SyntaxType.Identifier, SyntaxType.IntegerLiteral],
        [SyntaxType.Identifier, SyntaxType.FloatLiteral],
        [SyntaxType.IntegerLiteral, SyntaxType.IntegerLiteral],
        [SyntaxType.IntegerLiteral, SyntaxType.FloatLiteral],
        [SyntaxType.IntegerLiteral, SyntaxType.Identifier],
        [SyntaxType.FloatLiteral, SyntaxType.FloatLiteral],
        [SyntaxType.FloatLiteral, SyntaxType.IntegerLiteral],
        [SyntaxType.FloatLiteral, SyntaxType.Identifier],
        [SyntaxType.Pipe, SyntaxType.Pipe],
        [SyntaxType.Pipe, SyntaxType.PipePipe],
        [SyntaxType.Ampersand, SyntaxType.Ampersand],
        [SyntaxType.Ampersand, SyntaxType.AmpersandAmpersand],
        [SyntaxType.GreaterThan, SyntaxType.Equals],
        [SyntaxType.GreaterThan, SyntaxType.EqualsEquals],
        [SyntaxType.LessThan, SyntaxType.Equals],
        [SyntaxType.LessThan, SyntaxType.EqualsEquals],
        [SyntaxType.Bang, SyntaxType.Equals],
        [SyntaxType.Bang, SyntaxType.EqualsEquals],
        [SyntaxType.Slash, SyntaxType.Slash],
        [SyntaxType.Slash, SyntaxType.Star],
        [SyntaxType.GreaterThan, SyntaxType.FatArrow],
        [SyntaxType.LessThan, SyntaxType.FatArrow],
        [SyntaxType.Bang, SyntaxType.FatArrow],
        [SyntaxType.BangEquals, SyntaxType.FatArrow],        
        [SyntaxType.IntegerLiteral, SyntaxType.Dot]
    ];        

    let keywordCombinations : SyntaxType[][] = [];
    keywordCombinations = [];
    keywordTypes.forEach(t1 => {
        keywordTypes.forEach(t2 => {
            let f = [t1, t2];
            keywordCombinations.push(f);        
        });
    });

    for(let combination of keywordCombinations)
        invalidCombinations = invalidCombinations.concat(combination);

    function requiresSeparator(a : SyntaxType, b : SyntaxType) : boolean
    {
        if(SyntaxFacts.isKeyword(a) || SyntaxFacts.isKeyword(b))
            return true;

        return invalidCombinations.filter( value => a == value[0] && b == value[1] ).length > 0;
    }
    
    getAllTokens().forEach( (syntaxType) => {
        //let source = SyntaxFacts.GetText(syntaxType);
        let text = syntaxType.text;
        let type = syntaxType.kind;
        
        it(`should lex a single Token of Type ${syntaxTypeKeys[type]} for input '${text}'`, () => {            
            let source = new SourceText(text);
            let lexer = new Lexer(source);
            let token = lexer.lex();
            let eof = lexer.lex();
 
            expect(token.kind ).toEqual(type);
            expect(eof.kind ).toEqual(SyntaxType.Eof);
        });
    });

    syntaxTypes.forEach( (syntaxType) => {
        if(SyntaxFacts.isTrivia(syntaxType) ||
            SyntaxFacts.isEofOrBad(syntaxType) ||
            SyntaxFacts.isLiteral(syntaxType) ||
            syntaxType == SyntaxType.Identifier)
            return;

        it("GetText should return a value for all non trivial syntaxTypes", () => {
            let source = SyntaxFacts.GetText(syntaxType);
            expect(source).toBeTruthy();            
        });            
    });

    getTokenPairs().forEach( (pair) => {
        var text = pair.a.text + pair.b.text;

        it(`should lex a token pair (${syntaxTypeKeys[pair.a.kind ]}, ${syntaxTypeKeys[pair.b.kind ]}) for input '${text}'`, () => {            
            let source = new SourceText(text);
            let lexer = new Lexer(source);
            let token1 = lexer.lex();
            let token2 = lexer.lex();
            let eof = lexer.lex();

            expect(token1.kind ).toEqual(pair.a.kind );
            expect(token2.kind ).toEqual(pair.b.kind );
            expect(eof.kind ).toEqual(SyntaxType.Eof);
        });
    });

    function tokenise(text : string) : Token[]
    {
        let source = new SourceText(text);
        let lexer = new Lexer(source);
        let tokens : Token[] = [];
        
        while(true)
        {
            let token = lexer.lex();
            
            if(token.kind  == SyntaxType.Eof)
                break;

            tokens.push(token);
        }

        return tokens;
    }
    
    [
        [`"this is a string"`, [SyntaxType.StringLiteral] ],
        [`+-*\\`, [SyntaxType.Plus, SyntaxType.Minus, SyntaxType.Star, SyntaxType.BackSlash] ],
        [`return`, [SyntaxType.ReturnKeyword] ],
        [`true`, [SyntaxType.TrueKeyword] ],
        [`false`, [SyntaxType.FalseKeyword] ],
        [`£`, [SyntaxType.BadToken] ],
    ].forEach((item) => {
        it(`should lex a source line into ${item[1].length} tokens`, () => {  
            let text = item[0] as string;
            let expectedTokenTypes = item[1] as SyntaxType[];

            let tokens = tokenise(text);

            expect(tokens.length).toEqual(expectedTokenTypes.length)
            tokens.forEach( (v, i) => {
                expect(v.kind ).toEqual(expectedTokenTypes[i]);
            });
        });
    });

    it(`should record the correct token spans`, () => {
        let text = `func main() : int {
    return 1;
}`;

        let expected = [
            [SyntaxType.FuncKeyword, 0, 4],
            [SyntaxType.Identifier, 5, 4],
            [SyntaxType.LeftParen, 9, 1],
            [SyntaxType.RightParen, 10, 1],
            [SyntaxType.Colon, 12, 1],
            [SyntaxType.IntKeyword, 14, 3],
            [SyntaxType.LeftBrace, 18, 1],
            [SyntaxType.ReturnKeyword, 24, 6],
            [SyntaxType.IntegerLiteral, 31, 1],
            [SyntaxType.SemiColon, 32, 1],
            [SyntaxType.RightBrace, 34, 1]

        ];
        let tokens = tokenise(text);
        
        expect(expected.length).toEqual(tokens.length)

        for(let i = 0; i < expected.length; i++)
        {
            expect(expected[i][0]).toEqual(tokens[i].kind );
            expect(expected[i][1]).toEqual(tokens[i].span.start);
            expect(expected[i][2]).toEqual(tokens[i].span.length);
        }
    });

    type TextAndType = { kind : SyntaxType, text : string };

    function getAllTokens() : TextAndType[]
    {
        return getTokens().concat(getSeparators());
    }

    function getSeparators() : TextAndType[]
    {
        let a = (ty : SyntaxType, txt : string) => { return { kind : ty, text : txt}; };

        return [
           /* a(SyntaxType.WhitespaceTrivia, " "),
            a(SyntaxType.WhitespaceTrivia, "  "),
            a(SyntaxType.WhitespaceTrivia, "\r"),
            a(SyntaxType.WhitespaceTrivia, "\n"),
            a(SyntaxType.WhitespaceTrivia, "\r\n") */
        ];
    }

    function getTokens() : TextAndType[]
    {
        let pairs : TextAndType[] = [];
        syntaxTypes.forEach( (syntaxType) => {
            let source = SyntaxFacts.GetText(syntaxType);
            pairs.push({ text:source, kind:syntaxType });
        });

        pairs.push({
            text : "true",
            kind : SyntaxType.TrueKeyword
        });

        pairs.push({
            text : "false",
            kind : SyntaxType.FalseKeyword
        });

        pairs.push({
             text : "1",
             kind : SyntaxType.IntegerLiteral
        });

        pairs.push({
            text : "3.14",
            kind : SyntaxType.FloatLiteral
        });

        pairs.push({
            text : "a",
            kind : SyntaxType.Identifier
        });

        pairs.push({
            text : "abc",
            kind : SyntaxType.Identifier
        });
            
        return pairs.filter( (v) => !!v.text );
    }

    function k_combinations(set : number [], k : number) : number[][] {
        var i, j, combs, head, tailcombs;
        
        // There is no way to take e.g. sets of 5 elements from
        // a set of 4.
        if (k > set.length || k <= 0) {
            return [];
        }
        
        // K-sized set has only one K-sized subset.
        if (k == set.length) {
            return [set];
        }
        
        // There is N 1-sized subsets in a N-sized set.
        if (k == 1) {
            combs = [];
            for (i = 0; i < set.length; i++) {
                combs.push([set[i]]);
            }
            return combs;
        }
        
        // Assert {1 < k < set.length}
        
        // Algorithm description:
        // To get k-combinations of a set, we want to join each element
        // with all (k-1)-combinations of the other elements. The set of
        // these k-sized sets would be the desired result. However, as we
        // represent sets with lists, we need to take duplicates into
        // account. To avoid producing duplicates and also unnecessary
        // computing, we use the following approach: each element i
        // divides the list into three: the preceding elements, the
        // current element i, and the subsequent elements. For the first
        // element, the list of preceding elements is empty. For element i,
        // we compute the (k-1)-computations of the subsequent elements,
        // join each with the element i, and store the joined to the set of
        // computed k-combinations. We do not need to take the preceding
        // elements into account, because they have already been the i:th
        // element so they are already computed and stored. When the length
        // of the subsequent list drops below (k-1), we cannot find any
        // (k-1)-combs, hence the upper limit for the iteration:
        combs = [];
        for (i = 0; i < set.length - k + 1; i++) {
            // head is a list that includes only our current element.
            head = set.slice(i, i + 1);
            // We take smaller combinations from the subsequent elements
            tailcombs = k_combinations(set.slice(i + 1), k - 1);
            // For each (k-1)-combination we join it with the current
            // and store it to the set of k-combinations.
            for (j = 0; j < tailcombs.length; j++) {
                combs.push(head.concat(tailcombs[j]));
            }
        }
        return combs;
    }

    type TextAndTypePair = { a : TextAndType, b : TextAndType };
    function getTokenPairs() : TextAndTypePair[]
    {
        let pairs : TextAndTypePair [] = [];
        let tokens = getTokens().filter( t => !!t.text );

        try
        {
            for (const t1 of tokens) {
                for (const t2 of tokens) {
                    if(!requiresSeparator(t1.kind , t2.kind ))
                        pairs.push( { a : t1, b : t2 } );
                }
            }
        }
        catch(e)
        {
            console.error(e);
        }
        return pairs;
    }
    
    [
        [`£`, [SyntaxType.BadToken] ],
        [`$`, [SyntaxType.BadToken] ],
        [`%`, [SyntaxType.BadToken] ],
        [`@`, [SyntaxType.BadToken] ],
    ].forEach((item) => {
        it(`should produce diagnostics for invalid characters ${item[1].length}`, () => {  
            let text = item[0] as string;
            let expectedTokenTypes = item[1] as SyntaxType[];
            let source = new SourceText(text);
            let lexer = new Lexer(source);
            let tokens : Token[] = [];
            
            while(true)
            {
                let token = lexer.lex();
                
                if(token.kind  == SyntaxType.Eof)
                    break;

                tokens.push(token);
            }

            expect(tokens.length).toEqual(expectedTokenTypes.length)
            tokens.forEach( (v, i) => {
                expect(v.kind ).toEqual(expectedTokenTypes[i]);
            });

            expect(lexer.diagnostics.length).toEqual(1);
        });
    });

    it(`should capture leading trivia`, () => {
        let text = `  
// leading trivia
  
func // trailing trivia  
main() : int {
    return 1;
}`;

        let tokens = tokenise(text);

        let t = tokens[0]
        expect(SyntaxType.FuncKeyword).toEqual(t.kind );

        expect(6).toEqual(t.leadingTrivia.length);

        let leading = [
            [SyntaxType.WhitespaceTrivia, 0, 2],
            [SyntaxType.EndOfLineTrivia, 2, 1],
            [SyntaxType.SingleLineCommentTrivia, 3, 17, "// leading trivia"],
            [SyntaxType.EndOfLineTrivia, 20, 1],
            [SyntaxType.WhitespaceTrivia, 21, 2],
            [SyntaxType.EndOfLineTrivia, 23, 1]
        ];

        for(let i = 0; i < leading.length; i++)
        {
            expect(leading[i][0]).toEqual(t.leadingTrivia[i].kind );
            expect(leading[i][1]).toEqual(t.leadingTrivia[i].span.start);
            expect(leading[i][2]).toEqual(t.leadingTrivia[i].span.length);

            if(leading[i].length === 4)
                expect(leading[i][3]).toEqual(t.leadingTrivia[i].lexeme);
        }

        let trailing = [
            [SyntaxType.WhitespaceTrivia, 28, 1],
            [SyntaxType.SingleLineCommentTrivia, 29, 20, "// trailing trivia  "],
            [SyntaxType.EndOfLineTrivia, 49, 1]
        ];

        for(let i = 0; i < trailing.length; i++)
        {
            expect(trailing[i][0]).toEqual(t.trailingTrivia[i].kind );
            expect(trailing[i][1]).toEqual(t.trailingTrivia[i].span.start);
            expect(trailing[i][2]).toEqual(t.trailingTrivia[i].span.length);

            if(trailing[i].length === 4)
                expect(trailing[i][3]).toEqual(t.trailingTrivia[i].lexeme);
        }
    });
});