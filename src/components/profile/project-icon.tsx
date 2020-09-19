import React from "react";
import SVGPaths, { SVGComponents } from "./svg-paths";
import AssignmentIcon from "@material-ui/icons/Assignment";
import * as SS from "./styles";

const FallbackIcon = ({ fill }) => (
    <AssignmentIcon style={{ height: 62, width: 62, fill }} />
);

const ProjectIcon = ({
    iconName,
    iconBackgroundColor,
    iconForegroundColor,
    onClick
}) => {
    let IconComponent: React.ElementType = SVGComponents[`fadADRComponent`];
    if (iconName && iconName !== "default" && SVGPaths[iconName]) {
        IconComponent = SVGComponents[`${iconName}Component`];
    } else {
        IconComponent = FallbackIcon;
    }

    return (
        <div
            css={[
                SS.iconPreviewBox,
                SS.previewAvatarColor(iconForegroundColor || "#fff")
            ]}
            style={{ backgroundColor: iconBackgroundColor || "#000" }}
            onClick={onClick ? onClick : () => {}}
        >
            <IconComponent width={"100%"} height={"100%"} />
        </div>
    );
};

export default ProjectIcon;
