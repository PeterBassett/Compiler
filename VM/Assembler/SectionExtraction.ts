import AssemblyLine from "./AssemblyLine";

export class SectionLocations
{
    constructor(public data:number, 
                public text:number,
                public global:number){

                }
}

export function findSections(lines : AssemblyLine[]) : SectionLocations
{
    let positions = findLines(lines, [".data", ".text", ".global"]);

    return new SectionLocations(positions[".data"],
                                positions[".text"],
                                positions[".global"]);
}

function findLines(lines : AssemblyLine[], sections:string[]) : {[section:string] : number} 
{
    let sectionPositions : {[section:string] : number} = {};

    sections.forEach( (section) => 
    {
        lines.forEach( (line, index) =>{
            if(line.source.substring(0, section.length) === section)
            {
                sectionPositions[section] = index;
            }
        });
    });

    return sectionPositions;
}

export class ExtractedSections
{
    constructor(public data:AssemblyLine[], 
                public text:AssemblyLine[]){
    }
}

export function extractSections(lines:AssemblyLine[]) : ExtractedSections
{
    const sections = findSections(lines);

    return new ExtractedSections(
        lines.slice(1, sections.text),
        lines.slice(sections.text + 1, lines.length)
    );
}