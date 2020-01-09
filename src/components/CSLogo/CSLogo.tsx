import React from "react";
import styled from "styled-components";
interface ILogoContainer {
    size: number;
    interactive?: boolean;
    onClick?: any;
}
const LogoContainer = styled.div<ILogoContainer>`
    font-family: "Merriweather", serif;
    display: inline-block;
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: ${props => props.size / 2}px;
    font-size: ${props => Math.floor(props.size * 0.75)}px;
    color: ${props => props.theme.color.primary};
    line-height: ${props => props.size}px;
    text-align: center;
    font-weight: bold;
    background: ${props =>
        props.interactive ? "inherit" : props.theme.highlight.primary};
    ${props =>
        props.interactive && ":hover{background: #445; cursor: pointer;}"}
`;

export default (props: ILogoContainer) => {
    return (
        <LogoContainer
            size={props.size}
            onClick={() => props.onClick && props.onClick()}
            interactive={props.interactive}
        >
            cS
        </LogoContainer>
    );
};
