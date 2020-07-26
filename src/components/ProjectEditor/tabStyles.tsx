import React from "react";
import styled from "styled-components";
import { styled as themeStyled } from "react-tabtab";
import { tabListHeight } from "@styles/constants";
import { _shadow } from "@styles/_common";
import { isMobile } from "@root/utils";
let { TabListStyle, ActionButtonStyle, TabStyle, PanelStyle } = themeStyled;

TabListStyle = styled(TabListStyle)`
    z-index: 1;
    background-color: ${props => props.theme.background};
    height: ${tabListHeight}px;
    bottom: 0;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2);

    & li::after {
        z-index: 0;
    }
    ${!isMobile() ? "" : "display: none;"}
`;

TabStyle = styled(TabStyle)`
    position: relative;
    color: ${props =>
        props.active ? props.theme.textColor : props.theme.unfocusedTextColor};
    font-weight: ${props => (props.active ? 500 : 400)};
    background-color: ${props =>
        props.active
            ? props.theme.highlightBackground
            : props.theme.background};
    border: 0;
    padding: 13px 19px;
    padding-right: 42px;
    margin-bottom: -1px;
    &:hover {
        color: ${props => props.theme.textColor};
        background-color: ${props =>
            props.active
                ? props.theme.highlightBackground
                : props.theme.highlightBackgroundAlt};
    }
    &::after {
        z-index: 10;
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 3px;
        background-color: ${props =>
            props.active
                ? props.theme.tabHighlightActive
                : props.theme.tabHighlight};
    }
    & > button {
        display: none;
    }

    & > button:hover {
        color: ${props => props.theme.textColor};
        background-color: ${props =>
            props.active
                ? props.theme.highlightBackgroundAlt
                : props.theme.highlightBackground};
        border-radius: 50%;
    }
`;

ActionButtonStyle = styled(ActionButtonStyle)`
    background-color: ${props => props.theme.gutterBackground};
    border: 2px solid ${props => props.theme.line};
    ${_shadow}
    border-radius: 0;
    border: none !important;
    z-index: 2;
    width: 42px;
    svg {
        fill: ${props => props.theme.textColor};
        width: 100%;
        height: 100%
        padding: 0;
    }
    svg:hover {
        background-color: ${props => props.theme.lineNumber};
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
    background-color: ${props => props.theme.background};
    ${props => (props.isBottom ? bottomPanelStyle : "")};
`;

export default isBottom => ({
    TabList: props => <TabListStyle {...props} isBottom={isBottom} />,
    ActionButton: props => <ActionButtonStyle {...props} isBottom={isBottom} />,
    Tab: props => <TabStyle {...props} isBottom={isBottom} />,
    Panel: props => <PanelStyle {...props} isBottom={isBottom} />
});
