import { doc, getDoc } from "firebase/firestore";
import { useDispatch, useSelector } from "@root/store";
import { ProfileLists } from "./profile-lists";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { updateBodyScroller } from "@root/utils";
import { gradient } from "./gradient";
import { usernames } from "@config/firestore";
import { useParams, useNavigate } from "react-router";
import { createButtonAddIcon } from "./styles";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import CameraIcon from "@mui/icons-material/CameraAltOutlined";
import AddIcon from "@mui/icons-material/Add";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { Header } from "../header/header";
import CachedProfileImage from "./cached-profile-image";
import {
    subscribeToFollowing,
    subscribeToFollowers,
    subscribeToProfile,
    subscribeToProfileStars,
    subscribeToProfileProjects,
    subscribeToProjectsCount
} from "./subscribers";
import {
    selectLoginRequesting,
    selectLoggedInUid
} from "@comp/login/selectors";
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
    selectUserProjects,
    selectProjectFilterString
} from "./selectors";
import { get } from "lodash";
import { stopCsound } from "../csound/actions";
import {
    ProfileContainer,
    IDContainer,
    ProfilePictureContainer,
    ProfilePictureDiv,
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
    fabButton,
    mobileNavigationContainer,
    mobileNavigationButton,
    profileMobileBottomSpacer,
    MobileAboutSection
} from "./profile-ui";

type ProfileSection =
    | "projects"
    | "following"
    | "followers"
    | "stars"
    | "about";

const PROFILE_ROUTE_SECTION_MAP: Record<
    string,
    Exclude<ProfileSection, "about">
> = {
    following: "following",
    followers: "followers",
    stars: "stars"
};

const PROFILE_SECTION_VALUE: Record<ProfileSection, number> = {
    projects: 0,
    following: 1,
    followers: 2,
    stars: 3,
    about: 4
};

const getRouteSection = (tab?: string): Exclude<ProfileSection, "about"> =>
    PROFILE_ROUTE_SECTION_MAP[tab || ""] || "projects";

