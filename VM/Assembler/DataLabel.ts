import { exhaustiveCheck } from "../misc/exhaustive";
import { DataLabelType } from "./DataLabelType";
export class DataLabel {
    constructor(type: DataLabelType, label: string, data: string | number, address: number) {
        this.label = label;
        this.type = type;
        this.address = address;
        this.data = null;
        this.size = 0;
        switch (type) {
            case DataLabelType.Byte:
                {
                    this.data = data;
                    this.size = 1;
                    break;
                }
            case DataLabelType.Int16:
                {
                    this.data = data;
                    this.size = 2;
                    break;
                }
            case DataLabelType.Int32:
                {
                    this.data = data;
                    this.size = 4;
                    break;
                }
            case DataLabelType.Float:
                {
                    this.data = data;
                    this.size = 8;
                    break;
                }
            case DataLabelType.String:
                {
                    this.data = data;
                    this.size = (data as string).length * 2 + 1;
                    break;
                }
            case DataLabelType.Buffer:
                {
                    this.data = null;
                    this.size = data as number;
                    break;
                }
            default: exhaustiveCheck(type);
        }
    }
    public label: string;
    public type: DataLabelType;
    public data: string | number | null;
    public size: number;
    public address: number;
}
