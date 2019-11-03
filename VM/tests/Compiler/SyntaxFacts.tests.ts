import { SyntaxType } from "../../Language/Compiler/Syntax/SyntaxType";
import * as SyntaxFacts from "../../Language/Compiler/Syntax/SyntaxFacts";

describe("SyntaxFacts.GetText function", () => {
    const syntaxTypeKeys = Object.keys(SyntaxType).filter(k => typeof SyntaxType[k as any] === "number");
    const syntaxTypes = syntaxTypeKeys.map(k => SyntaxType[k as any] as unknown as SyntaxType).filter( ( type =>{
        let name = syntaxTypeKeys[type] || "";

        return type > 1 && 
            name.match("Trivia$") == null && 
            name.match("Literal$") == null && 
            name != "Identifier" && 
            name != "IntKeyword";
    } ));

    syntaxTypes.forEach( (syntaxType) => {
        it(`should provide the string value for a single Token of Type ${SyntaxType[syntaxType]}`, () => {            
            let source = SyntaxFacts.GetText(syntaxType);
            expect(source).not.toBeNull();
            expect(source).not.toBeUndefined();
        });
    });
});