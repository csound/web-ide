import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { selectActiveProject } from "@comp/projects/selectors";
import { selectProjectLastModified } from "@comp/project-last-modified/selectors";
import {
    selectUserProfile,
    selectUserImageURL,
    selectProfileProjectsCount
} from "@comp/profile/selectors";
import ProjectAvatar from "@elem/project-avatar";
import { AccountBox } from "@mui/icons-material";
import Avatar from "@mui/material/Avatar";
import { IProject } from "@comp/projects/types";
import Tooltip from "@mui/material/Tooltip";
import * as SS from "./styles";
import { isEmpty } from "ramda";

const ProjectProfileMeta = (): React.ReactElement => {
    const now = new Date();

    const project: IProject | undefined = useSelector(selectActiveProject);
    const projectName = project?.name ?? "unknown project name";
    const projectDescription = project?.description ?? "";

    const projectLastModified = project?.projectUid
        ? useSelector(selectProjectLastModified(project?.projectUid))
        : undefined;

    const projectLastModifiedDate =
        projectLastModified && typeof projectLastModified.timestamp === "number"
            ? new Date(projectLastModified?.timestamp)
            : undefined;

    const projectOwnerUid = project?.userUid ?? undefined;
    const profile = useSelector(selectUserProfile(projectOwnerUid));
    const profileUserName = profile?.username ?? "";
    const profileDisplayName = profile?.displayName ?? "unknown user";
    const profileImage = useSelector(selectUserImageURL(projectOwnerUid));
    const profileProjectsCount = projectOwnerUid
        ? useSelector(selectProfileProjectsCount(projectOwnerUid))
        : 0;

    const authorTooltip = (
        <div css={SS.projectProfileTooltipContainer}>
            <div css={SS.projectProfileImgContainer}>
                {isEmpty(profileImage) ? (
                    <AccountBox />
                ) : (
                    <Avatar src={profileImage} />
                )}
            </div>
            <div css={SS.projectProfileTooltip}>
                <h2>{profileDisplayName}</h2>
                <p>{`${profileProjectsCount.public || 0} projects`}</p>
            </div>
        </div>
    );

    return project ? (
        <div css={SS.projectProfileMetaContainer}>
            <div css={SS.projectProfileMetaTextContainer}>
                <Tooltip
                    placement="right"
                    title={
                        <div>
                            <div css={SS.projectProfileTooltipTitleContainer}>
                                <div css={SS.projectIcon}>
                                    <ProjectAvatar project={project} />
                                </div>
                                <div style={{ marginLeft: 24 }}>
                                    <h1 css={SS.projectProfileMetaH1}>
                                        {projectName}
                                    </h1>
                                    <p css={SS.projectProfileDescription}>
                                        {projectDescription}
                                    </p>
                                    <div>
                                        {projectLastModifiedDate && (
                                            <em
                                                css={
                                                    SS.projectProfileDescription
                                                }
                                            >
                                                Modified
                                                {formatDistance(
                                                    projectLastModifiedDate,
                                                    now,
                                                    { addSuffix: true }
                                                )}
                                            </em>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                >
                    <h1 css={SS.projectProfileMetaH1}>{projectName}</h1>
                </Tooltip>
                <p css={SS.projectProfileMetaP}>
                    <span css={SS.projectProfileBySpan}>{"By "}</span>
                    <Tooltip title={authorTooltip} placement="right">
                        <Link
                            to={`/profile/${profileUserName}`}
                            css={SS.projectProfileLink}
                        >
                            {profileDisplayName}
                        </Link>
                    </Tooltip>
                </p>
            </div>
        </div>
    ) : (
        <></>
    );
};

export default ProjectProfileMeta;
