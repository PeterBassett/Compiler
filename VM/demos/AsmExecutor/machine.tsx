import * as React from "react";
import CPU from "../../VirtualMachine/CPU/CPU";
import RAM from "../../VirtualMachine/Memory/RAM";
import MemoryView from "./UI/MemoryView";
import RegistersView from "./UI/RegistersView";
import RegisterBank from "../../VirtualMachine/CPU/RegisterBank";

export interface MachineProps extends React.Props<Machine> {
    executing:boolean;
    ram : RAM;
    cpu : CPU;    
    registers : RegisterBank;
    instructionsExecuted:number;
}

export default class Machine extends React.Component<MachineProps, {}>
{
    public render(){        
        return <div className="grid-container">
            <MemoryView memory={ this.props.ram } instructionsExecuted={this.props.instructionsExecuted} />
            <RegistersView registers={ this.props.registers } ramSize={ this.props.ram.capacity } />
            <div>Instructions : { this.props.instructionsExecuted }</div>
        </div>;
    }
}

