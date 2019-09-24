import React from "react";
import { css, CSSObject } from "styled-components";

interface IGradient {
    colorA: string;
    colorB: string;
    colorC: string;
}

export const Gradient = css<IGradient>`
    background-color: ${props => props.colorB};
    background-image: linear-gradient(
            30deg,
            ${props => props.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${props => props.colorA} 87.5%,
            ${props => props.colorA}
        ),
        linear-gradient(
            150deg,
            ${props => props.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${props => props.colorA} 87.5%,
            ${props => props.colorA}
        ),
        linear-gradient(
            30deg,
            ${props => props.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${props => props.colorA} 87.5%,
            ${props => props.colorA}
        ),
        linear-gradient(
            150deg,
            ${props => props.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${props => props.colorA} 87.5%,
            ${props => props.colorA}
        ),
        linear-gradient(
            60deg,
            ${props => props.colorC} 25%,
            transparent 25.5%,
            transparent 75%,
            ${props => props.colorC} 75%,
            ${props => props.colorC}
        ),
        linear-gradient(
            60deg,
            ${props => props.colorC} 25%,
            transparent 25.5%,
            transparent 75%,
            ${props => props.colorC} 75%,
            ${props => props.colorC}
        );
    background-size: 80px 140px;
    background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
`;
