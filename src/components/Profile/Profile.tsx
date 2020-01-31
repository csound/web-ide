import ProfileLists from "./ProfileLists";
import React, { useEffect, useState, RefObject } from "react";
import { usernames } from "@config/firestore";
import { push } from "connected-react-router";
// import { useTheme } from "emotion-theming";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import Header from "../Header/Header";
import {
    subscribeToLoggedInUserFollowing,
    subscribeToFollowing,
    subscribeToProfile,
    subscribeToProfileProjects
} from "./subscribers";
import { selectLoginRequesting } from "@comp/Login/selectors";
import {
    uploadProfileImage,
    addProject,
    // getTags,
    setCsoundStatus,
    editProfile,
    followUser,
    unfollowUser,
    setProjectFilterString,
    setFollowingFilterString,
    getLoggedInUserStars
} from "./actions";
import {
    selectUserProfile,
    selectUserImageURL,
    selectCsoundStatus,
    selectPreviousCsoundStatus,
    selectLoggedInUserFollowing,
    // selectUserFollowing,
    selectUserImageURLRequesting,
    selectUserProfileRequesting,
    selectFilteredUserProjects,
    selectProjectFilterString,
    selectFollowingFilterString
} from "./selectors";
import { selectLoggedInUid } from "@comp/Login/selectors";
import { get } from "lodash";
import { Typography, Tabs, Tab, InputAdornment } from "@material-ui/core";
import CameraIcon from "@material-ui/icons/CameraAltOutlined";
import { selectCsoundStatus as selectCsoundPlayState } from "../Csound/selectors";
import { SET_LIST_PLAY_STATE } from "./types";
import { stopCsound } from "../Csound/actions";
import {
    ProfileMain,
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
    EditProfileButtonSection
} from "./ProfileUI";

const UserLink = ({ link }) => {
    if (typeof link === "string") {
        return (
            <a href={link.includes("://") ? link : `https://${link}`}>
                <Typography variant="body1" component="div">
                    {link}
                </Typography>
            </a>
        );
    }
    return null;
};

