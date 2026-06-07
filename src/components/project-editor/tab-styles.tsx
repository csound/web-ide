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
    height: 100%;
    width: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;

    & li::after {
        z-index: 0;
    }
    ${isMobile() ? "display: none;" : ""}

    & > div {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }
    & > div > div {
        width: 100%;
    }
    & > div > div:nth-of-type(2) {
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
    }
    .tablist {
        width: 100%;
        flex: 1 1 auto;
        min-width: 0;
        z-index: 1;
        position: relative;
        display: flex;
        align-items: stretch;
        background-color: transparent;
        height: 100%;
        box-shadow: none;
        white-space: nowrap;
        overflow: hidden;
    }

    .tablist > li {
        height: 100%;
        flex: 1 1 180px;
        min-width: 0;
        max-width: 220px;
    }
    .tablist > li > span {
        margin: 0;
        height: 100%;
        width: 100%;
        min-width: 0;
        display: flex;
        align-items: center;
    }
`;

const TabListStyleCustom = styled(TabListStyle)`
    z-index: 1;
    background-color: ${(properties) =>
        properties.theme.highlightBackgroundAlt}!important;
    bottom: 0;
    box-shadow: 0 10px 12px -12px rgba(0, 0, 0, 0.65);
    position: relative;
    width: 100%;
    min-width: 0;

    & li::after {
        z-index: 0;
    }
    ${isMobile() ? "display: none;" : ""}

    .tablist {
        width: 100%;
        height: ${tabListHeight}px;
        background-color: ${(properties) =>
            properties.theme.highlightBackgroundAlt}!important;
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
            ? properties.theme.highlightBackgroundAlt
            : "transparent"};
    border: 0;
    font-size: 12px;
    padding: 0 !important;
    padding-right: ${(properties: any) =>
        properties.closable ? "24px" : "10px"} !important;
    padding-left: 10px !important;
    height: 100%;
    user-select: inherit;
    min-width: 0;
    overflow: hidden;
    &:hover {
        color: ${(properties) => properties.theme.textColor}!important;
        background-color: ${(properties: any) =>
            properties.active
                ? properties.theme.highlightBackground
                : properties.theme.highlightBackground};
    }
    &::after {
        content: none;
    }

    p {
        user-select: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
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
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
    background-color: ${(properties) => properties.theme.background}!important;
    ${(properties: any) => (properties.isBottom ? bottomPanelStyle : "")};
`;

const TabStyles = (isBottom: boolean): Record<string, any> => ({
    TabList: (properties: any) => (
        <TabListStyleCustom {...properties} isBottom={isBottom} />
    ),
    ActionButton: (properties: any) => (
        <ActionButtonStyleCustom {...properties} isBottom={isBottom} />
    ),
    Tab: (properties: any) => (
        <TabStyleCustom {...properties} isBottom={isBottom} />
    ),
    Panel: (properties: any) => (
        <PanelStyleCustom {...properties} isBottom={isBottom} />
    )
});

export default TabStyles;
