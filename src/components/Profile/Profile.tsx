import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import Header from "../Header/Header";
import {
    getUserProjects,
    addUserProject,
    deleteUserProject,
    getUserProfile,
    getUserImageURL
} from "./actions";
import {
    selectUserProjects,
    selectUserProfile,
    selectUserImageURL
} from "./selectors";
import { Button } from "@material-ui/core";
import { push } from "connected-react-router";
import styled from "styled-components";

const ProfileContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 300px 1fr;
    width: 100%;
    height: calc(100vh - 40px);
    background-color: black;
`;

const TopSection = styled.div`
    grid-row: 1;
    grid-column: 1;
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-columns: 1fr 260px 1fr;
    grid-template-rows: 60px 1fr;
    background-color: #556;
    background-image: linear-gradient(
            30deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            150deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            30deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            150deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            60deg,
            #aaa 25%,
            transparent 25.5%,
            transparent 75%,
            #aaa 75%,
            #aaa
        ),
        linear-gradient(
            60deg,
            #aaa 25%,
            transparent 25.5%,
            transparent 75%,
            #aaa 75%,
            #99a
        );
    background-size: 80px 140px;
    background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
`;

const BottomSection = styled.div`
    padding: 20px;
    grid-row: 2;
    grid-column: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    background-color: #e8e8e8;
    border-top: 2px solid black;
`;

const ProfileSection = styled.div`
    grid-row: 1;
    grid-column: 1;
`;

const ProjectsSection = styled.div`
    grid-row: 1;
    grid-column: 2;
`;

const ProfilePictureSectionContainer = styled.div`
    grid-row: 2;
    grid-column: 2;
    width: 100%;
    height: 100%;
    padding: 30px;
`;

const UsernameContainer = styled.div`
    grid-row: 1;
    grid-column: 2;
    text-align: center;
    color: white;
    font-size: 63px;
    font-family: Arial, Helvetica, sans-serif;
    /* -webkit-text-stroke: 1px black; */
    margin: 10px;
`;

const ProfilePicture = styled.img`
    width: 100%;
    height: 100%;
    transform: translate(0px, 24px);
    box-shadow: 0px 8px 12px 0px;
`;

const Profile = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const projects = useSelector(selectUserProjects);
    const profile = useSelector(selectUserProfile);
    const imageUrl = useSelector(selectUserImageURL);
    useEffect(() => {
        dispatch(getUserProjects());
        dispatch(getUserProfile());
        dispatch(getUserImageURL());
    }, [dispatch]);
    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <main>
                <ProfileContainer>
                    <TopSection>
                        <UsernameContainer>
                            {profile.username}
                        </UsernameContainer>
                        <ProfilePictureSectionContainer>
                            <ProfilePicture src={imageUrl} />
                        </ProfilePictureSectionContainer>
                    </TopSection>
                    <BottomSection>
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
                    </BottomSection>
                </ProfileContainer>
            </main>
        </div>
    );
};

export default withStyles(Profile);
