import { Logger } from "./interfaces/Logger";
import { Parser } from "./interfaces/Parser";
import Preprocessor from "./interfaces/Preprocessor";
import { Validator } from "./interfaces/Validator";
import { extractSections } from "./SectionExtraction";
import { assemble } from "./Assemble";
import { parseDataLabels } from "./Preprocessors/ParseDataLabels";
import { replaceLabels, calculateTextSectionEncodedLength } from "./Preprocessors/ReplaceLabels";
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
        const parsedLines = this.parseLines(input);
    
        const processedLines = this.preprocess(parsedLines);
        
        const {data, text} = extractSections(processedLines);
    
        const replacedLabelText = replaceLabels(this.baseMemoryOffset, text, this.encoder);

        const textSectionEncodedLength = calculateTextSectionEncodedLength(replacedLabelText, this.encoder);

        const dataLabels = parseDataLabels(textSectionEncodedLength + this.baseMemoryOffset, data);        

        const replacedDataLabelsText = replaceDataLabels(replacedLabelText, dataLabels, this.baseMemoryOffset);

        const binary = assemble(replacedDataLabelsText, dataLabels, 0, this.encoder);

        return binary;
    }
}