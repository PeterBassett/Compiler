import createAggregatePreprocessor from "./AggregatePreprocessor";
import removeWhiteSpace from "./RemoveWhitespace";
import removeEmptyLines from "./RemoveEmptyLines";
import removeComments from "./RemoveComments";
import injectEntryPoint from "./InjectEntryPoint";

let defaultPreprocessor = createAggregatePreprocessor(removeWhiteSpace, removeComments, removeEmptyLines, injectEntryPoint);

export default defaultPreprocessor;