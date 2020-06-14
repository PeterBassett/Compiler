import { AssembledOutput } from "./AssembledOutput";

export interface IAssembler {
    assemble(input: string): AssembledOutput;
}
