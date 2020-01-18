import AssemblyLine from "./AssemblyLine";

export default function parseLines(assembly: string): AssemblyLine[] {
    return assembly.split("\n").map((line, index) => 
    {
        return {                
            originalSource : line,
            source : line,
            lineNumber : index + 1
        };
    });
}