import { doc, getDoc } from "firebase/firestore";
import { Path } from "history";
import ProfileLists from "./profile-lists";
import React, { useEffect, useState, RefObject } from "react";
import ReactTooltip from "react-tooltip";
import { useTheme } from "@emotion/react";
import { isMobile, updateBodyScroller } from "@root/utils";
import { gradient } from "./gradient";
import { usernames } from "@config/firestore";
import { push } from "connected-react-router";
import { useDispatch, useSelector } from "react-redux";
import withStyles, { createButtonAddIcon } from "./styles";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import Header from "../header/header";
import ResizeObserver from "resize-observer-polyfill";
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
    getAllTagsFromUser,
    // getTags,
    editProfile,
    followUser,
    unfollowUser,
    setProjectFilterString
    // setFollowingFilterString
    // getLoggedInUserStars
} from "./actions";
import {
    selectUserFollowing,
    selectUserProfile,
    selectUserImageURL,
    selectAllUserProjectUids,
    selectFilteredUserProjects,
    selectProjectFilterString
    // selectFollowingFilterString
} from "./selectors";

import { get } from "lodash";
import { equals } from "ramda";
import { Typography, Tabs, Tab, InputAdornment } from "@material-ui/core";
import CameraIcon from "@material-ui/icons/CameraAltOutlined";
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
    ContentActionsContainer,
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

const Profile = ({ classes, ...properties }) => {
    const [profileUid, setProfileUid]: [string | undefined, any] = useState();
    const theme = useTheme();
    const dispatch = useDispatch();
    const [username, profileUriPath] = useSelector(selectCurrentProfileRoute);
    const profile = useSelector(selectUserProfile(profileUid));
    const imageUrl = useSelector(selectUserImageURL(profileUid));
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const allUserProjectsUids = useSelector(
        selectAllUserProjectUids(loggedInUserUid)
    );
    const [lastAllUserProjectUids, setLastAllUserProjectUids] =
        useState(allUserProjectsUids);
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
        ReactTooltip.rebuild();
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
        if (
            loggedInUserUid &&
            isProfileOwner &&
            !equals(lastAllUserProjectUids, allUserProjectsUids)
        ) {
            dispatch(getAllTagsFromUser(loggedInUserUid, allUserProjectsUids));
            setLastAllUserProjectUids(allUserProjectsUids);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allUserProjectsUids]);

    useEffect(() => {
        if (!isRequestingLogin) {
            if (!username && !loggedInUserUid) {
                dispatch(push("/"));
            } else if (username) {
                getDoc(doc(usernames, username)).then((userSnap) => {
                    if (!userSnap.exists()) {
                        dispatch(
                            push({ pathname: "/404" } as Path, {
                                message: "User not found"
                            })
                        );
                    } else {
                        const data = userSnap.data();
                        data && data.userUid
                            ? setProfileUid(data.userUid)
                            : dispatch(
                                  push({ pathname: "/404" } as Path, {
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

    return (
        <div className={classes.root}>
            <Header />
            <div css={gradient(backgroundIndex)}>
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
                                    {profile && profile.bio}
                                </Typography>
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
                            {!isProfileOwner && profileUid && loggedInUserUid && (
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
                                        {isFollowing ? "Unfollow" : "Follow"}
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
                                onChange={(event, index) => {
                                    switch (index) {
                                        case 0:
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}`
                                                } as Path)
                                            );
                                            break;
                                        case 1:
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}/following`
                                                } as Path)
                                            );
                                            break;
                                        case 2:
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}/followers`
                                                } as Path)
                                            );
                                            break;
                                        case 3:
                                            dispatch(
                                                push({
                                                    pathname: `/profile/${username}/stars`
                                                } as Path)
                                            );
                                            break;
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

                        <ContentActionsContainer
                            style={{
                                display: selectedSection === 0 ? "flex" : "none"
                            }}
                        >
                            {selectedSection === 0 && (
                                <TextField
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
                        </ContentActionsContainer>
                        {profileUid && username && (
                            <ListContainer>
                                <ProfileLists
                                    profileUid={profileUid}
                                    isProfileOwner={isProfileOwner}
                                    selectedSection={selectedSection}
                                    filteredProjects={filteredProjects}
                                    username={username}
                                />
                            </ListContainer>
                        )}
                    </ContentSection>
                </ProfileContainer>
            </div>
        </div>
    );
};

export default withStyles(Profile);
