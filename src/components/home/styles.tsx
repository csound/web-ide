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

export const shuffleButton = (theme: Theme): SerializedStyles => css`
    position: absolute;
    right: 0;
    bottom: 6px;
    svg {
        fill: ${theme.textColor} !important;
    }
`;

export const artistBoardSubheading = (theme: Theme): SerializedStyles => css`
    margin-top: 12px;
    margin-bottom: 8px;
    color: ${theme.altTextColor};
    font-size: 13px;
    letter-spacing: 0.02em;
`;

export const artistBoard = (theme: Theme): SerializedStyles => css`
    margin-bottom: 18px;
    border: 1px solid ${theme.line};
    background: linear-gradient(
        180deg,
        ${theme.highlightBackgroundAlt},
        ${theme.highlightBackground}
    );
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%);
`;

export const artistBoardRow = (theme: Theme): SerializedStyles => css`
    display: grid;
    grid-template-columns: 66px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid ${theme.line};
    background: rgb(0 0 0 / 4%);
    &:last-of-type {
        border-bottom: none;
    }
`;

export const artistBoardRowSkeleton = (theme: Theme): SerializedStyles => css`
    height: 54px;
    border-bottom: 1px solid ${theme.line};
    background: linear-gradient(
        90deg,
        ${theme.highlightBackgroundAlt},
        ${theme.highlightBackground},
        ${theme.highlightBackgroundAlt}
    );
    &:last-of-type {
        border-bottom: none;
    }
`;

export const artistBoardEmptyState = (theme: Theme): SerializedStyles => css`
    padding: 14px 12px;
    color: ${theme.altTextColor};
    font-size: 13px;
`;

export const artistRankChip =
    (accentColor?: string) =>
    (theme: Theme): SerializedStyles => css`
        width: 54px;
        text-align: center;
        padding: 8px 0;
        font-size: 13px;
        font-weight: 700;
        color: ${theme.textColor};
        border: 1px solid ${accentColor || theme.line};
        background: ${theme.highlightBackground};
    `;

export const artistIdentity = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    text-decoration: none;
    color: ${theme.textColor};
    &:hover {
        color: ${theme.textColor};
    }
`;

export const artistIdentityStatic = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    color: ${theme.textColor};
`;

export const artistAvatarShell = (theme: Theme): SerializedStyles => css`
    position: relative;
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 50%;
    border: 1px solid ${theme.line};
    background: linear-gradient(
        135deg,
        ${theme.highlightBackgroundAlt},
        ${theme.highlightBackground}
    );
    overflow: hidden;
`;

export const artistAvatarFallback = (theme: Theme): SerializedStyles => css`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${theme.altTextColor};
    font-size: 12px;
    font-weight: 700;
`;

export const artistAvatarImage = css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

export const artistNameGroup = css`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

export const artistDisplayName = (theme: Theme): SerializedStyles => css`
    color: ${theme.textColor};
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;

export const artistUsername = (theme: Theme): SerializedStyles => css`
    color: ${theme.altTextColor};
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;

export const artistStats = css`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const artistStat = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${theme.textColor};
    font-weight: 600;
    font-size: 13px;
    svg {
        font-size: 16px;
    }
`;

export const artistStatMuted = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${theme.altTextColor};
    font-size: 12px;
    svg {
        font-size: 15px;
    }
`;
