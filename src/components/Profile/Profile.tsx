import React, { useEffect, useState, RefObject } from "react";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import AssignmentIcon from "@material-ui/icons/Assignment";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import Header from "../Header/Header";
import {
    getUserProjects,
    getUserProfile,
    uploadImage,
    getUserImageURL,
    addProject,
    editProject,
    deleteProject,
    getTags,
    playListItem,
    pauseListItem,
    setCsoundStatus,
    editProfile
} from "./actions";
import {
    selectUserProjects,
    selectUserProfile,
    selectUserImageURL,
    selectIsUserProfileOwner,
    selectListPlayState,
    selectCurrentlyPlayingProject,
    selectCsoundStatus,
    selectPreviousCsoundStatus,
    selectShouldRedirect,
    selectProfileUid
} from "./selectors";
import { get } from "lodash";
import {
    Button,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    InputAdornment,
    IconButton
} from "@material-ui/core";
import CameraIcon from "@material-ui/icons/CameraAltOutlined";
import PlayIcon from "@material-ui/icons/PlayCircleFilledRounded";
import PauseIcon from "@material-ui/icons/PauseCircleFilledRounded";

import { push } from "connected-react-router";
import { selectCsoundStatus as selectCsoundPlayState } from "../Csound/selectors";
import { SET_LIST_PLAY_STATE } from "./types";
import { setProfileHotKeys } from "../HotKeys/actions";
import { stopCsound } from "../Csound/actions";
import {
    ProfileContainer,
    IDContainer,
    ProfilePictureContainer,
    ProfilePictureDiv,
    ProfilePicture,
    UploadProfilePicture,
    UploadProfilePictureText,
    UploadProfilePictureIcon,
    DescriptionSection,
    NameSectionWrapper,
    NameSection,
    MainContent,
    ContentSection,
    ContentTabsContainer,
    ContentActionsContainer,
    SearchBox,
    AddFab,
    ListContainer,
    StyledListItemContainer,
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledListItemChipsRow,
    StyledChip,
    StyledListPlayButtonContainer,
    StyledListButtonsContainer,
    EditProfileButtonSection
} from "./ProfileUI";

