import AssemblyLine from "../AssemblyLine";

type Preprocessor = (lines: AssemblyLine[]) => AssemblyLine[];

export default Preprocessor;