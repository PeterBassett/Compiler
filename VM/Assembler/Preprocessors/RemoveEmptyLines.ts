import AssemblyLine from "../AssemblyLine";

export default function removeEmptyLines(lines: AssemblyLine[]): AssemblyLine[] {
    const allWhiteSpace = new RegExp("^[ \t]*$");
    return lines.filter( l => {
        return !!l.source && 
        !allWhiteSpace.test(l.source); 
    });
}
