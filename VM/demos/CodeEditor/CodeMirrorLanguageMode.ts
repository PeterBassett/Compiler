import { Lexer } from "../../Language/Compiler/Syntax/Lexer";

export default class mode 
{
    startState() {        
        return {
            lexer: null
        };
    }
    
    token(stream, state)
    {
        if(!state.lexer)
        {
            state.lexer = new Lexer(stream);
        }

        //If a string starts here
        if (!state.inString && stream.peek() == '"'){
            stream.next();              //Skip quote
            state.inString = true;      //Update state
        }

        if (state.inString) {

            if (stream.skipTo('"')){    //Quote found on this line
                stream.next();          //Skip quote
                state.inString=false;   //Clear flag
            } else {
                stream.skipToEnd();     //Rest of line is string
            }

            return "red-text";            //Token style

        } else {

            stream.skipTo('"') || stream.skipToEnd();
            return null;                //Unstyled token

        }         
    }    
}