import Region from "./Region";

export class AssembledOutput {
    constructor(public readonly machineCode: ArrayBuffer, public readonly regions: Region[]) {
    }
}
