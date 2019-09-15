import React from "react";
import styled from "styled-components";
interface ILogoContainer {
    size: number;
}
const LogoContainer = styled.div<ILogoContainer>`
    font-family: "Merriweather", serif;
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: ${props => props.size / 2}px;
    font-size: ${props => Math.floor(props.size * 0.75)}px;
    color: #fff;
    line-height: ${props => props.size}px;
    text-align: center;
    font-weight: bold;
    background: #445;
    grid-row: 2;
    grid-column: 2;
`;

export default (props: ILogoContainer) => {
    return <LogoContainer size={props.size}>cS</LogoContainer>;
};
