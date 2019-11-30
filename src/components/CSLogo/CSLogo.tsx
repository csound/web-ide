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
    color: #fff;
    line-height: ${props => props.size}px;
    text-align: center;
    font-weight: bold;
    ${props => !props.interactive && "background: #445;"}
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
