import * as Reach from "react";
import React = require("react");

export interface MemoryViewProps extends React.Props<MemoryView>
{
    memory : DataView;
}

export default class MemoryView extends React.Component<MemoryViewProps, any>
{
    render() : JSX.Element
    {
        return <div>

        </div>;
    }
} 