import React from "react";
import { ReactComponent as FadPlay } from "./svgs/fad-play.svg";
import styled from "styled-components";

interface ISvgLogoContainer {
    size: number;
}

const SvgLogoContainer = styled.span<ISvgLogoContainer>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    font-size: ${props => Math.floor(props.size * 0.75)}px;
    color: #fff;
    line-height: ${props => props.size}px;
    cursor: pointer;
    svg {
        width: ${props => props.size}px;
        height: ${props => props.size}px;
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

export function PlayIcon(props: ISvgLogoContainer) {
    return (
        <SvgLogoContainer {...props}>
            <FadPlay />
        </SvgLogoContainer>
    );
}
