import React from "react";
import { connect } from "react-redux";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import { getAll } from "../../selectors/FirebaseSelectors";
import { Redirect, Route, Switch } from "react-router-dom";
import Editor from "../pages/Editor/Editor";
import Profile from "../pages/Profile/Profile";

class Main extends React.Component {
    render() {
        const { classes, ...rest } = this.props;

        return (
            <div>
                <div>
                    <Switch>
                        <Route
                            path="/editor"
                            name="Editor"
                            component={Editor}
                        />
                        <Route
                            path="/profile"
                            name="Profile"
                            component={Profile}
                        />
                        <Redirect from="/" to="/editor" />
                    </Switch>
                </div>
            </div>
        );
    }
}

const mapStateToProps = store => {
    return { allData: getAll(store) };
};

export default connect(mapStateToProps, null)(Main);
