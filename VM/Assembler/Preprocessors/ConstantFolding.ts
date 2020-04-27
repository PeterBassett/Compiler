import AssemblyLine from "../AssemblyLine";
import { DataLabel } from "./ParseDataLabels";
import { AssemblyLineLexer, OperandToken, Token } from "../AssemblyLineLexer";

export function performConstantFolding(text: AssemblyLine[]): AssemblyLine[] 
{     
    text.forEach((line) => {
        
        line.source = foldConstants(line.source);            
    })
        
    return text;
}

function foldConstants(text: string): string
{
    let foldedConstant :boolean;
    do
    {
        foldedConstant = false;

        const lexer = new AssemblyLineLexer(text);
        const tokens : Token[] = [];
        
        while(lexer.advance())
            tokens.push(lexer.current);
        
        let index = 0;

        while(index < tokens.length)
        {
            if(tokens[index].token === OperandToken.NUMBER && index + 2 < tokens.length)
            {
                if(tokens[index+1].token === OperandToken.PLUS && tokens[index+2].token === OperandToken.NUMBER)
                {
                    const start = tokens[index].position;
                    const end = tokens[index+2].position + tokens[index+2].length;

                    const prefix = text.substring(0, start);

                    const sum = tokens[index].value + tokens[index+2].value

                    const suffix = text.substring(end);

                    text = prefix + sum + suffix;
                    foldedConstant = true;
                    break;
                }
            }

            index++;
        }    
    } while(foldedConstant);

    return text;
}