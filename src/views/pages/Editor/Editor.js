import React from "react";
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import CodeEditorComponent from "../../components/CodeEditorComponent";

import { loadCsoundObj } from "../../../actions/AppActions";
import CsoundObj from 'CsoundObj';


class Editor extends React.Component {

    constructor(props) {
        super(props);

        props.loadCsoundObj();
    }

    render() {
        console.log(this.props.csoundLoadingState);
        return (
            <div>
                <Row>
                    <Col>
                        <Card>
                            <CardHeader>Editor</CardHeader>
                            <CardBody>
                                <CodeEditorComponent />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

const mapStateToProps = store => {
    return { csoundLoadingState: store.APP.loadCsound };
};

export default connect(mapStateToProps, { loadCsoundObj })(Editor);