const UserLink = ({ link }: { link: string | undefined }) => {
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
    const [profileUid, setProfileUid] = useState<string | undefined>();
    const theme = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { username, tab } = useParams();
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const profileSelector = useMemo(
        () => selectUserProfile(profileUid),
        [profileUid]
    );
    const imageUrlSelector = useMemo(
        () => selectUserImageURL(profileUid),
        [profileUid]
    );
    const projectsSelector = useMemo(
        () => selectUserProjects(profileUid),
        [profileUid]
    );
    const followingSelector = useMemo(
        () => selectUserFollowing(loggedInUserUid),
        [loggedInUserUid]
    );

    const profile = useSelector(profileSelector);
    const imageUrl = useSelector(imageUrlSelector);
    const filteredProjects = useSelector(projectsSelector);
    // const followingFilterString = useSelector(selectFollowingFilterString);
    const projectFilterString = useSelector(selectProjectFilterString);
    const [imageHover, setImageHover] = useState(false);
    const [isAboutSelected, setIsAboutSelected] = useState(false);
    const loggedInUserFollowing: string[] = useSelector(followingSelector);
    const isMobileLayout = useMediaQuery("(max-width: 760px)");
    const routeSection = getRouteSection(tab);

    const selectedSection: ProfileSection =
        isMobileLayout && isAboutSelected ? "about" : routeSection;

    const isFollowing = profileUid
        ? loggedInUserFollowing.includes(profileUid)
        : false;
    const isRequestingLogin = useSelector(selectLoginRequesting);
    const isProfileOwner = loggedInUserUid === profileUid;
    const uploadReference = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // start at top on init
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!isMobileLayout || routeSection !== getRouteSection(tab)) {
            setIsAboutSelected(false);
        }
    }, [isMobileLayout, routeSection, tab]);

    useEffect(() => {
        if (!isRequestingLogin) {
            if (!username && !loggedInUserUid) {
                navigate("/");
            } else if (username) {
                getDoc(doc(usernames, username)).then((userSnap) => {
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        data && data.userUid
                            ? setProfileUid(data.userUid)
                            : navigate("/404", {
                                  state: { message: "User not found" }
                              });
                    } else {
                        navigate("/404", {
                            state: { message: "User not found" }
                        });
                    }
                });
            }
        }
    }, [navigate, username, loggedInUserUid, isRequestingLogin, setProfileUid]);

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
                subscribeToProfileStars(profileUid, dispatch),
                subscribeToProjectsCount(profileUid, dispatch)
            ];
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
        if (displayName !== undefined && document.title !== displayName) {
            document.title = displayName;
        }
    }, [displayName]);

    const selectedSectionValue = PROFILE_SECTION_VALUE[selectedSection];
    const isProjectsSection = selectedSection === "projects";
    const isAboutSection = selectedSection === "about";

    const handleSectionChange = (section: ProfileSection) => {
        if (section === "about") {
            setIsAboutSelected(true);
            return;
        }
        setIsAboutSelected(false);
        switch (section) {
            case "projects": {
                navigate(`/profile/${username}`);
                return;
            }
            case "following": {
                navigate(`/profile/${username}/following`);
                return;
            }
            case "followers": {
                navigate(`/profile/${username}/followers`);
                return;
            }
            case "stars": {
                navigate(`/profile/${username}/stars`);
                return;
            }
        }
    };

    const profileActions = (
        <>
            {isProfileOwner && profileUid && (
                <EditProfileButtonSection>
                    <Button
                        css={fabButton}
                        variant="outlined"
                        color="primary"
                        size="medium"
                        startIcon={<EditIcon />}
                        aria-label="Edit profile settings"
                        onClick={() =>
                            profile &&
                            dispatch(
                                editProfile(
                                    profile.username,
                                    displayName || "",
                                    bio || "",
                                    link1 || "",
                                    link2 || "",
                                    link3 || "",
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
                                      unfollowUser(loggedInUserUid, profileUid)
                                  )
                                : dispatch(
                                      followUser(loggedInUserUid, profileUid)
                                  );
                        }}
                    >
                        {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                </EditProfileButtonSection>
            )}
        </>
    );

    const desktopProfileDetails = (
        <>
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
            {profileActions}
        </>
    );

    const mobileAboutContent = (
        <MobileAboutSection>
            <div>
                <Typography variant="h5" component="h4" gutterBottom>
                    Bio
                </Typography>
                <Typography variant="body2" component="p" color="textSecondary">
                    {profile?.bio || "No bio available."}
                </Typography>
            </div>
            <div>
                <Typography variant="h5" component="h4" gutterBottom>
                    Links
                </Typography>
                {profile ? (
                    <>
                        <UserLink link={link1} />
                        <UserLink link={link2} />
                        <UserLink link={link3} />
                    </>
                ) : null}
            </div>
            {profileActions}
        </MobileAboutSection>
    );

    return (
        <Box>
            <Header />
            <Box css={gradient(backgroundIndex)}>
                <ProfileContainer>
                    {!isMobileLayout && (
                        <IDContainer>
                            <ProfilePictureContainer
                                onMouseEnter={() => setImageHover(true)}
                                onMouseLeave={() => setImageHover(false)}
                            >
                                <ProfilePictureDiv>
                                    {imageUrl && (
                                        <CachedProfileImage
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
                            {desktopProfileDetails}
                        </IDContainer>
                    )}
                    <NameSectionWrapper>
                        <NameSection>
                            <Typography
                                variant={isMobileLayout ? "h4" : "h3"}
                                component="h3"
                            >
                                {profile && displayName}
                            </Typography>
                        </NameSection>
                    </NameSectionWrapper>

                    <ContentSection
                        theme={theme}
                        showSearch={isProjectsSection}
                    >
                        {!isMobileLayout && (
                            <ContentTabsContainer>
                                <Tabs
                                    value={selectedSectionValue}
                                    onChange={(_, value: number) =>
                                        handleSectionChange(
                                            value === 1
                                                ? "following"
                                                : value === 2
                                                  ? "followers"
                                                  : value === 3
                                                    ? "stars"
                                                    : "projects"
                                        )
                                    }
                                    indicatorColor={"primary"}
                                >
                                    <Tab label="Projects" />
                                    <Tab label="Following" />
                                    <Tab label="Followers" />
                                    <Tab label="Stars" />
                                </Tabs>
                            </ContentTabsContainer>
                        )}

                        {!isAboutSection && (
                            <Box
                                css={contentActionsStyle}
                                style={{
                                    display: isProjectsSection ? "flex" : "none"
                                }}
                                component="form"
                                noValidate
                                autoComplete="off"
                            >
                                {isProjectsSection && (
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

                                {isProfileOwner && isProjectsSection && (
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
                        )}
                        {profileUid && username && !isAboutSection && (
                            <ListContainer>
                                <ProfileLists
                                    profileUid={profileUid}
                                    isProfileOwner={isProfileOwner}
                                    selectedSection={selectedSectionValue}
                                    filteredProjects={filteredProjects}
                                />
                            </ListContainer>
                        )}
                        {isMobileLayout && isAboutSection && mobileAboutContent}
                    </ContentSection>
                    {isMobileLayout && <div css={profileMobileBottomSpacer} />}
                </ProfileContainer>
                {isMobileLayout && (
                    <BottomNavigation
                        value={selectedSectionValue}
                        onChange={(_, value: number) =>
                            handleSectionChange(
                                value === 1
                                    ? "following"
                                    : value === 2
                                      ? "followers"
                                      : value === 3
                                        ? "stars"
                                        : value === 4
                                          ? "about"
                                          : "projects"
                            )
                        }
                        css={mobileNavigationContainer}
                        showLabels
                    >
                        <BottomNavigationAction
                            value={0}
                            css={mobileNavigationButton}
                            label="Projects"
                            icon={<FolderOutlinedIcon fontSize="large" />}
                        />
                        <BottomNavigationAction
                            value={1}
                            css={mobileNavigationButton}
                            label="Following"
                            icon={
                                <PersonAddAlt1OutlinedIcon fontSize="large" />
                            }
                        />
                        <BottomNavigationAction
                            value={2}
                            css={mobileNavigationButton}
                            label="Followers"
                            icon={<PeopleOutlineIcon fontSize="large" />}
                        />
                        <BottomNavigationAction
                            value={3}
                            css={mobileNavigationButton}
                            label="Stars"
                            icon={<StarBorderOutlinedIcon fontSize="large" />}
                        />
                        <BottomNavigationAction
                            value={4}
                            css={mobileNavigationButton}
                            label="About"
                            icon={<PersonOutlineIcon fontSize="large" />}
                        />
                    </BottomNavigation>
                )}
            </Box>
        </Box>
    );
};
