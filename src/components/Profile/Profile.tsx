import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import { Link } from "react-router-dom";
import Header from "../Header/Header";
import { getUserProjects, addUserProject, deleteUserProject } from "./actions";
import { selectUserProjects } from "./selectors";
import { Button } from "@material-ui/core";

const Profile = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const projects = useSelector(selectUserProjects);

    useEffect(() => {
        dispatch(getUserProjects());
    }, [dispatch]);
    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <main>
                <h1>Profile</h1>
                <p>
                    <Button
                        onClick={() => {
                            dispatch(addUserProject());
                        }}
                    >
                        + Create New Project
                    </Button>
                </p>
                <h2>User Projects</h2>
                <ul>
                    {Array.isArray(projects) &&
                        projects.map((doc, i) => (
                            <li key={i}>
                                <Link to={"/editor/" + doc.projectUid}>
                                    {doc.name}
                                </Link>{" "}
                                -{" "}
                                <Button
                                    onClick={e => {
                                        dispatch(deleteUserProject(doc));
                                    }}
                                >
                                    Delete
                                </Button>
                            </li>
                        ))}
                </ul>
            </main>
        </div>
    );
};

export default withStyles(Profile);
