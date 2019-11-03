import AssemblyLine from "../AssemblyLine";

export default function removeComments(lines: AssemblyLine[]): AssemblyLine[] {
    function removeComment(line: string) : string {
        if (line[0] === ';') 
            return '';

        const commentRegex = /(?!\\).;/g;

        const matches = commentRegex.exec(line);

        if (matches && matches.length > 0) {
            const commentIndex = matches.index;
            return line.substring(0, commentIndex + 1);
        }

        return line;
    }

    lines.forEach(l => l.source = removeComment(l.source));
    return lines;
}