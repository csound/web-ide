import React from "react";
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import { getAll } from "../../selectors/FirebaseSelectors";

class Main extends React.Component {
    render() {
        return (
            <div>
                <Row>
                    <Col>
                        <Card>
                            <CardHeader>Main</CardHeader>
                            <CardBody>
                                {JSON.stringify(this.props.allData)}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

const mapStateToProps = store => {
    return { allData: getAll(store) };
};

export default connect(mapStateToProps, null)(Main);
