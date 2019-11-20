import AssemblyLine from "../AssemblyLine";
import * as SectionExtraction from "../SectionExtraction";
import { exhaustiveCheck } from "../../misc/exhaustive"

export enum DataLabelType   
{
    Buffer,
    String,
    Byte,
    Int16,
    Int32,
    Float
}

export class DataLabel {
    constructor(type : DataLabelType, label : string, data : string | number, address : number)
    {
        this.label = label;
        this.type = type;
        this.address = address;
        this.data = null;
        this.size = 0;
        switch(type)
        {
            case DataLabelType.Byte : 
            {
                this.data = data;
                this.size = 1;
                break;
            }
            case DataLabelType.Int16 : 
            {
                this.data = data;
                this.size = 2;
                break;
            }
            case DataLabelType.Int32 : 
            {
                this.data = data;
                this.size = 4;
                break;
            }
            case DataLabelType.Float : 
            {
                this.data = data;
                this.size = 8;
                break;
            }            
            case DataLabelType.String : 
            {
                this.data = data;
                this.size = (data as string).length * 2 + 1;
                break;
            }
            case DataLabelType.Buffer : 
            {
                this.data = null;
                this.size = data as number;
                break;
            }
            default: exhaustiveCheck(type);
        }
    }

    public label : string;    
    public type : DataLabelType;
    public data : string | number | null;
    public size : number;
    public address : number;
}

export function parseDataLabels(memoryOffset : number, data: AssemblyLine[]): DataLabel[] {
    const labels : DataLabel[] = [];
    
    data.forEach(line => {
        const output = parseDataLabel(memoryOffset, line);
        memoryOffset += output.size;

        labels.push( output );
    });

    return labels;
}

function parseDatalabelintoSections(line : string) : string[]
{
    let start = 0;
    let i = 0;
    let parts : string[] = [];

    function consumeWhiteSpace(): void {
        while(i < line.length && isWhiteSpace())
            i++;        
    }

    function isWhiteSpace(): boolean {
        let char = line[i];
        return char == ' ' ||
               char == '\t';
    }

    function isDigit():boolean
    {
        let char = line[i];
        return char >= '0' && char <= '9';
    }
    
    function isAlpha(): boolean {
        let char = line[i];
        return (char >= 'a' && char <= 'z') ||
               (char >= 'A' && char <= 'Z');
    } 

    function next() : string
    {
        if(line[i] === "'")
        {
            i++;
            while(i < line.length && line[i] !== "'")
                i++;
            if(line[i] === "'")
                i++;                
        }
        else if(line[i] === "\"")
        {
            i++;
            while(i < line.length && line[i] !== "\"")
                i++;                
            if(line[i] === "\"")
                i++;
        }
        else
        {
            while(i < line.length && !isWhiteSpace())
                i++;                
        }

        return line.substring(start, i);
    }

    while(i < line.length)
    {
        consumeWhiteSpace();
        start = i;
        let value = next();

        if(value)
            parts.push(value);
    }

    return parts;
}

export function parseDataLabel(memoryAddress : number, line: AssemblyLine): DataLabel {
    const parts = parseDatalabelintoSections(line.source);
    //const parts = line.source.split(' ');
    
    const label = parts[0];

    const part1 = parts[1].toLowerCase();

    // is this a buffer
    if(part1 === "size")
    {
        return new DataLabel(DataLabelType.Buffer, label, parseInt(parts[2]), memoryAddress);
    } // is this a string
    else if(part1 && part1.length && (part1[0] === "'" || part1[0] === "\""))
    {
        let data = stripTextQualifiers(part1);
        return new DataLabel(DataLabelType.String, label, data, memoryAddress);
    }
    else // we must be dealing with a number of some sort 
    {
        const { data, type } = parseDataDeclaration(parts[1], parts[2].trim());

        return new DataLabel(type, label, data, memoryAddress);
    }
}

function parseDataDeclaration(typeDeclaration :string, data: string): { data : number | string, type : DataLabelType } {
    const asNumber = Number(data);

    let type : DataLabelType;
    if(isNaN(asNumber))
        throw RangeError(`Invalid number ${asNumber}`);
    
    let isInt = (n : any) => {
        return Number(n) === n && n % 1 === 0;
    };

    switch(typeDeclaration.toLowerCase())
    {
        case "byte": 
            type = DataLabelType.Byte;
            break;
        case "word": 
            type = DataLabelType.Int16;
            break;
        case "long": 
            type = DataLabelType.Int32;
            break;
        case "float": 
            type = DataLabelType.Float;
            break;
        default :
            throw RangeError("Unknown type");                                    
    }
    
    return {
        data : asNumber,
        type : type
    };
}

function stripTextQualifiers(data: string): string
{
    return data.slice(1, data.length - 1);
}