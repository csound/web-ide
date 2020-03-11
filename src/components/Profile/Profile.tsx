import ProfileLists from "./ProfileLists";
import React, { useEffect, useState, RefObject } from "react";
import { isMobile } from "@root/utils";
import { gradient } from "./Gradient";
import { usernames } from "@config/firestore";
import { push } from "connected-react-router";
import { updateBodyScroller } from "@root/utils";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import Header from "../Header/Header";
import ResizeObserver from "resize-observer-polyfill";

import {
    subscribeToFollowing,
    subscribeToFollowers,
    subscribeToProfile,
    subscribeToProfileStars,
    subscribeToProfileProjects
} from "./subscribers";
import { selectLoginRequesting } from "@comp/Login/selectors";
import { selectCurrentProfileRoute } from "@comp/Router/selectors";
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
import { selectLoggedInUid } from "@comp/Login/selectors";
import { get } from "lodash";
import { equals } from "ramda";
import { Typography, Tabs, Tab, InputAdornment } from "@material-ui/core";
import CameraIcon from "@material-ui/icons/CameraAltOutlined";
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

const Profile = ({ classes, ...props }) => {
    const [profileUid, setProfileUid]: [string | null, any] = useState(null);
    const dispatch = useDispatch();
    const [username, profileUriPath] = useSelector(selectCurrentProfileRoute);
    const profile = useSelector(selectUserProfile(profileUid));
    const imageUrl = useSelector(selectUserImageURL(profileUid));
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const allUserProjectsUids = useSelector(
        selectAllUserProjectUids(loggedInUserUid)
    );
    const [lastAllUserProjectUids, setLastAllUserProjectUids] = useState(
        allUserProjectsUids
    );
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
    let uploadRef: RefObject<HTMLInputElement> = React.createRef();

    useEffect(() => {
        if (username) {
            if (profileUriPath === null && selectedSection !== 0) {
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

    // Fixes white bottom when switching from scrollable to non-scrollable list
    useEffect(() => {
        const mainElem = document.getElementsByTagName("main");
        const resizeObserver = new ResizeObserver(updateBodyScroller(0));
        mainElem && mainElem.length > 0 && resizeObserver.observe(mainElem[0]);
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const { displayName, bio, link1, link2, link3, backgroundIndex } =
        profile || {};

    return (
        <div className={classes.root}>
            <Header />
            <div css={gradient(backgroundIndex || 0)}>
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
                                                    link3,
                                                    backgroundIndex
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
                    )}
                    <NameSectionWrapper>
                        <NameSection>
                            <Typography variant="h3" component="h3">
                                {profile && displayName}
                            </Typography>
                        </NameSection>
                    </NameSectionWrapper>
                    <MainContent />
                    <ContentSection showSearch={selectedSection === 0}>
                        <ContentTabsContainer>
                            <Tabs
                                value={selectedSection}
                                onChange={(e, index) => {
                                    switch (index) {
                                        case 0:
                                            dispatch(
                                                push(`/profile/${username}`)
                                            );
                                            break;
                                        case 1:
                                            dispatch(
                                                push(
                                                    `/profile/${username}/following`
                                                )
                                            );
                                            break;
                                        case 2:
                                            dispatch(
                                                push(
                                                    `/profile/${username}/followers`
                                                )
                                            );
                                            break;
                                        case 3:
                                            dispatch(
                                                push(
                                                    `/profile/${username}/stars`
                                                )
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

                            {isProfileOwner && selectedSection === 0 && (
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
                                profileUid={profileUid}
                                isProfileOwner={isProfileOwner}
                                selectedSection={selectedSection}
                                setProfileUid={setProfileUid}
                                filteredProjects={filteredProjects}
                                username={username}
                            />
                        </ListContainer>
                    </ContentSection>
                </ProfileContainer>
            </div>
        </div>
    );
};

export default withStyles(Profile);
