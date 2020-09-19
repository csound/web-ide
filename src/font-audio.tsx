import React from "react";
import { ReactComponent as FadPlay } from "./svgs/fad-play.svg";
import styled from "styled-components";

interface ISvgLogoContainer {
    size: number;
}

const SvgLogoContainer = styled.span<ISvgLogoContainer>`
    width: ${(properties) => properties.size}px;
    height: ${(properties) => properties.size}px;
    font-size: ${(properties) => Math.floor(properties.size * 0.75)}px;
    color: #fff;
    line-height: ${(properties) => properties.size}px;
    cursor: pointer;
    svg {
        width: ${(properties) => properties.size}px;
        height: ${(properties) => properties.size}px;
        display: inline-block;
    }
    svg g {
        transition: all 0.3s ease;
        width: 100%;
        height: 100%;
        display: block;
        position: absolute;
        left: 50%;
        top: 50%;
        margin: auto;
    }
`;

export function PlayIcon(properties: ISvgLogoContainer) {
    return (
        <SvgLogoContainer {...properties}>
            <FadPlay />
        </SvgLogoContainer>
    );
}
