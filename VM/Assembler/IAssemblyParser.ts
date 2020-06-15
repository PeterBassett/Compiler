import { AssemblyParserOutput } from "./AssemblyParser";

export interface IAssemblyParser {
    parse(): AssemblyParserOutput;
}
