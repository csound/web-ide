import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

const MOBILE_BP = "(max-width: 760px)";

export const ProfileContainer = styled.div`
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 224px minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    align-items: start;
    gap: 20px 24px;
    padding: 24px;
    @media ${MOBILE_BP} {
        grid-template-columns: 80px minmax(0, 1fr);
        gap: 16px;
        padding: 16px;
    }
`;
export const IDContainer = styled(Card)`
    grid-row: 1 / 3;
    grid-column: 1;
    display: flex;
    flex-direction: column;
    box-shadow: none;
    border: 1px solid ${(properties) => properties.theme.line};
    min-width: 0;
    @media ${MOBILE_BP} {
        grid-row: 1;
        border: 0;
        background: transparent;
    }
`;

export const MobileAboutSection = styled.div`
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const DescriptionSection = styled.div`
    grid-row: ${(properties: { gridRow: string }) => properties.gridRow};
    grid-column: 1;
    padding: 16px;
    overflow-wrap: anywhere;
    a > div {
        font-size: 14px;
        line-height: 1.5;
        text-decoration: underline;
    }
`;

export const EditProfileButtonSection = styled.div`
    grid-row: 4;
    grid-column: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 16px 16px;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
`;

export const ProfilePictureContainer = styled.div`
    position: relative;
    grid-row: 1;
    grid-column: 1;
    width: 160px;
    height: 160px;
    margin: 20px auto 4px;
    border-radius: 8px;
    overflow: hidden;
    @media ${MOBILE_BP} {
        width: 80px;
        height: 80px;
        margin: 0;
    }
`;

export const ProfilePictureDiv = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    background: ${(properties) => properties.theme.highlightBackground};
    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
        width: 50%;
        height: 50%;
        color: ${(properties) => properties.theme.altTextColor};
    }
    img {
        object-fit: cover;
    }
`;

interface IUploadProfilePicture {
    imageHover: boolean;
}

export const UploadProfilePicture = styled.button<IUploadProfilePicture>`
    width: 100%;
    height: 48px;
    border: 0;
    padding: 4px;
    font: inherit;
    &:focus-visible {
        opacity: 1;
        outline: 2px solid white;
        outline-offset: -3px;
    }
    bottom: 0px;
    position: absolute;
    z-index: 2;
    background-color: #0000005c;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr;
    cursor: pointer;
    transition: opacity 0.3s linear;
    opacity: ${(properties) => (properties.imageHover ? 1 : 0)};
    @media (hover: none), (max-width: 760px) {
        opacity: 1;
    }
    @media ${MOBILE_BP} {
        height: 40px;
        grid-template-rows: 1fr;
    }
`;

export const UploadProfilePictureText = styled.span`
    font-size: 12px;
    @media ${MOBILE_BP} {
        display: none;
    }
    text-align: center;
    font-weight: bold;
    color: white;
    padding-top: 3px;
    grid-row: 1;
    grid-column: 1;
`;
export const UploadProfilePictureIcon = styled.span`
    grid-row: 2;
    @media ${MOBILE_BP} {
        grid-row: 1;
    }
    grid-column: 1;
    align-content: center;
    color: white;
    margin-left: auto;
    margin-right: auto;
`;
export const ProfilePicture = styled.img`
    object-fit: cover;
`;
export const NameSectionWrapper = styled.div`
    grid-row: 1;
    grid-column: 2;
    align-self: center;
    min-width: 0;
`;
export const NameSection = styled.div`
    color: ${(properties) => properties.theme.textColor};
    overflow-wrap: anywhere;
`;
export const ContentSection = styled.div`
    grid-row: 2;
    grid-column: 2;
    background: ${(properties) => properties.theme.background};
    border: 1px solid ${(properties) => properties.theme.line};
    border-radius: 4px;
    min-width: 0;
    overflow: hidden;
    @media ${MOBILE_BP} {
        grid-column: 1 / -1;
    }
`;
export const ContentTabsContainer = styled.div`
    border-bottom: 1px solid ${(properties) => properties.theme.line};
    & .MuiTabs-root button {
        min-width: 96px !important;
        padding: 12px 16px;
    }
`;
export const contentActionsStyle = css`
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 20px 16px 12px;
    & > .MuiTextField-root {
        flex: 1;
        min-width: 0;
        max-width: 420px;
    }
    & > button {
        flex-shrink: 0;
        margin-left: auto;
        min-height: 40px;
    }
`;

