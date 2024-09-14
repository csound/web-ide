import styled from "@emotion/styled";
import {
    TabListStyle,
    ActionButtonStyle,
    TabStyle,
    PanelStyle
} from "@root/tabtab/index.js";
import { css, SerializedStyles, Theme } from "@emotion/react";
import { tabListHeight } from "@styles/constants";
import { _shadow } from "@styles/_common";
import { isMobile } from "@root/utils";

export const tabListStyle = (theme: Theme): SerializedStyles => css`
    & li::after {
        z-index: 0;
    }
    ${isMobile() ? "display: none;" : ""}

    & > div {
        height: 100%;
        position: relative;
    }
    & > div > div {
        height: 100%;
        position: absolute;
        width: 100%;
    }
    .tablist {
        width: 100%;
        height: 100%;
        z-index: 1;
        background-color: ${theme.background}!important;
        height: ${tabListHeight}px;
        box-shadow:
            0 2px 2px 0 rgba(0, 0, 0, 0.14),
            0 1px 5px 0 rgba(0, 0, 0, 0.12),
            0 3px 1px -2px rgba(0, 0, 0, 0.2);
    }
    .tablist > div {
        height: 100%;
    }

    .tablist > div > ul {
        height: 100%;
    }
    .tablist > div > ul > li {
        height: 100%;
    }
    .tablist > div > ul > li > span {
        margin: auto 0;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 12px;
    }
`;

const TabListStyleCustom = styled(TabListStyle)`
    z-index: 1;
    background-color: ${(properties) => properties.theme.background}!important;
    bottom: 0;
    box-shadow:
        0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2);

    & li::after {
        z-index: 0;
    }
    ${isMobile() ? "display: none;" : ""}

    .tablist {
        width: 100%;
        height: ${tabListHeight}px;
    }
    & > div {
        height: 100%;
    }
    & > div > ul {
        height: 100%;
    }
    & > div > ul > li {
        height: 100%;
    }
    & > div > ul > li > span {
        margin: auto 0;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 12px;
    }
`;

const TabStyleCustom = styled(TabStyle)`
    z-index: 1;
    position: relative;
    color: ${(properties: any) =>
        properties.active
            ? properties.theme.textColor
            : properties.theme.unfocusedTextColor};
    font-weight: ${(properties: any) => (properties.active ? 500 : 400)};
    background-color: ${(properties: any) =>
        properties.active
            ? properties.theme.highlightBackground
            : properties.theme.background};
    border: 0;
    font-size: 14px;
    padding: 0 !important;
    padding-right: 42px !important;
    padding-bottom: 2px !important;
    user-select: inherit;
    margin-bottom: -1px;
    &:hover {
        color: ${(properties) => properties.theme.textColor}!important;
        background-color: ${(properties: any) =>
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
        background-color: ${(properties: any) =>
            properties.active
                ? properties.theme.tabHighlightActive
                : properties.theme.tabHighlight};
    }

    p {
        user-select: none;
    }
`;

const ActionButtonStyleCustom = styled(ActionButtonStyle)`
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

const PanelStyleCustom = styled(PanelStyle)`
    width: 100%;
    height: 100%;
    //position: absolute !important;
    padding: 0 !important;
    padding-top: 38px !important;
    background-color: ${(properties) => properties.theme.background}!important;
    ${(properties: any) => (properties.isBottom ? bottomPanelStyle : "")};
`;

const TabStyles = (isBottom: boolean): Record<string, any> => ({
    TabList: (properties) => (
        <TabListStyleCustom {...properties} isBottom={isBottom} />
    ),
    ActionButton: (properties) => (
        <ActionButtonStyleCustom {...properties} isBottom={isBottom} />
    ),
    Tab: (properties) => <TabStyleCustom {...properties} isBottom={isBottom} />,
    Panel: (properties) => (
        <PanelStyleCustom {...properties} isBottom={isBottom} />
    )
});

export default TabStyles;
