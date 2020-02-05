import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import domToImage from "dom-to-image-more";
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
    color: ${props => props.theme.headerTextColor};
    line-height: ${props => props.size}px;
    text-align: center;
    font-weight: bold;
    background: ${props =>
        props.interactive ? "inherit" : props.theme.buttonBackground};
    ${props =>
        props.interactive && ":hover{background: #445; cursor: pointer;}"}
`;

export default (props: ILogoContainer) => {
    const containerRef = useRef(null);

    useEffect(() => {
        (async () => {
            if (containerRef.current !== null) {
                const faviconNode = document.getElementById("favicon");
                const result = await domToImage.toPng(containerRef.current);
                faviconNode?.setAttribute("href", result);
            }
        })();
    }, [containerRef]);
    return (
        <LogoContainer
            ref={containerRef}
            size={props.size}
            onClick={() => props.onClick && props.onClick()}
            interactive={props.interactive}
        >
            Cs
        </LogoContainer>
    );
};
