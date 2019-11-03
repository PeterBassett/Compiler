import Preprocessor from "../interfaces/Preprocessor";
import AssemblyLine from "../AssemblyLine";

export default function createAggregatePreprocessor(...preprocessors : Preprocessor[])
{
    return (lines : AssemblyLine[]) =>
    {
        for (let index = 0; index < preprocessors.length; index++) {
            let processor = preprocessors[index];

            lines = processor(lines);
        }   

        return lines;
    };
}