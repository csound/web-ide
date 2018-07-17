import React, { Component } from "react";
import {
    Typography,
    Card,
    CardActions,
    CardContent,
    Button
} from "@material-ui/core";
import { connect } from "react-redux";
import CodeEditor from "./components/CodeEditor";
import { CsoundContext } from "../../App/components/CsoundComponent";

class Editor extends Component {
    render() {
        return (
            <Card>
                <CardContent>
                    <CsoundContext.Consumer>
                        {val => <CodeEditor {...this.props} csound={val} />}
                    </CsoundContext.Consumer>
                </CardContent>
                <CardActions>
                    <Button size="small">Learn More</Button>
                </CardActions>
            </Card>
        );
    }
}

export default connect(
    store => {
        return {};
    },
    {}
)(Editor);
