import AssemblyLine from "../AssemblyLine";
import * as SectionExtraction from "../SectionExtraction";

export function buildLabelMap(lines: AssemblyLine[]): {lines : AssemblyLine [], labels : { [label:string] : number } } {
    const labels : { [index:string] : number } = {};
    
    let labelOffset = 0;

    lines = lines.filter( (line : AssemblyLine, index : number) => {
        const firstPart = line.source.split(' ')[0];
        
        if (firstPart[firstPart.length - 1] === ':') {        
            labels[line.source.toLowerCase()] = index - labelOffset++;        
            return false;        
        }
        
        return true
    });

    return { lines, labels };
}

export function replaceLabels(memoryOffset : number, lines: AssemblyLine[]): AssemblyLine[] {
    
    const map = buildLabelMap(lines);
    const labels = Object.keys(map.labels);
    lines = map.lines;

    labels.sort((a, b) => b.length - a.length).forEach((label) => {
        lines.forEach((line, index) => {
            //line.source = line.source.replace(label, (memoryOffset + (map.labels[label] * 4)).toString());
            let regEx = new RegExp(label, "ig");
            let target = memoryOffset + (map.labels[label] * 4);
            line.source = line.source.replace(regEx, target.toString());            
        });
    });

    return lines;
}