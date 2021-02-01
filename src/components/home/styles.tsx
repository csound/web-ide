import { css, SerializedStyles, Theme } from "@emotion/react";
import { topInnerShadow, bottomInnerShadow } from "@styles/_common";

export const homeHeading = css`
    position: relative;
    left: 0;
    top: 0;
    height: 40px;
`;

export const homePageHeading = (theme: Theme): SerializedStyles => css`
    position: absolute;
    bottom: -6px;
    font-family: ${theme.font.regular};
    font-size: 24px;
    color: ${theme.textColor};
    font-weight: 500;
    line-height: 1.43;
    letter-spacing: 0.01071em;
`;

export const homePageHeadingBreak = (theme: Theme): SerializedStyles => css`
    position: absolute;
    background-color: ${theme.textColor};
    height: 2px;
    width: 100%;
    bottom: 0;
`;

export const paginationButton = (isActive: boolean) => (
    theme: Theme
): SerializedStyles => css`
    position: absolute;
    right: 0;
    bottom: 6px;
    svg {
        fill: ${isActive ? theme.textColor : "inherit"}!important;
    }
`;

export const cardBackground = css`
    position: absolute;
    opacity: 0.5;
    width: 100%;
    height: 100%;
    ${topInnerShadow}
    ${bottomInnerShadow}
`;

export const doubleGridContainer = css`
    margin-top: 12px;
    display: grid;
    align-items: center;
    min-height: 190px;
    width: calc(100% + 12px);

    grid-template-columns: 1fr 1fr 1fr 1fr;
    & > div {
        position: relative;
        margin-right: 12px;
        margin-bottom: 12px;
    }

    @media (max-width: 1200px) {
        grid-template-columns: 1fr 1fr 1fr;
    }

    @media (max-width: 1000px) {
        grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const cardLoderSkeleton = css`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #010101;
    height: 180px;
    opacity: 0.7;
    position: relative;
    ${topInnerShadow}
    ${bottomInnerShadow}
    & > .skeleton-photo {
        position: absolute;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        bottom: 3px;
        left: 5px;
        background-color: #202020;
    }
    & > .skeleton-name {
        position: absolute;
        width: 25%;
        height: 12px;
        border-radius: 2px;
        bottom: 32px;
        left: 68px;
        background-color: #202020;
    }
    & > .skeleton-description {
        position: absolute;
        width: 50%;
        height: 12px;
        border-radius: 2px;
        bottom: 12px;
        left: 68px;
        background-color: #202020;
    }
`;

export const searchField = (theme: Theme): SerializedStyles => css`
    margin-top: 12px;
    margin-bottom: 24px;
    background-color: ${theme.textFieldBackground};
    opacity: 0.7;

    input:focus {
        & .MuiFormControl-root {
            opacity: 1 !important;
        }
    }
`;

export const searchLoaderSpinner = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
`;
