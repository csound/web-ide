import React from "react";
import Moment from "react-moment";
import { useSelector } from "react-redux";
import { selectActiveProject } from "@comp/Projects/selectors";
import { selectProjectLastModified } from "@comp/ProjectLastModified/selectors";
import ProjectIcon from "@comp/Profile/ProjectIcon";
import * as SS from "./styles";
import { propOr } from "ramda";

const ProjectProfileMeta = () => {
    const project = useSelector(selectActiveProject);
    const projectName = propOr("unnamed", "name", project || {});
    // const projectDescription = propOr(null, "description", project || {});
    const projectLastModified = useSelector(
        selectProjectLastModified(propOr(null, "projectUid", project || {}))
    );
    const projectLastModifiedDate =
        projectLastModified &&
        projectLastModified.timestamp &&
        projectLastModified.timestamp.toDate &&
        projectLastModified.timestamp.toDate();

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
    // projectLastModified && console.log(projectLastModified.timestamp.toDate);
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
                <div>
                    {projectLastModifiedDate && (
                        <p css={SS.projectProfileMetaP}>
                            Modified
                            <Moment
                                style={{ marginLeft: 3 }}
                                date={projectLastModifiedDate}
                                fromNow
                            />
                        </p>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <></>
    );
};

// {projectDescription && (
//     <p css={SS.projectProfileMetaP}>{projectDescription}</p>
// )}

export default ProjectProfileMeta;
