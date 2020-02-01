import * as React from "react";
import CPU from "../../VirtualMachine/CPU/CPU";
import RAM from "../../VirtualMachine/Memory/RAM";
import RegisterBank from "../../VirtualMachine/CPU/RegisterBank";
import Assembler from "../../Assembler/Assembler";
import { OpCodes as Op, Registers as Reg } from "../../VirtualMachine/CPU/Instruction/InstructionSet";
import InstructionCoder from "../../VirtualMachine/CPU/Instruction/InstructionCoder";
import InstructionCoder32Bit from "../../VirtualMachine/CPU/Instruction/InstructionCoder32Bit";
import InstructionCoderVariable from "../../VirtualMachine/CPU/Instruction/InstructionCoderVariable";
import { Logger } from "../../Assembler/interfaces/Logger";
import AssemblyParser from "../../Assembler/Parser";
import defaultPreprocessor from "../../Assembler/Preprocessors/DefaultPreprocessor";
import validator from "../../Assembler/Preprocessors/DefaultPreprocessor";
import Flags from "../../VirtualMachine/CPU/Flags";
import MemoryView from "./UI/MemoryView";
import RegistersView from "./UI/RegistersView";
import Machine from "./machine";
import { assemble } from "../../Assembler/Assemble";

interface AsmExecutorState
{
    executing:boolean;
    loaded:boolean;
    assembly:string;
    instructionsExecuted : number;
}

interface AsmExecutorProps
{ 
    asmFileName?:string;
    asm?:string;
}

export default class AsmExecutor extends React.Component<AsmExecutorProps, AsmExecutorState>
{
    public assembler : Assembler;
    public ram : RAM;
    public flags : Flags;
    public registers : RegisterBank;
    public instructionCoder : InstructionCoder;
    public ramSize = 1 << 12;
    public cpu : CPU;

    constructor(props){
        super(props);
        
        this.state = {executing : false, assembly:null, loaded:false, instructionsExecuted : 0};
    }

    componentWillMount()
    {
        if(!!this.props.asmFileName)
        {
            fetch('asm/' + this.props.asmFileName)
                .then(response => response.text())
                .then(data => this.setState({ assembly:data }, () => this.setup()))
                .then(d => this.executeStep());        
        }
        else if(!!this.props.asm)
        {
            this.setState({ assembly:this.props.asm }, () => {
                this.setup();
                this.executeStep();
            });
        }
    }

    frame()
    {
        var executed = this.step();

        this.setState( { instructionsExecuted : this.state.instructionsExecuted + 1 });

        return executed;
    }  

    executeStep()
    {  
        var executed = this.frame();
        
        if(!executed)
            return;
    
        var mode = 2;      
        switch(mode)
        {
            case 1:
                setTimeout(this.executeStep, 0);
                break;
            case 2:
                requestAnimationFrame(jQuery.proxy(this.executeStep, this));
                break;
            case 3:
                while(this.frame());
        }
    }
  
    setup() : void
    {     
        let assemblyCode : string = this.state.assembly;   
        const logger : Logger = (lineNumber : number, characterNumber : number, message : string) => {}        
        
        this.ram = new RAM(this.ramSize);
        this.registers = new RegisterBank(this.ramSize);
        this.flags = new Flags();
        this.instructionCoder = new InstructionCoderVariable();
        this.assembler = new Assembler(logger, AssemblyParser, defaultPreprocessor, this.instructionCoder, 0);

        const instructions = this.assembler.assemble(assemblyCode)

        this.ram.blitStoreBytes(0, instructions.machineCode);
        this.ram.setReadonlyRegions(instructions.regions);

        this.cpu = new CPU(this.ram, this.registers, this.flags, this.instructionCoder);

        this.setState({loaded:true});
    }

    step() : boolean
    {
        try
        {
            this.cpu.step();
            return true;
        }
        catch(e)
        {
            return false;
        }
    }

    public render(){
        if(!this.state.loaded)
            return <div>loading</div>;

        return <Machine executing={ this.state.executing } instructionsExecuted={this.state.instructionsExecuted} cpu={ this.cpu } ram={ this.ram } registers={ this.registers } />;          
    }
}

