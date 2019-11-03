import AssemblyLine from "../AssemblyLine";

export type Validator = (lines: AssemblyLine[]) => boolean;