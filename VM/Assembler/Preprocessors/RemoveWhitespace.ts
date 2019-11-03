import AssemblyLine from "../AssemblyLine";

export default function removeWhiteSpace(lines: AssemblyLine[]): AssemblyLine[] {
    lines.forEach(l => l.source = l.source.trim());
    return lines;
}