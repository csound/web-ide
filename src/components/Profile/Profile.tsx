import React, { useEffect, useState, RefObject } from "react";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import Header from "../Header/Header";
import {
    getUserProjects,
    getUserProfile,
    uploadImage,
    getUserImageURL,
    addProject,
    deleteProject
} from "./actions";
import {
    selectUserProjects,
    selectUserProfile,
    selectUserImageURL,
    selectIsUserProfileOwner
} from "./selectors";
import { get } from "lodash";
import { Button } from "@material-ui/core";
import CameraIcon from "@material-ui/icons/CameraAltOutlined";
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
    grid-template-rows: 1fr;
    background-color: #e8e8e8;
    border-top: 2px solid black;
`;

const ProfileSection = styled.div`
    grid-row: 1;
    grid-column: 1;
    padding: 20px;
`;

const ProjectsSection = styled.div`
    grid-row: 1;
    grid-column: 2;
    border-left: 2px solid #cccccc;
    padding: 20px;
`;

const ProfilePictureSectionContainer = styled.div`
    grid-row: 2;
    grid-column: 2;
    width: 100%;
    height: 100%;
    padding: 30px;
`;

const EditProfileButtonContainer = styled.div`
    grid-row: 1;
    grid-column: 3;
    padding: 40px;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 140px;
`;

const EditProfileButton = styled(Button)`
    grid-row: 1;
    grid-column: 2;

    && {
        color: white;
        /* font-family: "Merriweather", serif; */
    }
`;

const UsernameContainer = styled.div`
    grid-row: 1;
    grid-column: 2;
    text-align: center;
    color: white;
    font-size: 63px;
    font-family: "Merriweather", serif;
    text-shadow: 0 1px 1px black;
    margin: 10px;
`;

const ProfilePictureContainer = styled.div`
    position: relative;
    transform: translate(0px, 24px);
    box-shadow: 0px 8px 12px 0px;
    width: 100%;
    height: 100%;
`;

const ProfilePictureDiv = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    background: white;
`;

const UploadProfilePicture = styled.div`
    width: 100%;
    height: 30%;
    bottom: 0px;
    position: absolute;
    z-index: 2;
    background-color: #0000005c;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr;
    cursor: pointer;
`;

const UploadProfilePictureText = styled.div`
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
    font-weight: bold;
    color: white;
    padding-top: 3px;
    grid-row: 1;
    grid-column: 1;
`;

const UploadProfilePictureIcon = styled.div`
    grid-row: 2;
    grid-column: 1;
    align-content: center;
    color: white;
    margin-left: auto;
    margin-right: auto;
`;

const ProfilePicture = styled.img`
    object-fit: cover;
`;

const Profile = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const projects = useSelector(selectUserProjects);
    const profile = useSelector(selectUserProfile);
    const imageUrl = useSelector(selectUserImageURL);
    const isProfileOwner = useSelector(selectIsUserProfileOwner);
    const username = get(props, "match.params.username") || null;
    const [imageHover, setImageHover] = useState(false);
    let uploadRef: RefObject<HTMLInputElement>;
    uploadRef = React.createRef();
    useEffect(() => {
        dispatch(getUserProjects());
        dispatch(getUserProfile(username));
        dispatch(getUserImageURL(username));
    }, [dispatch, username]);
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
                            <ProfilePictureContainer
                                onMouseEnter={() => setImageHover(true)}
                                onMouseLeave={() => setImageHover(false)}
                            >
                                <ProfilePictureDiv>
                                    <ProfilePicture
                                        src={imageUrl}
                                        width={"100%"}
                                        height={"100%"}
                                        alt="User Profile"
                                    />
                                </ProfilePictureDiv>
                                <input
                                    type="file"
                                    ref={uploadRef}
                                    style={{ display: "none" }}
                                    accept={"image/jpeg"}
                                    onChange={e => {
                                        const file: File =
                                            get(e, "target.files.0") || null;
                                        dispatch(uploadImage(file));
                                    }}
                                />
                                {imageHover && isProfileOwner && (
                                    <UploadProfilePicture
                                        onClick={() => {
                                            const input = uploadRef.current;
                                            input!.click();
                                        }}
                                    >
                                        <UploadProfilePictureText>
                                            Upload New Image
                                        </UploadProfilePictureText>
                                        <UploadProfilePictureIcon>
                                            <CameraIcon />
                                        </UploadProfilePictureIcon>
                                    </UploadProfilePicture>
                                )}
                            </ProfilePictureContainer>
                        </ProfilePictureSectionContainer>
                        {isProfileOwner && (
                            <EditProfileButtonContainer>
                                <EditProfileButton
                                    variant="contained"
                                    color="secondary"
                                >
                                    Edit Profile
                                </EditProfileButton>
                            </EditProfileButtonContainer>
                        )}
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
                                {isProfileOwner && (
                                    <Button
                                        onClick={() => {
                                            dispatch(addProject());
                                        }}
                                    >
                                        + Create New Project
                                    </Button>
                                )}
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
                                            {isProfileOwner && (
                                                <Button
                                                    onClick={e => {
                                                        dispatch(
                                                            deleteProject(doc)
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
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
