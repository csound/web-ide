import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import domToImage from "dom-to-image-more";
import { Link } from "react-router-dom";

interface ILogoContainer {
    size: number;
    interactive?: boolean;
}

const LogoContainer = styled.div<ILogoContainer>`
    font-family: ${(properties) => properties.theme.font.regular};
    display: inline-block;
    width: ${(properties) => properties.size}px;
    height: ${(properties) => properties.size}px;
    border-radius: ${(properties) => properties.size / 2}px;
    font-size: ${(properties) => Math.floor(properties.size * 0.75)}px;
    color: ${(properties) => properties.theme.headerTextColor};
    line-height: ${(properties) => properties.size}px;
    text-align: center;
    font-weight: bold;
    user-select: none;
    background: ${(properties) =>
        properties.interactive ? "inherit" : properties.theme.buttonBackground};
`;

export default function CsLogo(properties: ILogoContainer): React.ReactElement {
    const containerReference = useRef();

    useEffect(() => {
        (async () => {
            if (containerReference.current) {
                const faviconNode = document.querySelector("#favicon");
                const result = await domToImage.toPng(
                    containerReference.current,
                    {
                        style: {
                            backgroundColor: "#000000",
                            borderRadius: "50%"
                        }
                    }
                );
                faviconNode?.setAttribute("href", result);
            }
        })();
    }, [containerReference]);
    return (
        <Link to="/">
            <LogoContainer
                ref={containerReference as any}
                size={properties.size}
                interactive={properties.interactive}
            >
                Cs
            </LogoContainer>
        </Link>
    );
}
