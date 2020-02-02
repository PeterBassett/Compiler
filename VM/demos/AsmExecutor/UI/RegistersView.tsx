import * as Reach from "react";
import React = require("react");
import RegisterBank from "../../../VirtualMachine/CPU/RegisterBank";

export interface RegistersViewProps extends React.Props<RegistersView>
{
    registers : RegisterBank;
    ramSize : number;
}

export default class RegistersView extends React.Component<RegistersViewProps, any>
{
    render() : JSX.Element
    {
        return <div className="registers">    
            { this.register("SP", 7) }
            { this.register("IP", 8) }
            { [1, 2, 3, 4, 5, 6].map(r => this.register("R" + r, r)) }
            <div>Memory Size : {this.props.ramSize}</div>
            <div>Stack Size : {this.props.ramSize - this.props.registers.SP}</div>
        </div>;
    }

    register( name : string, num : number  ) : JSX.Element
    {
        var value = this.props.registers.get(num);     
        return <div key={name}>{name} : {value}</div>;
    }
}