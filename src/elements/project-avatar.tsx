import { IProject } from "@comp/projects/types";
import SVGComponents from "./svg-icons";
import { css, SerializedStyles } from "@emotion/react";
import { RandomProjectResponse } from "@root/components/home/types";

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
    iconName = "fadwaveform",
    iconBackgroundColor = "#000",
    iconForegroundColor = "#fff"
}: {
    iconName: string | undefined;
    iconBackgroundColor: string | undefined;
    iconForegroundColor: string | undefined;
}) => {
    const SVGIcon =
        (SVGComponents as any)[`${iconName}`] ||
        (SVGComponents as any)["fadwaveform"];

    return (
        <div
            className="project-avatar"
            css={avatarIconContainer}
            style={{
                backgroundColor: iconBackgroundColor
            }}
        >
            {SVGIcon && <SVGIcon css={avatarIcon(iconForegroundColor)} />}
        </div>
    );
};

export default ProjectAvatar;
