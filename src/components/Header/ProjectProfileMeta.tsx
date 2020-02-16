import React from "react";
// import Moment from "react-moment";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectActiveProject } from "@comp/Projects/selectors";
// import { selectProjectLastModified } from "@comp/ProjectLastModified/selectors";
import {
    selectUserProfile,
    selectUserImageURL,
    selectProfileProjectsCount
} from "@comp/Profile/selectors";
import ProjectIcon from "@comp/Profile/ProjectIcon";
import { AccountBox } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import Tooltip from "@material-ui/core/Tooltip";
import * as SS from "./styles";
import { isEmpty, propOr } from "ramda";

const ProjectProfileMeta = () => {
    const project = useSelector(selectActiveProject);
    const projectName = propOr("unnamed", "name", project || {});
    // const projectDescription = propOr(null, "description", project || {});
    /*
    const projectLastModified = useSelector(
        selectProjectLastModified(propOr(null, "projectUid", project || {}))
    );

    const projectLastModifiedDate =
        projectLastModified &&
        projectLastModified.timestamp &&
        projectLastModified.timestamp.toDate &&
        projectLastModified.timestamp.toDate();
*/
    const iconName = propOr(null, "iconName", project || {});
    const iconBackgroundColor = propOr(
        null,
        "iconBackgroundColor",
        project || {}
    );
    const iconForegroundColor = propOr(
        null,
        "iconForegroundColor",
        project || {}
    );
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
            <div css={SS.projectIcon}>
                <ProjectIcon
                    iconName={iconName}
                    iconBackgroundColor={iconBackgroundColor}
                    iconForegroundColor={iconForegroundColor}
                    onClick={() => {}}
                />
            </div>
            <div css={SS.projectProfileMetaTextContainer}>
                <h1 css={SS.projectProfileMetaH1}>{projectName}</h1>
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

// <div>
//     {projectLastModifiedDate && (
//         <p css={SS.projectProfileMetaP}>
//             Modified
//             <Moment
//                 style={{ marginLeft: 3 }}
//                 date={projectLastModifiedDate}
//                 fromNow
//             />
//         </p>
//     )}
// </div>

// {projectDescription && (
//     <p css={SS.projectProfileMetaP}>{projectDescription}</p>
// )}

export default ProjectProfileMeta;
