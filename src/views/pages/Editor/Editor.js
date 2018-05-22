import React from "react";
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import CodeEditor from "./interfaces/CodeEditor";
import { CsoundContext } from "../../../components/CsoundComponent";

class Editor extends React.Component {
    render() {
        return (
            <div>
                <Row>
                    <Col>
                        <Card>
                            <CardHeader>Editor</CardHeader>
                            <CardBody>
                                <CsoundContext.Consumer>
                                    {val => (
                                        <CodeEditor
                                            {...this.props}
                                            csound={val}
                                        />
                                    )}
                                </CsoundContext.Consumer>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Editor;
