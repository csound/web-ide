import React from "react";
import CsoundObj from "CsoundObj";
export const CsoundContext = React.createContext();

let csound = {};

export default class CsoundComponent extends React.Component {
    constructor(props) {
        super(props);

        // instantiate Csound;
        this.state = { csound: null };
        CsoundObj.importScripts("https://waaw.csound.com/js/").then(() => {
            this.setState({ csound: new CsoundObj() });
        });
    }
    render() {
        console.log(this.state.csound);

        return (
            <CsoundContext.Provider value={this.state.csound}>
                {this.props.children}
            </CsoundContext.Provider>
        );
    }
}

// export const csoundComponentWrapper = WrappedComponent => {
//     return class extends React.Component {
//         printStuff = () => {
//             console.log("stuff");
//         };

//         render() {
//             return (
//                 <CsoundContext.Consumer>
//                     {val => (
//                         <WrappedComponent
//                             {...this.props}
//                             csound={val}
//                             printStuff={this.printStuff}
//                         />
//                     )}
//                 </CsoundContext.Consumer>
//             );
//         }
//     };
// };
