import { AssemblyToken } from "./AssemblyToken";

export interface IAssemblyLexer
{
    current : AssemblyToken;
    advance() : boolean;
}