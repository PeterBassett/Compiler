import Token from "./Token";

export interface ILexer {
    lex() : Token;
}