import AssemblyLine from "./AssemblyLine";
import { Logger } from "./interfaces/Logger";
import * as SectionExtraction from "./SectionExtraction";

export default function validateRequiredSections(lines: AssemblyLine[], logger : Logger): boolean {
    if(!logger)
        throw ReferenceError("a logger is required");

    const sections = SectionExtraction.findSections(lines);

    let validated = true;

    if(typeof(sections.text) === 'undefined')
    {
        validated = false;           
        logger(0, 0, `Required .text section not found.`);
    }

    if(typeof(sections.global) === 'undefined')
    {
        validated = false;           
        logger(0, 0, `Required .global section not found.`);
    }

    if(sections.text > sections.global)
    {
        validated = false;           
        let lineNumber = lines[sections.global].lineNumber;
        logger(0, 0, `.text must be defined before .global. .text found at line ${sections.text} .global found at line ${lineNumber}`);
    }    

    return validated;
}