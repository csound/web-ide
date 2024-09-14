import { doc, getDoc } from "firebase/firestore";
import { useDispatch, useSelector } from "@root/store";
import { Path } from "history";
import ProfileLists from "./profile-lists";
import React, { useEffect, useState, RefObject } from "react";
import { useTheme } from "@emotion/react";
import { isMobile, updateBodyScroller } from "@root/utils";
import { gradient } from "./gradient";
import { usernames } from "@config/firestore";
import { push } from "connected-react-router";
import { createButtonAddIcon } from "./styles";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CameraIcon from "@mui/icons-material/CameraAltOutlined";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Header from "../header/header";
import {
    subscribeToFollowing,
    subscribeToFollowers,
    subscribeToProfile,
    subscribeToProfileStars,
    subscribeToProfileProjects
} from "./subscribers";
import {
    selectLoginRequesting,
    selectLoggedInUid
} from "@comp/login/selectors";
import { selectCurrentProfileRoute } from "@comp/router/selectors";
import {
    uploadProfileImage,
    addProject,
    editProfile,
    followUser,
    unfollowUser,
    setProjectFilterString
} from "./actions";
import {
    selectUserFollowing,
    selectUserProfile,
    selectUserImageURL,
    selectFilteredUserProjects,
    selectProjectFilterString
} from "./selectors";
import { get } from "lodash";
import { stopCsound } from "../csound/actions";
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
    ContentSection,
    ContentTabsContainer,
    contentActionsStyle,
    ListContainer,
    EditProfileButtonSection,
    fabButton
} from "./profile-ui";

const UserLink = ({ link }) => {
    return typeof link === "string" ? (
        <a href={link.includes("://") ? link : `https://${link}`}>
            <Typography variant="body1" component="div">
                {link}
            </Typography>
        </a>
    ) : (
        <></>
    );
};

