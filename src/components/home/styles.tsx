import { css, SerializedStyles, Theme } from "@emotion/react";
import { topInnerShadow, bottomInnerShadow } from "@styles/_common";
import { pageMaxWidth } from "@styles/constants";

export const homeContent = css`
    max-width: ${pageMaxWidth}px;
    margin: 0 auto;
    padding: 32px 24px 48px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    @media (max-width: 767px) {
        padding: 24px 16px 32px;
        gap: 28px;
    }
`;

export const communityColumns = css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px;
    align-items: start;
    @media (max-width: 767px) {
        grid-template-columns: minmax(0, 1fr);
        gap: 28px;
    }
`;

export const homeHeading = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 40px;
    margin-bottom: 16px;
`;

export const homeActions = css`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
`;

export const homeCreateButton = (theme: Theme): SerializedStyles => css`
    padding: 8px 12px;
    min-height: 40px;
    border: 1px solid ${theme.line};
    border-radius: 6px;
    background: ${theme.buttonBackground};
    color: ${theme.buttonTextColor};
    font-weight: 600;
    white-space: nowrap;
    &:hover {
        background: ${theme.buttonBackgroundHover};
    }
`;

export const homePageHeading = (theme: Theme): SerializedStyles => css`
    margin: 0;
    font-family: ${theme.font.regular};
    font-size: 22px;
    color: ${theme.textColor};
    font-weight: 600;
    line-height: 1.4;
    @media (max-width: 767px) {
        font-size: 20px;
    }
`;

export const paginationButton =
    (isActive: boolean) =>
    (theme: Theme): SerializedStyles => css`
        flex-shrink: 0;
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
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    & > div {
        min-width: 0;
    }
    @media (max-width: 1023px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 767px) {
        grid-template-columns: minmax(0, 1fr);
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
    width: 100%;
    background-color: ${theme.textFieldBackground};
    border-radius: 6px;
    .MuiOutlinedInput-notchedOutline {
        border-color: ${theme.lineNumber};
    }
    input::placeholder {
        color: ${theme.altTextColor};
        opacity: 1;
    }
`;

export const searchResults = css`
    margin-top: 16px;
`;

export const shuffleButton = (theme: Theme): SerializedStyles => css`
    color: ${theme.textColor};
    flex-shrink: 0;
`;

export const rankingSection = css`
    min-width: 0;
`;

export const rankingHeading = css`
    min-height: 72px;
`;

export const artistBoardSubheading = (theme: Theme): SerializedStyles => css`
    margin: 6px 0 16px;
    color: ${theme.altTextColor};
    font-size: 13px;
    line-height: 1.5;
`;

export const artistBoard = (theme: Theme): SerializedStyles => css`
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid ${theme.line};
`;

export const artistBoardRow = (theme: Theme): SerializedStyles => css`
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 72px;
    padding: 12px 0;
    border-bottom: 1px solid ${theme.line};
    @media (max-width: 1023px) {
        gap: 8px;
        grid-template-columns: 24px minmax(0, 1fr) auto;
    }
`;

export const artistBoardRowSkeleton = (theme: Theme): SerializedStyles => css`
    ${artistBoardRow(theme)}
    grid-template-columns: 28px minmax(0, 1fr) 40px;
    span {
        height: 16px;
        border-radius: 4px;
        background: ${theme.highlightBackgroundAlt};
    }
    span:nth-of-type(2) {
        width: 70%;
        height: 36px;
    }
`;

export const artistBoardEmptyState = (theme: Theme): SerializedStyles => css`
    margin: 0;
    padding: 24px 0;
    border-top: 1px solid ${theme.line};
    color: ${theme.altTextColor};
    font-size: 13px;
    p {
        margin: 0 0 8px;
    }
`;

export const artistRank = (theme: Theme): SerializedStyles => css`
    color: ${theme.altTextColor};
    font-size: 12px;
    font-variant-numeric: tabular-nums;
`;

export const projectArtwork = (theme: Theme): SerializedStyles => css`
    position: relative;
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid ${theme.line};
    svg {
        width: 26px;
        height: 26px;
    }
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
    gap: 2px;
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
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    white-space: nowrap;
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

export const rankingLink = (theme: Theme): SerializedStyles => css`
    ${artistDisplayName(theme)}
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;

export const rankingAuthor = (theme: Theme): SerializedStyles => css`
    ${artistUsername(theme)}
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;
