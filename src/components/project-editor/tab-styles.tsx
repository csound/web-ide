import React from "react";
import styled from "styled-components";
import { styled as themeStyled } from "@hlolli/react-tabtab";
import { tabListHeight } from "@styles/constants";
import { _shadow } from "@styles/_common";
import { isMobile } from "@root/utils";
let { TabListStyle, ActionButtonStyle, TabStyle, PanelStyle } = themeStyled;

TabListStyle = styled(TabListStyle)`
    z-index: 1;
    background-color: ${(properties) => properties.theme.background};
    height: ${tabListHeight}px;
    bottom: 0;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2);

    & li::after {
        z-index: 0;
    }
    ${!isMobile() ? "" : "display: none;"}

    .tablist {
        width: 100%;
    }
`;

TabStyle = styled(TabStyle)`
    z-index: 1;
    position: relative;
    color: ${(properties) =>
        properties.active
            ? properties.theme.textColor
            : properties.theme.unfocusedTextColor};
    font-weight: ${(properties) => (properties.active ? 500 : 400)};
    background-color: ${(properties) =>
        properties.active
            ? properties.theme.highlightBackground
            : properties.theme.background};
    border: 0;
    padding: 13px 19px;
    padding-right: 42px;
    user-select: inherit;
    margin-bottom: -1px;
    &:hover {
        color: ${(properties) => properties.theme.textColor};
        background-color: ${(properties) =>
            properties.active
                ? properties.theme.highlightBackground
                : properties.theme.highlightBackgroundAlt};
    }
    &::after {
        z-index: 10;
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 3px;
        background-color: ${(properties) =>
            properties.active
                ? properties.theme.tabHighlightActive
                : properties.theme.tabHighlight};
    }
    & > button {
        display: none;
    }

    & > button:hover {
        color: ${(properties) => properties.theme.textColor};
        background-color: ${(properties) =>
            properties.active
                ? properties.theme.highlightBackgroundAlt
                : properties.theme.highlightBackground};
        border-radius: 50%;
    }
    p {
        user-select: none;
    }
`;

ActionButtonStyle = styled(ActionButtonStyle)`
    background-color: ${(properties) => properties.theme.gutterBackground};
    border: 2px solid ${(properties) => properties.theme.line};
    ${_shadow}
    border-radius: 0;
    border: none !important;
    z-index: 2;
    width: 42px;
    svg {
        fill: ${(properties) => properties.theme.textColor};
        width: 100%;
        height: 100%;
        padding: 0;
        z-index: 3;
    }
    svg:hover {
        background-color: ${(properties) => properties.theme.lineNumber};
    }
`;

const bottomPanelStyle = `
  position: relative;
`;

PanelStyle = styled(PanelStyle)`
    width: 100%;
    height: 100%;
    position: absolute;
    padding: 0;
    background-color: ${(properties) => properties.theme.background};
    ${(properties) => (properties.isBottom ? bottomPanelStyle : "")};
`;

export default (isBottom) => ({
    // eslint-disable-next-line react/display-name
    TabList: (properties) => (
        <TabListStyle {...properties} isBottom={isBottom} />
    ),
    // eslint-disable-next-line react/display-name
    ActionButton: (properties) => (
        <ActionButtonStyle {...properties} isBottom={isBottom} />
    ),
    // eslint-disable-next-line react/display-name
    Tab: (properties) => <TabStyle {...properties} isBottom={isBottom} />,
    // eslint-disable-next-line react/display-name
    Panel: (properties) => <PanelStyle {...properties} isBottom={isBottom} />
});