export const ListContainer = styled.div`
    padding-top: 8px;
    padding-bottom: 16px;
    grid-row: 3;
    grid-column: 1;
    width: 100%;
    box-sizing: border-box;
    & > ul {
        padding: 0 !important;
        width: 100%;
        box-sizing: border-box;
    }
    .MuiListItem-root,
    .MuiListItemButton-root {
        padding: 12px 16px !important;
    }
`;

export const StyledChip = styled(Chip)`
    && {
        margin: 3px;
    }
`;
interface IStyledListItemContainer {
    isProfileOwner: boolean;
}
export const StyledListItemContainer = styled.div<IStyledListItemContainer>`
    display: grid;
    grid-auto-rows: minmax(10px, auto);
    grid-template-columns: 82px 8fr 70px ${(properties) =>
            properties.isProfileOwner ? "70px" : ""};
    min-width: 70px;
    padding-bottom: 2px;
    &:last-of-type {
        margin-bottom: 12px;
    }
`;

export const StyledUserListItemContainer = styled.div`
    display: flex;
    justify-content: left;
    width: 100%;
    height: 100%;
    min-height: 64px;
    padding-bottom: 2px;
`;

export const StyledListItemAvatar = styled.div`
    display: flex;
    align-items: center;
    align-self: center;
    margin-right: 16px;
    flex-shrink: 0;
    & > div {
        align-self: center;
        width: 44px;
        height: 44px;
    }
`;
export const StyledListItemTopRowText = styled.div`
    min-width: 0;
    overflow-wrap: anywhere;
    grid-row: 1;
    grid-column: 2;
    text-align: left;
    & p {
        white-space: pre-line;
        padding-right: 8px;
        padding-top: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;
export const StyledListItemChipsRow = styled.div`
    margin-top: 12px;
    grid-row: 2;
    grid-column-start: 2;
    grid-column-end: 4;
    min-width: 140px;
`;
export const StyledListPlayButtonContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 120px;
    display: flex;
    justify-content: center;
    pointer-events: none;
`;
export const StyledListButtonsContainer = styled.div`
    position: absolute;
    top: 0;
    right: 12px;
    margin: auto 0;
    height: 100%;
    max-height: 90px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    & button {
        width: 100%;
        align-self: center;
        margin-top: 8px;
    }
`;

export const StyledListStarButtonContainer = styled.div`
    grid-row-start: 2;
    grid-row-end: 3;
    grid-column-start: 1;
    grid-column-end: 2;
    margin: auto;
    width: 50%;
    padding-left: 4px;
`;

export const fabButton = css`
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: space-between;
`;

export const profileActionButton = css`
    width: 100%;
    justify-content: flex-start;
`;

export const mobileNavigationContainer = (theme: any) => css`
    background-color: ${theme.headerBackground};
    position: fixed;
    width: 100%;
    padding-bottom: env(safe-area-inset-bottom);
    box-sizing: content-box;
    bottom: 0;
    left: 0;
    z-index: 10;
    border-top: 1px solid;
`;

export const mobileNavigationButton = (theme: any) => css`
    min-width: 0;
    padding: 6px 2px;
    & .MuiBottomNavigationAction-label {
        font-size: 11px;
    }
    & .MuiBottomNavigationAction-label.Mui-selected {
        font-size: 12px;
    }
    & svg {
        font-size: 24px;
    }
    color: ${theme.headerTextColor};
`;

export const profileMobileBottomSpacer = css`
    grid-column: 1 / -1;
    height: calc(56px + env(safe-area-inset-bottom));
`;
