import { css, SerializedStyles } from "@emotion/react";

interface IGradient {
    colorA: string;
    colorB: string;
    colorC: string;
}

export const Gradient = (properties: IGradient): SerializedStyles => css`
    background-color: ${properties.colorB};
    &:after {
        content: " ";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1;
        background-image: linear-gradient(
                30deg,
                ${properties.colorA} 12%,
                transparent 12.5%,
                transparent 87%,
                ${properties.colorA} 87.5%,
                ${properties.colorA}
            ),
            linear-gradient(
                150deg,
                ${properties.colorA} 12%,
                transparent 12.5%,
                transparent 87%,
                ${properties.colorA} 87.5%,
                ${properties.colorA}
            ),
            linear-gradient(
                30deg,
                ${properties.colorA} 12%,
                transparent 12.5%,
                transparent 87%,
                ${properties.colorA} 87.5%,
                ${properties.colorA}
            ),
            linear-gradient(
                150deg,
                ${properties.colorA} 12%,
                transparent 12.5%,
                transparent 87%,
                ${properties.colorA} 87.5%,
                ${properties.colorA}
            ),
            linear-gradient(
                60deg,
                ${properties.colorC} 25%,
                transparent 25.5%,
                transparent 75%,
                ${properties.colorC} 75%,
                ${properties.colorC}
            ),
            linear-gradient(
                60deg,
                ${properties.colorC} 25%,
                transparent 25.5%,
                transparent 75%,
                ${properties.colorC} 75%,
                ${properties.colorC}
            );
        background-size: 80px 140px;
        background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
    }
`;
