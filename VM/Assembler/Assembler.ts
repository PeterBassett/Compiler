import { Logger } from "./interfaces/Logger";
import { Parser } from "./interfaces/Parser";
import Preprocessor from "./interfaces/Preprocessor";
import { Validator } from "./interfaces/Validator";
import { extractSections } from "./SectionExtraction";
import { assemble } from "./Assemble";
import { parseDataLabels } from "./Preprocessors/ParseDataLabels";
import { replaceLabels } from "./Preprocessors/ReplaceLabels";
import { replaceDataLabels } from "./Preprocessors/ReplaceDataLabels";
import InstructionCoder from "../VirtualMachine/CPU/Instruction/InstructionCoder";

export default class Assembler
{
    private readonly logger : Logger;
    private readonly parseLines : Parser;
    private readonly preprocess : Preprocessor;    
    private readonly encoder : InstructionCoder;
    private readonly baseMemoryOffset : number;
    
    constructor(logger : Logger, 
        parser: Parser, 
        preprocessor : Preprocessor,
        encoder : InstructionCoder,
        baseMemoryOffset : number)
    {
        if(!logger)
            throw new ReferenceError("logger is null");
        this.logger = logger;

        if(!parser)
            throw new ReferenceError("parser is null");
        this.parseLines = parser;

        if(!preprocessor)
            throw new ReferenceError("preprocessor is null");
        this.preprocess = preprocessor;

        if(!encoder)
            throw new ReferenceError("preprocessor is null");
        this.encoder = encoder;        

        this.baseMemoryOffset = baseMemoryOffset;
    }

    assemble(input: string): ArrayBuffer
    {
        let lines = this.parseLines(input);
    
        lines = this.preprocess(lines);
        
        let {data, text} = extractSections(lines);
    
        text = replaceLabels(this.baseMemoryOffset, text, this.encoder);
        let dataLabels = parseDataLabels(text.length * Uint32Array.BYTES_PER_ELEMENT + this.baseMemoryOffset, data);        

        text = replaceDataLabels(text, dataLabels, this.baseMemoryOffset);

        const binary = assemble(text, dataLabels, 0, this.encoder);

        return binary;
    }
}