export const Profile = () => {
    const [profileUid, setProfileUid]: [string | undefined, any] = useState();
    const theme = useTheme();
    const dispatch = useDispatch();
    const [username, profileUriPath] = useSelector(selectCurrentProfileRoute);
    const profile = useSelector(selectUserProfile(profileUid));
    const imageUrl = useSelector(selectUserImageURL(profileUid));
    const loggedInUserUid = useSelector(selectLoggedInUid);

    const filteredProjects = useSelector(
        selectFilteredUserProjects(profileUid)
    );
    // const followingFilterString = useSelector(selectFollowingFilterString);
    const projectFilterString = useSelector(selectProjectFilterString);
    const [imageHover, setImageHover] = useState(false);
    const [selectedSection, setSelectedSection] = useState(0);
    const loggedInUserFollowing: string[] = useSelector(
        selectUserFollowing(loggedInUserUid)
    );

    const isFollowing = profileUid
        ? loggedInUserFollowing.includes(profileUid)
        : false;
    const isRequestingLogin = useSelector(selectLoginRequesting);
    const isProfileOwner = loggedInUserUid === profileUid;
    const uploadReference: RefObject<HTMLInputElement> = React.createRef();

    useEffect(() => {
        // start at top on init
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (username) {
            if (!profileUriPath && selectedSection !== 0) {
                setSelectedSection(0);
            } else if (
                profileUriPath === "following" &&
                selectedSection !== 1
            ) {
                setSelectedSection(1);
            } else if (
                profileUriPath === "followers" &&
                selectedSection !== 2
            ) {
                setSelectedSection(2);
            } else if (profileUriPath === "stars" && selectedSection !== 3) {
                setSelectedSection(3);
            }
        }
    }, [profileUriPath, selectedSection, username]);

    useEffect(() => {
        if (!isRequestingLogin) {
            if (!username && !loggedInUserUid) {
                dispatch(push("/"));
            } else if (username) {
                getDoc(doc(usernames, username)).then((userSnap) => {
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        data && data.userUid
                            ? setProfileUid(data.userUid)
                            : dispatch(
                                  push({ pathname: "/404" } as Path, {
                                      message: "User not found"
                                  })
                              );
                    } else {
                        dispatch(
                            push({ pathname: "/404" } as Path, {
                                message: "User not found"
                            })
                        );
                    }
                });
            }
        }
    }, [dispatch, username, loggedInUserUid, isRequestingLogin, setProfileUid]);

    useEffect(() => {
        if (!isRequestingLogin && profileUid) {
            const unsubscribers = [
                subscribeToProfile(profileUid, dispatch),
                subscribeToFollowing(profileUid, dispatch),
                subscribeToFollowers(profileUid, dispatch),
                subscribeToProfileProjects(
                    profileUid,
                    isProfileOwner,
                    dispatch
                ),
                subscribeToProfileStars(profileUid, dispatch)
            ] as any[];
            // make sure the logged in user's following is listed
            // when viewing another profile, for un/follow state
            if (loggedInUserUid && !isProfileOwner) {
                unsubscribers.push(
                    subscribeToFollowing(loggedInUserUid, dispatch)
                );
            }
            return () => {
                unsubscribers.forEach((u) => u && u());
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

    // Fixes white bottom when switching from scrollable to non-scrollable list
    useEffect(() => {
        const mainElement = document.querySelectorAll("main");
        const resizeObserver = new ResizeObserver(updateBodyScroller(0));
        mainElement &&
            mainElement.length > 0 &&
            resizeObserver.observe(mainElement[0]);
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const {
        displayName,
        bio,
        link1,
        link2,
        link3,
        backgroundIndex = 0
    } = profile || {};

    useEffect(() => {
        if (document.title !== displayName) {
            document.title = displayName;
        }
    }, [displayName]);

    return (
        <Box>
            <Header />
            <Box css={gradient(backgroundIndex)}>
                <ProfileContainer>
                    {!isMobile() && (
                        <IDContainer>
                            <ProfilePictureContainer
                                onMouseEnter={() => setImageHover(true)}
                                onMouseLeave={() => setImageHover(false)}
                            >
                                <ProfilePictureDiv>
                                    {imageUrl && (
                                        <ProfilePicture
                                            src={imageUrl}
                                            width={"100%"}
                                            height={"100%"}
                                            alt="User Profile"
                                        />
                                    )}
                                </ProfilePictureDiv>
                                <input
                                    type="file"
                                    ref={uploadReference}
                                    style={{ display: "none" }}
                                    accept={"image/jpeg"}
                                    onChange={(event) => {
                                        const file: File | undefined = get(
                                            event,
                                            "target.files.0"
                                        );
                                        file &&
                                            loggedInUserUid &&
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
                                            const input =
                                                uploadReference.current;
                                            input && input.click();
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
                            <DescriptionSection gridRow="2">
                                <Typography variant="h5" component="h4">
                                    Bio
                                </Typography>
                                <Typography
                                    variant="body2"
                                    component="p"
                                    color="textSecondary"
                                    gutterBottom
                                >
                                    {profile && profile.bio}
                                </Typography>
                            </DescriptionSection>
                            <DescriptionSection gridRow="3">
                                <Typography variant="h5" component="h4">
                                    Links
                                </Typography>
                                {profile && (
                                    <>
                                        <UserLink link={link1} />
                                        <UserLink link={link2} />
                                        <UserLink link={link3} />
                                    </>
                                )}
                            </DescriptionSection>
                            {isProfileOwner && profileUid && (
                                <EditProfileButtonSection>
                                    <Button
                                        css={fabButton}
                                        color="primary"
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
                                                    link3,
                                                    backgroundIndex
                                                )
                                            )
                                        }
                                    >
                                        Edit Profile
                                    </Button>
                                </EditProfileButtonSection>
                            )}
                            {!isProfileOwner &&
                                profileUid &&
                                loggedInUserUid && (
                                    <EditProfileButtonSection>
                                        <Button
                                            css={fabButton}
                                            color="primary"
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
                                            {isFollowing
                                                ? "Unfollow"
                                                : "Follow"}
                                        </Button>
                                    </EditProfileButtonSection>
                                )}
                        </IDContainer>
                    )}
                    <NameSectionWrapper>
                        <NameSection>
                            <Typography variant="h3" component="h3">
                                {profile && displayName}
                            </Typography>
                        </NameSection>
                    </NameSectionWrapper>

                    <ContentSection
                        theme={theme}
                        showSearch={selectedSection === 0}
                    >
                        <ContentTabsContainer>
                            <Tabs
                                value={selectedSection}
                                onChange={(_, index) => {
                                    switch (index) {
                                        case 0: {
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}`
                                                } as Path)
                                            );
                                            break;
                                        }
                                        case 1: {
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}/following`
                                                } as Path)
                                            );
                                            break;
                                        }
                                        case 2: {
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}/followers`
                                                } as Path)
                                            );
                                            break;
                                        }
                                        case 3: {
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}/stars`
                                                } as Path)
                                            );
                                            break;
                                        }
                                    }
                                }}
                                indicatorColor={"primary"}
                            >
                                <Tab label="Projects" />
                                <Tab label="Following" />
                                <Tab label="Followers" />
                                <Tab label="Stars" />
                            </Tabs>
                        </ContentTabsContainer>

                        <Box
                            css={contentActionsStyle}
                            style={{
                                display: selectedSection === 0 ? "flex" : "none"
                            }}
                            component="form"
                            noValidate
                            autoComplete="off"
                        >
                            {selectedSection === 0 && (
                                <TextField
                                    id="input-with-icon-adornment"
                                    label="Search Projects"
                                    value={projectFilterString || ""}
                                    variant="outlined"
                                    margin="dense"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                    onChange={(event) => {
                                        dispatch(
                                            setProjectFilterString(
                                                event.target.value
                                            )
                                        );
                                    }}
                                />
                            )}

                            {isProfileOwner && selectedSection === 0 && (
                                <Button
                                    css={fabButton}
                                    color="primary"
                                    aria-label="Add"
                                    size="medium"
                                    onClick={() => dispatch(addProject())}
                                    data-tip={"Create new project"}
                                >
                                    Create
                                    <AddIcon css={createButtonAddIcon} />
                                </Button>
                            )}
                        </Box>
                        {profileUid && username && (
                            <ListContainer>
                                <ProfileLists
                                    profileUid={profileUid}
                                    isProfileOwner={isProfileOwner}
                                    selectedSection={selectedSection}
                                    filteredProjects={filteredProjects}
                                />
                            </ListContainer>
                        )}
                    </ContentSection>
                </ProfileContainer>
            </Box>
        </Box>
    );
};
