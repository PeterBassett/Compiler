import AssemblyLine from "../AssemblyLine";
import { DataLabel } from "./ParseDataLabels";

export function dataSectionSizeInBytes(data : DataLabel[]) : number {
    return data.reduce((acc, cur) => acc + cur.size, 0);
}

export function replaceDataLabels(text: AssemblyLine[], dataLabels : DataLabel[], memoryOffset : number): AssemblyLine[] {   
    
    
    dataLabels.forEach((label) => {
        text.forEach(line => {            
            line.source = line.source.replace(label.label, 
                                              (label.address + memoryOffset).toString());        
        });
    })
        
    return text;
}