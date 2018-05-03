import React from "react";
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";

class Login extends React.Component {
    render() {
        return (
            <div>
                <Row>
                    <Col>
                        <Card>
                            <CardHeader>Login Page</CardHeader>
                            <CardBody />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

const mapStateToProps = store => {
    return {};
};

export default connect(mapStateToProps, null)(Login);