const Profile = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const username = get(props, "match.params.username") || null;

    const shouldRedirect = useSelector(selectShouldRedirect);
    const projects = useSelector(selectUserProjects);
    const profile = useSelector(selectUserProfile);
    const imageUrl = useSelector(selectUserImageURL);
    const isProfileOwner = useSelector(selectIsUserProfileOwner);
    const csoundPlayState = useSelector(selectCsoundPlayState);
    const listPlayState = useSelector(selectListPlayState);
    const currentlyPlayingProject = useSelector(selectCurrentlyPlayingProject);
    const csoundStatus = useSelector(selectCsoundStatus);
    const previousCsoundStatus = useSelector(selectPreviousCsoundStatus);
    const profileUid = useSelector(selectProfileUid);
    const [imageHover, setImageHover] = useState(false);
    const [selectedSection, setSelectedSection] = useState(0);

    let uploadRef: RefObject<HTMLInputElement> = React.createRef();

    useEffect(() => {
        if (profileUid !== null) {
            dispatch(getUserProjects(profileUid));
        }
    }, [dispatch, profileUid]);
    useEffect(() => {
        dispatch(getUserProfile(username));
        dispatch(getUserImageURL(username));
        dispatch(getTags());
        dispatch(setProfileHotKeys());
        return () => {
            dispatch(stopCsound());
        };
    }, [dispatch, props, username]);

    useEffect(() => {
        dispatch(setCsoundStatus(csoundPlayState));
    }, [dispatch, csoundPlayState]);

    useEffect(() => {
        if (csoundStatus === "stopped" && previousCsoundStatus === "playing") {
            dispatch({ type: SET_LIST_PLAY_STATE, payload: "stopped" });
        }
    }, [dispatch, csoundStatus, previousCsoundStatus]);

    if (shouldRedirect !== "NO") {
        return null;
    }

    const { displayName, bio, link1, link2, link3 } = profile;
    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <main>
                <ProfileContainer
                    colorA={"rgba(30, 30, 30, 1)"}
                    colorB={"rgba(40, 40, 40, 1)"}
                    colorC={"rgba(20, 20, 20, 1)"}
                >
                    <IDContainer>
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
                            {isProfileOwner && (
                                <UploadProfilePicture
                                    onClick={() => {
                                        const input = uploadRef.current;
                                        input!.click();
                                    }}
                                    imageHover={imageHover}
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
                        <DescriptionSection>
                            <Typography variant="h5" component="h4">
                                Bio
                            </Typography>
                            <Typography
                                variant="body2"
                                component="p"
                                color="textSecondary"
                                gutterBottom
                            >
                                {profile.bio}
                            </Typography>
                            <Typography variant="h5" component="h4">
                                Links
                            </Typography>
                            {link1 && (
                                <a
                                    href={
                                        link1.includes("://")
                                            ? link1
                                            : `https://${link1}`
                                    }
                                >
                                    <Typography variant="body1" component="div">
                                        {link1}
                                    </Typography>
                                </a>
                            )}
                            {link2 && (
                                <a
                                    href={
                                        link2.includes("://")
                                            ? link2
                                            : `https://${link2}`
                                    }
                                >
                                    <Typography variant="body1" component="div">
                                        {link2}
                                    </Typography>
                                </a>
                            )}
                            {link3 && (
                                <a
                                    href={
                                        link3.includes("://")
                                            ? link3
                                            : `https://${link3}`
                                    }
                                >
                                    <Typography variant="body1" component="div">
                                        {link3}
                                    </Typography>
                                </a>
                            )}
                        </DescriptionSection>
                        {isProfileOwner && (
                            <EditProfileButtonSection>
                                <AddFab
                                    color="primary"
                                    variant="extended"
                                    aria-label="Add"
                                    size="medium"
                                    onClick={() =>
                                        dispatch(
                                            editProfile(
                                                profile.username,
                                                displayName,
                                                bio,
                                                link1,
                                                link2,
                                                link3
                                            )
                                        )
                                    }
                                >
                                    Edit Profile
                                </AddFab>
                            </EditProfileButtonSection>
                        )}
                    </IDContainer>
                    <NameSectionWrapper>
                        <NameSection>
                            <Typography variant="h3" component="h3">
                                {displayName}
                            </Typography>
                        </NameSection>
                    </NameSectionWrapper>
                    <MainContent></MainContent>
                    <ContentSection>
                        <ContentTabsContainer>
                            <Tabs
                                value={selectedSection}
                                onChange={(e, index) => {
                                    setSelectedSection(index);
                                }}
                                indicatorColor={"primary"}
                            >
                                <Tab label="Projects" />
                                <Tab label="Following" />
                                <Tab label="Other" />
                            </Tabs>
                        </ContentTabsContainer>

                        <ContentActionsContainer>
                            <SearchBox
                                id="input-with-icon-adornment"
                                label="Search"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                                variant="outlined"
                                margin="dense"
                            />

                            {isProfileOwner && (
                                <AddFab
                                    color="primary"
                                    variant="extended"
                                    aria-label="Add"
                                    size="medium"
                                    className={classes.margin}
                                    onClick={() => dispatch(addProject())}
                                >
                                    Create
                                    <AddIcon className={classes.extendedIcon} />
                                </AddFab>
                            )}
                        </ContentActionsContainer>

                        <ListContainer>
                            <List style={{ overflow: "auto" }}>
                                {Array.isArray(projects) &&
                                    projects.map((p, i) => {
                                        return (
                                            <ListItem
                                                button
                                                alignItems="flex-start"
                                                onClick={e => {
                                                    dispatch(
                                                        push(
                                                            "/editor/" +
                                                                p.projectUid
                                                        )
                                                    );
                                                }}
                                                key={i}
                                            >
                                                <StyledListItemContainer
                                                    isProfileOwner={
                                                        isProfileOwner
                                                    }
                                                >
                                                    <StyledListItemAvatar>
                                                        <ListItemAvatar>
                                                            <Avatar>
                                                                <AssignmentIcon />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                    </StyledListItemAvatar>

                                                    <StyledListItemTopRowText>
                                                        <ListItemText
                                                            primary={p.name}
                                                            secondary={
                                                                p.description
                                                            }
                                                        />
                                                    </StyledListItemTopRowText>

                                                    <StyledListItemChipsRow>
                                                        {Array.isArray(
                                                            p.tags
                                                        ) &&
                                                            p.tags.map(
                                                                (
                                                                    t: React.ReactNode,
                                                                    i:
                                                                        | string
                                                                        | number
                                                                        | undefined
                                                                ) => {
                                                                    return (
                                                                        <StyledChip
                                                                            color="primary"
                                                                            key={
                                                                                i
                                                                            }
                                                                            label={
                                                                                t
                                                                            }
                                                                        />
                                                                    );
                                                                }
                                                            )}
                                                    </StyledListItemChipsRow>
                                                    <StyledListPlayButtonContainer>
                                                        {(listPlayState ===
                                                            "playing" &&
                                                            p.projectUid ===
                                                                currentlyPlayingProject && (
                                                                <IconButton
                                                                    size="medium"
                                                                    aria-label="Delete"
                                                                    onClick={e => {
                                                                        e.stopPropagation();

                                                                        dispatch(
                                                                            pauseListItem(
                                                                                p.projectUid
                                                                            )
                                                                        );
                                                                    }}
                                                                >
                                                                    <PauseIcon fontSize="large" />
                                                                </IconButton>
                                                            )) || (
                                                            <IconButton
                                                                size="medium"
                                                                aria-label="Delete"
                                                                onClick={e => {
                                                                    e.stopPropagation();

                                                                    dispatch(
                                                                        playListItem(
                                                                            p.projectUid
                                                                        )
                                                                    );
                                                                }}
                                                            >
                                                                <PlayIcon fontSize="large" />
                                                            </IconButton>
                                                        )}
                                                    </StyledListPlayButtonContainer>
                                                    {isProfileOwner && (
                                                        <StyledListButtonsContainer>
                                                            <Button
                                                                color="primary"
                                                                onClick={e => {
                                                                    dispatch(
                                                                        editProject(
                                                                            p
                                                                        )
                                                                    );
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                color="primary"
                                                                onClick={e => {
                                                                    dispatch(
                                                                        deleteProject(
                                                                            p
                                                                        )
                                                                    );
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                delete
                                                            </Button>
                                                        </StyledListButtonsContainer>
                                                    )}
                                                </StyledListItemContainer>
                                            </ListItem>
                                        );
                                    })}
                            </List>
                        </ListContainer>
                    </ContentSection>
                </ProfileContainer>
            </main>
        </div>
    );
};

export default withStyles(Profile);
