import TextSpan from "../Text/TextSpan";
export function spanCalculator(this: any): TextSpan {
    if (!this)
        console.log("");
    let node: any = this;
    let start: number = 999999999;
    let end: number = 0;
    for (const key in node) {
        if (node.hasOwnProperty(key)) {
            const element = (node as any)[key];
            if (!element)
                continue;
            // it is a object with a span property? This will be a Token object?
            if (typeof element == "object" && typeof element.span == "object") {
                start = Math.min(start, element.span.start);
                end = Math.max(end, element.span.end);
            } // it is an array? recurse down.
            else if (typeof element == "object" && typeof element.length == "number") {
                for (let i = 0; i < element.length; i++) {
                    let span = spanCalculator.call(element[i]);
                    start = Math.min(start, span.start);
                    end = Math.max(end, span.end);
                }
            } // it is an object with a span function? It'll be a SyntaxNode
            else if (typeof element == "object" && typeof element.span == "function") {
                let span = element.span();
                start = Math.min(start, span.start);
                end = Math.max(end, span.end);
            }
        }
    }
    return new TextSpan(start, end - start);
}
