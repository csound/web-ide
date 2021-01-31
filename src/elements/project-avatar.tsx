import React from "react";
import { IProject } from "@comp/projects/types";
import { SVGComponents } from "./svg-icons";
import { css, SerializedStyles } from "@emotion/react";

export const avatarIconForeground = (
    foregroundColor: string
): SerializedStyles => css`
    & path {
        fill: ${foregroundColor};
    }
    & path:first-of-type {
        fill: black;
    }
    & path:last-of-type {
        fill: ${foregroundColor};
    }
`;

const avatarIcon = (foregroundColor: string): SerializedStyles => css`
    width: calc(100% - 32px);
    height: calc(100% - 32px);
    ${avatarIconForeground(foregroundColor)}
`;

const avatarIconContainer = css`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    height: 100%;
    width: 100%;
`;

const ProjectAvatar = ({
    project
}: {
    project: IProject;
}): React.ReactElement => {
    const iconName =
        project.iconName === "" ||
        !project.iconName ||
        typeof project.iconName === "undefined" ||
        project.iconName === "default"
            ? "fadwaveform"
            : project.iconName;

    const SVGIcon = SVGComponents[`${iconName}Component`];
    return (
        <div
            className="project-avatar"
            css={avatarIconContainer}
            style={{
                backgroundColor: project.iconBackgroundColor || "#000"
            }}
        >
            <SVGIcon css={avatarIcon(project.iconForegroundColor || "#fff")} />
        </div>
    );
};

export default ProjectAvatar;
