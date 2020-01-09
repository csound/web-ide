import styled from "styled-components";
import { styled as themeStyled } from "react-tabtab";

let { TabListStyle, ActionButtonStyle, TabStyle, PanelStyle } = themeStyled;

TabListStyle = styled(TabListStyle)`
    background-color: ${props => props.theme.background.primary};
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2);
    border: 0;
`;

TabStyle = styled(TabStyle)`
    position: relative;
    color: ${props =>
        props.active
            ? props.theme.color.primary
            : props.theme.highlight.primary};
    font-weight: ${props => (props.active ? 500 : 400)};
    background-color: ${props =>
        props.active
            ? props.theme.highlight.primary
            : props.theme.background.primary};
    border: 0;
    padding: 13px 19px;
    padding-right: 42px;
    margin-bottom: -1px;
    &:hover {
        color: ${props =>
            props.active
                ? props.theme.color.primary
                : props.theme.alternativeColor.primary};
        background-color: ${props =>
            props.active
                ? props.theme.highlight.primary
                : "rgba(0, 0, 0, 0.1)"};
    }
    &::after {
        z-index: 10;
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 3px;
        background: ${props =>
            props.active
                ? props.theme.tabHighlight.secondary
                : props.theme.tabHighlight.primary};
    }
    & > button {
        display: none;
    }

    & > button:hover {
        color: ${props =>
            props.active
                ? props.theme.color.primary
                : props.theme.color.primary};
        background-color: ${props =>
            props.active
                ? props.theme.highlightAlt.secondary
                : props.theme.highlightAlt.primary};
        border-radius: 50%;
    }

    &:hover::after {
        background: ${props => props.theme.tabHighlight.secondary};
    }
`;

ActionButtonStyle = styled(ActionButtonStyle)`
    background-color: transparent;
    border-radius: 0;
    &:hover {
        background-color: #eee;
    }
`;

PanelStyle = styled(PanelStyle)`
    width: 100%;
    height: 100%;
    position: absolute;
    padding: 0;
`;

export default {
    TabList: TabListStyle,
    ActionButton: ActionButtonStyle,
    Tab: TabStyle,
    Panel: PanelStyle
};