const Profile = props => {
    const { classes } = props;
    // const theme: any = useTheme();
    const [profileUid, setProfileUid]: [string | null, any] = useState(null);
    // const fromFollowing = get(props, "location.state.fromFollowing");
    const dispatch = useDispatch();
    const username = get(props, "match.params.username") || null;
    const profile = useSelector(selectUserProfile);
    const imageUrl = useSelector(selectUserImageURL);
    const csoundPlayState = useSelector(selectCsoundPlayState);
    const csoundStatus = useSelector(selectCsoundStatus);
    const previousCsoundStatus = useSelector(selectPreviousCsoundStatus);
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const imageUrlRequesting = useSelector(selectUserImageURLRequesting);
    const profileRequesting = useSelector(selectUserProfileRequesting);
    const filteredProjects = useSelector(
        selectFilteredUserProjects(profileUid)
    );
    const followingFilterString = useSelector(selectFollowingFilterString);
    const projectFilterString = useSelector(selectProjectFilterString);
    const [imageHover, setImageHover] = useState(false);
    const [selectedSection, setSelectedSection] = useState(0);
    const loggedInUserFollowing = useSelector(selectLoggedInUserFollowing);
    const isFollowing = loggedInUserFollowing.includes(profileUid);
    const isRequestingLogin = useSelector(selectLoginRequesting);
    const isProfileOwner = loggedInUserUid === profileUid;
    let uploadRef: RefObject<HTMLInputElement> = React.createRef();

    useEffect(() => {
        if (!isRequestingLogin) {
            if (!username) {
                loggedInUserUid
                    ? setProfileUid(loggedInUserUid)
                    : dispatch(push("/"));
            } else {
                usernames
                    .doc(username)
                    .get()
                    .then(userSnap => {
                        if (!userSnap.exists) {
                            dispatch(
                                push("/404", { message: "User not found" })
                            );
                        } else {
                            const data = userSnap.data();
                            data && data.userUid
                                ? setProfileUid(data.userUid)
                                : dispatch(
                                      push("/404", {
                                          message: "User not found"
                                      })
                                  );
                        }
                    });
            }
        }
    }, [dispatch, username, loggedInUserUid, isRequestingLogin]);

    useEffect(() => {
        if (!isRequestingLogin && profileUid) {
            const unsubscribers = [
                subscribeToProfile(profileUid, dispatch),
                subscribeToFollowing(profileUid, dispatch),
                subscribeToProfileProjects(profileUid, isProfileOwner, dispatch)
            ] as any[];
            if (loggedInUserUid) {
                unsubscribers.push(
                    subscribeToLoggedInUserFollowing(loggedInUserUid, dispatch)
                );
            }
            // dispatch(getTags());
            // dispatch(getUserFollowing(username));
            // dispatch(getLoggedInUserFollowing());
            dispatch(setProjectFilterString(""));
            dispatch(setFollowingFilterString(""));
            dispatch(getLoggedInUserStars());
            return () => {
                unsubscribers.forEach(u => u && u());
                dispatch(stopCsound());
            };
        }
    }, [
        dispatch,
        username,
        isRequestingLogin,
        profileUid,
        isProfileOwner,
        loggedInUserUid
    ]);

    useEffect(() => {
        dispatch(setCsoundStatus(csoundPlayState));
    }, [dispatch, csoundPlayState]);

    useEffect(() => {
        if (csoundStatus === "stopped" && previousCsoundStatus === "playing") {
            dispatch({ type: SET_LIST_PLAY_STATE, payload: "stopped" });
        }
    }, [dispatch, csoundStatus, previousCsoundStatus]);

    const { displayName, bio, link1, link2, link3 } = profile;
    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <ProfileMain
                colorA={"rgba(30, 30, 30, 1)"}
                colorB={"rgba(40, 40, 40, 1)"}
                colorC={"rgba(20, 20, 20, 1)"}
            >
                <ProfileContainer>
                    <IDContainer>
                        <ProfilePictureContainer
                            onMouseEnter={() => setImageHover(true)}
                            onMouseLeave={() => setImageHover(false)}
                        >
                            <ProfilePictureDiv>
                                {imageUrlRequesting === false && (
                                    <ProfilePicture
                                        src={imageUrl!}
                                        width={"100%"}
                                        height={"100%"}
                                        alt="User Profile"
                                    />
                                )}
                            </ProfilePictureDiv>
                            <input
                                type="file"
                                ref={uploadRef}
                                style={{ display: "none" }}
                                accept={"image/jpeg"}
                                onChange={e => {
                                    const file: File =
                                        get(e, "target.files.0") || null;
                                    dispatch(
                                        uploadProfileImage(
                                            loggedInUserUid,
                                            file
                                        )
                                    );
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
                                {profileRequesting === false && profile.bio}
                            </Typography>
                            <Typography variant="h5" component="h4">
                                Links
                            </Typography>
                            {profileRequesting === false && (
                                <>
                                    <UserLink link={link1} />
                                    <UserLink link={link2} />
                                    <UserLink link={link3} />
                                </>
                            )}
                        </DescriptionSection>
                        {isProfileOwner && profileUid && (
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
                        {!isProfileOwner && profileUid && loggedInUserUid && (
                            <EditProfileButtonSection>
                                <AddFab
                                    color="primary"
                                    variant="extended"
                                    aria-label="Add"
                                    size="medium"
                                    onClick={() => {
                                        isFollowing
                                            ? dispatch(
                                                  unfollowUser(
                                                      loggedInUserUid,
                                                      profileUid
                                                  )
                                              )
                                            : dispatch(
                                                  followUser(
                                                      loggedInUserUid,
                                                      profileUid
                                                  )
                                              );
                                    }}
                                >
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </AddFab>
                            </EditProfileButtonSection>
                        )}
                    </IDContainer>
                    <NameSectionWrapper>
                        <NameSection>
                            <Typography variant="h3" component="h3">
                                {profileRequesting === false && displayName}
                            </Typography>
                        </NameSection>
                    </NameSectionWrapper>
                    <MainContent />
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
                            </Tabs>
                        </ContentTabsContainer>

                        <ContentActionsContainer>
                            {selectedSection === 0 && (
                                <SearchBox
                                    id="input-with-icon-adornment"
                                    label="Search Projects"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                    value={projectFilterString}
                                    variant="outlined"
                                    margin="dense"
                                    onChange={e => {
                                        dispatch(
                                            setProjectFilterString(
                                                e.target.value
                                            )
                                        );
                                    }}
                                />
                            )}
                            {selectedSection === 1 && (
                                <SearchBox
                                    id="input-with-icon-adornment"
                                    label="Search Following"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                    value={followingFilterString}
                                    variant="outlined"
                                    margin="dense"
                                    onChange={e => {
                                        dispatch(
                                            setFollowingFilterString(
                                                e.target.value
                                            )
                                        );
                                    }}
                                />
                            )}

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
                            <ProfileLists
                                isProfileOwner={isProfileOwner}
                                selectedSection={selectedSection}
                                setSelectedSection={setSelectedSection}
                                setProfileUid={setProfileUid}
                                filteredProjects={filteredProjects}
                                username={username}
                            />
                        </ListContainer>
                    </ContentSection>
                </ProfileContainer>
            </ProfileMain>
        </div>
    );
};

export default withStyles(Profile);
