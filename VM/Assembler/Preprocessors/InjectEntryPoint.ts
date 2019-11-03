import AssemblyLine from "../AssemblyLine";
import * as SectionExtraction from "../SectionExtraction";

export default function injectEntryPoint(lines: AssemblyLine[]): AssemblyLine[] {

    if(lines == null)
        throw RangeError();
        
    const sections = SectionExtraction.findSections(lines);
    const index = sections.global;

    const entryPointLabel = lines[index].source.split(" ")[1].trim();

    lines.splice(index, 1, {
        originalSource : lines[index].originalSource,
        lineNumber : lines[index].lineNumber,
        source : "MVI R0 " + entryPointLabel
    });

    lines.splice(index + 1, 0, {
        originalSource : lines[index].originalSource,
        lineNumber : lines[index].lineNumber,
        source : "JMR R0"        
    });

    return lines;
}