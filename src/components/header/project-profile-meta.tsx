import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import { formatDistance } from "date-fns";
import { selectActiveProject } from "@comp/projects/selectors";
import { selectProjectLastModified } from "@comp/project-last-modified/selectors";
import {
    selectUserProfile,
    selectUserImageURL,
    selectUserProjectsCount
} from "@comp/profile/selectors";
import ProjectAvatar from "@elem/project-avatar";
import { AccountBox } from "@mui/icons-material";
import Avatar from "@mui/material/Avatar";
import { IProject } from "@comp/projects/types";
import IconButton from "@mui/material/IconButton";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import * as SS from "./styles";
import { isEmpty } from "ramda";

const ProjectProfileMeta = (): React.ReactElement => {
    const now = new Date();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const project: IProject | undefined = useSelector(selectActiveProject);
    const projectName = project?.name ?? "unknown project name";
    const projectDescription = project?.description ?? "";

    const projectLastModified = useSelector(
        selectProjectLastModified(project?.projectUid)
    );

    const projectLastModifiedDate =
        projectLastModified && typeof projectLastModified.timestamp === "number"
            ? new Date(projectLastModified?.timestamp)
            : undefined;

    const projectOwnerUid = project?.userUid ?? undefined;
    const profile = useSelector(selectUserProfile(projectOwnerUid));

    const profileUserName = profile?.username ?? "";
    const profileDisplayName = profile?.displayName ?? "unknown user";
    const profileBio = profile?.bio ?? "";
    const profileLinks = [profile?.link1, profile?.link2, profile?.link3]
        .filter((url): url is string => typeof url === "string" && !!url)
        .slice(0, 3);
    const profileImage = useSelector(selectUserImageURL(projectOwnerUid));
    const profileProjectsCount = useSelector(
        selectUserProjectsCount(projectOwnerUid)
    );

    const modifiedText = projectLastModifiedDate
        ? `Modified ${formatDistance(projectLastModifiedDate, now, {
              addSuffix: true
          })}`
        : "";

    const normalizeUrl = (rawUrl: string): string =>
        /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    const compactLinkLabel = (rawUrl: string): string => {
        try {
            const url = new URL(normalizeUrl(rawUrl));
            return url.hostname.replace(/^www\./, "");
        } catch {
            return rawUrl;
        }
    };

    const shortProjectDescription =
        projectDescription.length > 110
            ? `${projectDescription.slice(0, 110).trim()}...`
            : projectDescription;

    const shortProfileBio =
        profileBio.length > 110
            ? `${profileBio.slice(0, 110).trim()}...`
            : profileBio;

    const projectMetaBody = (
        <>
            <div css={SS.projectProfileTopRow}>
                <div css={SS.projectIcon}>
                    <ProjectAvatar
                        iconName={project?.iconName}
                        iconBackgroundColor={project?.iconBackgroundColor}
                        iconForegroundColor={project?.iconForegroundColor}
                    />
                </div>
                <div css={SS.projectProfileTextBlock}>
                    <h1 css={SS.projectProfileMetaH1}>{projectName}</h1>
                    <p css={SS.projectProfileMetaP}>
                        <span css={SS.projectProfileBySpan}>By </span>
                        <Link
                            to={`/profile/${profileUserName}`}
                            css={SS.projectProfileLink}
                        >
                            {profileDisplayName}
                        </Link>
                    </p>
                </div>
                <IconButton
                    size="small"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    css={SS.projectProfileCollapseButton}
                >
                    {isCollapsed ? (
                        <KeyboardArrowUpIcon fontSize="small" />
                    ) : (
                        <KeyboardArrowDownIcon fontSize="small" />
                    )}
                </IconButton>
            </div>

            {!isCollapsed && (
                <div css={SS.projectProfileDetails}>
                    <div css={SS.projectProfileAuthorRow}>
                        <div css={SS.projectProfileImgContainer}>
                            {isEmpty(profileImage) ? (
                                <AccountBox />
                            ) : (
                                <Avatar
                                    variant="square"
                                    src={profileImage}
                                    imgProps={{ style: { objectFit: "cover" } }}
                                />
                            )}
                        </div>
                        <p css={SS.projectProfileDescription}>
                            {`${profileProjectsCount.public || 0} public projects`}
                        </p>
                    </div>

                    {!!shortProjectDescription && (
                        <p css={SS.projectProfileDescription}>
                            {shortProjectDescription}
                        </p>
                    )}

                    {!!shortProfileBio && (
                        <p css={SS.projectProfileDescription}>
                            {shortProfileBio}
                        </p>
                    )}

                    {!!modifiedText && (
                        <p css={SS.projectProfileDescription}>{modifiedText}</p>
                    )}

                    {profileLinks.length > 0 && (
                        <div css={SS.projectProfileLinks}>
                            {profileLinks.map((url) => (
                                <a
                                    key={url}
                                    href={normalizeUrl(url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    css={SS.projectProfileExternalLink}
                                >
                                    <span>{compactLinkLabel(url)}</span>
                                    <OpenInNewIcon fontSize="inherit" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );

    return project ? (
        <div css={SS.projectProfileMetaContainer}>
            <div css={SS.projectProfileMetaTextContainer}>{projectMetaBody}</div>
        </div>
    ) : (
        <></>
    );
};

export default ProjectProfileMeta;
