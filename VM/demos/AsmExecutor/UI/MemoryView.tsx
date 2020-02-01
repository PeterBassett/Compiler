import * as Reach from "react";
import React = require("react");

export interface MemoryViewProps extends React.Props<MemoryView>
{
    memory : DataView;
    instructionsExecuted : number;
}

export default class MemoryView extends React.Component<MemoryViewProps, any>
{
    render() : JSX.Element
    {
        return <div className="memory">
            <table>
                { this.header() }
                { this.rows() }
            </table>
        </div> ;
    }

    header() : JSX.Element
    {
        return <tr>
            <th>Address</th>
            <th colSpan={4}>Data hexadecimal (4 bytes)</th>
            <th>Characters</th>
        </tr>
    }

    rows() : JSX.Element[]
    {
        const output = [];

        for(let address = 0; address < this.props.memory.byteLength; address += 16)
        {
            output.push(this.row(address));
        }

        return output;
    }

    toHex(value : number) : string
    {
        return "0x" + ("000000000000000" + value.toString(16)).substr(-16);
    }

    row(address : number) : JSX.Element
    {
        return <tr>
            <td>{address.toString(16)}</td>
            <td>{this.toHex(this.props.memory.getUint32(address, true))}</td>
            <td>{this.toHex(this.props.memory.getUint32(address + 4, true))}</td>
            <td>{this.toHex(this.props.memory.getUint32(address + 8, true))}</td>
            <td>{this.toHex(this.props.memory.getUint32(address + 12, true))}</td>
            <td></td>
        </tr>;
    }
} 