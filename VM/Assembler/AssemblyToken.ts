import { AssemblyTokenKind } from "./AssemblyTokenKind";

export class AssemblyToken {
    public length: number;
    constructor(public readonly lexeme: string, public readonly position: number, public readonly token: AssemblyTokenKind, public readonly value: number = 0, public readonly line?: number, public readonly character?: number) {
        this.length = lexeme.length;
    }
}
