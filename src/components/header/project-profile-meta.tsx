import React from "react";
import Moment from "react-moment";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectActiveProject } from "@comp/projects/selectors";
import { selectProjectLastModified } from "@comp/project-last-modified/selectors";
import {
    selectUserProfile,
    selectUserImageURL,
    selectProfileProjectsCount
} from "@comp/profile/selectors";
import ProjectAvatar from "@elem/project-avatar";
import { AccountBox } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import { IProject } from "@comp/projects/types";
import Tooltip from "@material-ui/core/Tooltip";
import * as SS from "./styles";
import { isEmpty, prop, propOr } from "ramda";

const ProjectProfileMeta = (): React.ReactElement => {
    const project: IProject | undefined = useSelector(selectActiveProject);
    const projectName = propOr("unnamed", "name", project || {});
    const projectDescription = propOr("", "description", project || {});

    const projectLastModified = useSelector(
        selectProjectLastModified(prop("projectUid", project || {}))
    );

    const projectLastModifiedDate =
        projectLastModified &&
        projectLastModified.timestamp &&
        projectLastModified.timestamp.toDate &&
        projectLastModified.timestamp.toDate();

    const projectOwnerUid = propOr("", "userUid", project || {});
    const profile = useSelector(selectUserProfile(projectOwnerUid));
    const profileUserName = propOr("", "username", profile || {});
    const profileDisplayName = propOr("", "displayName", profile || {});
    const profileImage = useSelector(selectUserImageURL(projectOwnerUid));
    const profileProjectsCount = useSelector(
        selectProfileProjectsCount(projectOwnerUid)
    );

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
                                <div>
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
                                                <Moment
                                                    style={{ marginLeft: 3 }}
                                                    date={
                                                        projectLastModifiedDate
                                                    }
                                                    fromNow
                                                />
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
