import * as React from "react";
import CPU from "../../VirtualMachine/CPU/CPU";
import RAM from "../../VirtualMachine/Memory/RAM";
import MemoryView from "./UI/MemoryView";
import RegistersView from "./UI/RegistersView";
import RegisterBank from "../../VirtualMachine/CPU/RegisterBank";
import Instruction from "../../VirtualMachine/CPU/Instruction/Instruction";

export interface MachineProps extends React.Props<Machine> {
    executing:boolean;
    ram : RAM;
    cpu : CPU;    
    registers : RegisterBank;
    instructionsExecuted:number;
    instructionsLength:number;
    instruction?:Instruction;
}

export default class Machine extends React.Component<MachineProps, {}>
{
    public render(){        
        return <div className="grid-container">
            <div className="header"></div>
            <MemoryView memory={ this.props.ram } 
                registers={ this.props.registers } 
                instructionsExecuted={this.props.instructionsExecuted} 
                insructionsLength={this.props.instructionsLength}
                instruction={this.props.instruction} />
            <RegistersView registers={ this.props.registers } ramSize={ this.props.ram.capacity } />
            <div className="footer">Instructions : { this.props.instructionsExecuted }</div>
        </div>;
    }
}

