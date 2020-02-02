import * as Reach from "react";
import React = require("react");
import RAM from "../../../VirtualMachine/Memory/RAM";
import RegisterBank from "../../../VirtualMachine/CPU/RegisterBank";
import Instruction from "../../../VirtualMachine/CPU/Instruction/Instruction";

export interface MemoryViewProps extends React.Props<MemoryView>
{
    memory : RAM;
    registers : RegisterBank;
    instructionsExecuted : number;
    insructionsLength : number;
    instruction?:Instruction;
}

export default class MemoryView extends React.Component<MemoryViewProps, any>
{
    render() : JSX.Element
    {
        return <div className="memory">
            <table>
                <tbody>
                    { this.header() }
                    { this.rows() }
                </tbody>
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

    toHex(value : number, length : number) : string
    {
        return "0x" + (Array(length).join("0") + value.toString(16)).substr(-length);
    }

    toCharacters(array : Uint8Array, baseAddress : number) : JSX.Element[]
    {
        const output = [];

        for(let i = 0; i < array.length; i++)
        {
            const address = baseAddress + i;
            let colour = "memory";

            if(address < this.props.insructionsLength)
                colour = "instructions";
            else if(address >= this.props.registers.SP)
                colour = "stack";

            if(address === this.props.registers.IP ||
                (this.props.instruction &&
                 address >= this.props.registers.IP - this.props.instruction.encodedLength &&
                 address < this.props.registers.IP))
                colour = "IP";                
    
            output.push(<td className={"colour_" + colour} title={address + ":" + array[i].toString()}>
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
            <td>{this.toHex(address, 8)}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address), 8)}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address + 4), 8)}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address + 8), 8)}</td>
            <td>{this.toHex(this.props.memory.readUDWord(address + 12), 8)}</td>
            
            {this.toCharacters(this.props.memory.blitReadBytes(address, 16), address)}
            
        </tr>;
    }
} 