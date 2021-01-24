import React from "react";
import SVGPaths, { SVGComponents } from "./svg-paths";
import AssignmentIcon from "@material-ui/icons/Assignment";
import * as SS from "./styles";

const FallbackIcon = ({ fill }): React.ReactElement => (
    <AssignmentIcon style={{ height: 62, width: 62, fill }} />
);

const ProjectIcon = ({
    iconName,
    iconBackgroundColor,
    iconForegroundColor,
    onClick
}: {
    iconName: string;
    iconBackgroundColor: string;
    iconForegroundColor: string;
    onClick?: (event: any) => void;
}): React.ReactElement => {
    const IconComponent: React.ElementType =
        iconName && iconName !== "default" && SVGPaths[iconName]
            ? SVGComponents[`${iconName}Component`]
            : FallbackIcon;

    return (
        <div
            css={[
                SS.iconPreviewBox,
                SS.previewAvatarColor(iconForegroundColor || "#fff")
            ]}
            style={{ backgroundColor: iconBackgroundColor || "#000" }}
            {...(onClick ? { onClick } : {})}
        >
            <IconComponent width={"100%"} height={"100%"} />
        </div>
    );
};

export default ProjectIcon;
