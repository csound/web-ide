import React from "react";
import { ICsoundObj } from "../Csound/interfaces";
import { connect } from "react-redux";
import { IStore } from "../../db/interfaces";
// import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
// import List from "react-virtualized/dist/commonjs/List";

interface IConsoleProps {
    csound: ICsoundObj;
}

interface IConsoleLocalState {
    logBuffer: string;
    logs: string[];
}

class Console extends React.Component<IConsoleProps, IConsoleLocalState> {

    constructor(props: IConsoleProps) {
        super(props);
        this.messageCallback = this.messageCallback.bind(this);
    }

    public messageCallback(msg: string) {
        console.log("MSG", msg);

    }

    public componentDidMount() {
        const {csound} = this.props;
        // csound.setMessageCallback(this.messageCallback);
    }

    public render() {
        return(
            <pre style={{whiteSpace: "pre-wrap", color: "white", height: "900px", paddingLeft: "12px"}}>
                writing 1024-byte blks of shorts to dac < br/>
                SECTION 1: < br/>
                ftable 1: < br/>
                new alloc for instr 1: < br/>
                B  0.000 ..  2.000 T  2.000 TT  2.000 M:  10000.0  10000.0 < br/>
                Score finished in csoundPerform(). < br/>
                inactive allocs returned to freespace < br/>
                end of score.              overall amps:  10000.0  10000.0 < br/>
                overall samples out of range:        0        0 < br/>
                0 errors in performance < br/>
                Elapsed time at end of performance: real: 2.341s, CPU: 0.050s < br/>
                345 1024-byte soundblks of shorts written to dac
            </pre>
        )
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        csound: ownProp.csound,
    }
}

export default connect(mapStateToProps, {})(Console);
