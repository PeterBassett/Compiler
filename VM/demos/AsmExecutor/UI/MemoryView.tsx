import * as Reach from "react";
import React = require("react");
import RAM from "../../../VirtualMachine/Memory/RAM";

export interface MemoryViewProps extends React.Props<MemoryView>
{
    memory : RAM;
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
            <th colSpan={16}>Characters</th>
        </tr>
    }

    rows() : JSX.Element[]
    {
        const output = [];

        for(let address = 0; address < this.props.memory.capacity; address += 16)
        {
            output.push(this.row(address));
        }

        return output;
    }

    toHex(value : number) : string
    {
        return "0x" + ("0000000" + value.toString(16)).substr(-8);
    }

    toCharacters(array : Uint8Array) : JSX.Element[]
    {
        const output = [];
        
        for(let i = 0; i < array.length; i++)
        {
            output.push(<td title={array[i].toString()}>
                {
                    (array[i] === 0) ?
                    "." :
                    String.fromCharCode(array[i])
                }
            </td>);
        }

        return output;
    }

    row(address : number) : JSX.Element
    {
        return <tr>
            <td>{address.toString(16)}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address))}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address + 4))}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address + 8))}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address + 12))}</td>
            
            {this.toCharacters(this.props.memory.blitReadBytes(address, 16))}
            
        </tr>;
    }
} 