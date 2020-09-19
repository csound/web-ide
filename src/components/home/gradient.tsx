import { css } from "styled-components";

interface IGradient {
    colorA: string;
    colorB: string;
    colorC: string;
}

export const Gradient = css<IGradient>`
    background-color: ${(properties) => properties.colorB};
    background-image: linear-gradient(
            30deg,
            ${(properties) => properties.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${(properties) => properties.colorA} 87.5%,
            ${(properties) => properties.colorA}
        ),
        linear-gradient(
            150deg,
            ${(properties) => properties.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${(properties) => properties.colorA} 87.5%,
            ${(properties) => properties.colorA}
        ),
        linear-gradient(
            30deg,
            ${(properties) => properties.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${(properties) => properties.colorA} 87.5%,
            ${(properties) => properties.colorA}
        ),
        linear-gradient(
            150deg,
            ${(properties) => properties.colorA} 12%,
            transparent 12.5%,
            transparent 87%,
            ${(properties) => properties.colorA} 87.5%,
            ${(properties) => properties.colorA}
        ),
        linear-gradient(
            60deg,
            ${(properties) => properties.colorC} 25%,
            transparent 25.5%,
            transparent 75%,
            ${(properties) => properties.colorC} 75%,
            ${(properties) => properties.colorC}
        ),
        linear-gradient(
            60deg,
            ${(properties) => properties.colorC} 25%,
            transparent 25.5%,
            transparent 75%,
            ${(properties) => properties.colorC} 75%,
            ${(properties) => properties.colorC}
        );
    background-size: 80px 140px;
    background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
`;
