import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import { Link } from "react-router-dom";
import Header from "../Header/Header";
import {
    getUserProjects,
    addUserProject,
    deleteUserProject,
    getUserProfile
} from "./actions";
import { selectUserProjects, selectUserProfile } from "./selectors";
import { Button } from "@material-ui/core";
import { push } from "connected-react-router";
import styled from "styled-components";

const ProfileContainer = styled.div`
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
`;

const ProfileSection = styled.div`
    grid-row: 1;
    grid-column: 1;
`;

const ProjectsSection = styled.div`
    grid-row: 1;
    grid-column: 2;
`;

const Profile = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const projects = useSelector(selectUserProjects);
    const profile = useSelector(selectUserProfile);
    useEffect(() => {
        dispatch(getUserProjects());
        dispatch(getUserProfile());
    }, [dispatch]);
    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <main>
                <ProfileContainer>
                    <ProfileSection>
                        <h2>Profile</h2>
                        <h3>Username: {profile.username}</h3>
                        <h3>Bio: {profile.bio}</h3>
                        <h3>Link 1: {profile.link1}</h3>
                        <h3>Link 2: {profile.link2}</h3>
                        <h3>Link 3: {profile.link3}</h3>
                    </ProfileSection>
                    <ProjectsSection>
                        <h2>User Projects</h2>
                        <p>
                            <Button
                                onClick={() => {
                                    dispatch(addUserProject());
                                }}
                            >
                                + Create New Project
                            </Button>
                        </p>
                        <ul>
                            {Array.isArray(projects) &&
                                projects.map((doc, i) => (
                                    <li key={i}>
                                        <Button
                                            onClick={e => {
                                                dispatch(
                                                    push(
                                                        "/editor/" +
                                                            doc.projectUid
                                                    )
                                                );
                                            }}
                                        >
                                            {doc.name}
                                        </Button>
                                        <Button
                                            onClick={e => {
                                                dispatch(
                                                    deleteUserProject(doc)
                                                );
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </li>
                                ))}
                        </ul>
                    </ProjectsSection>
                </ProfileContainer>
            </main>
        </div>
    );
};

export default withStyles(Profile);
