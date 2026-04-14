import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { isMobile } from "@root/utils";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

export const ProfileContainer = styled.div`
    ${isMobile()
        ? `padding: 16px;
    box-sizing: border-box;`
        : `display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 120px auto;
    grid-auto-rows: auto;
    align-items: start;
    padding: 24px;`}
    width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
`;
export const IDContainer = styled(Card)`
    grid-row: 1 / -1;
    grid-column: 1 / 2;
    display: grid;
    grid-template-rows: 250px 1fr auto auto;
    grid-template-columns: 1fr;
    z-index: 2;
    min-height: 420px;
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    & > div {
        max-width: 250px;
    }
    overflow: hidden;
    align-self: stretch;
    position: sticky;
    top: 70px;
    max-height: calc(100vh - 80px);
`;

export const MobileAboutSection = styled.div`
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const DescriptionSection = styled.div`
    grid-row: ${(properties: { gridRow: string }) => properties.gridRow};
    grid-column: 1;
    padding: 16px;
    overflow-y: auto;
    div,
    a,
    h1,
    h2 {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    a > div {
        font-weight: 300;
        font-size: 14px;
        line-height: 1.5;
        white-space: nowrap;
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
    z-index: 2;
`;

export const ProfilePictureDiv = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    background: white;
`;

interface IUploadProfilePicture {
    imageHover: boolean;
}

export const UploadProfilePicture = styled.div<IUploadProfilePicture>`
    width: 100%;
    height: 30%;
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
`;

export const UploadProfilePictureText = styled.div`
    text-align: center;
    font-weight: bold;
    color: white;
    padding-top: 3px;
    grid-row: 1;
    grid-column: 1;
`;
export const UploadProfilePictureIcon = styled.div`
    grid-row: 2;
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
    align-self: end;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: 1fr;
    ${!isMobile() && "padding-left: 32px;"}
`;
export const NameSection = styled.div`
    grid-row: 2;
    grid-column: 1;
    color: white;
    padding: ${isMobile() ? "12px 0 4px" : "16px 24px"};
`;
export const ContentSection = styled.div<any>`
    grid-row: 2;
    grid-column: 2;
    align-self: start;
    z-index: 2;
    margin-top: 16px;
    ${!isMobile() && "margin-left: 32px;"}
    background: ${(properties) => properties.theme.background};
    border-radius: 4px;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
    min-width: 0;
    overflow-x: hidden;
`;
export const ContentTabsContainer = styled.div`
    background-color: rgba(0, 0, 0, 0.2);
`;
export const contentActionsStyle = css`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding-left: 24px;
    padding-right: 24px;
    margin-top: 12px;
    margin-bottom: 24px;
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
    .MuiListItem-button {
        padding: 8px 24px !important;
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
    min-height: 80px;
    padding-bottom: 2px;
`;

export const StyledListItemAvatar = styled.div`
    display: flex;
    align-items: center;
    align-self: center;
    margin-right: 24px;
    & > div {
        align-self: center;
        width: 55px;
        height: 55px;
    }
`;
export const StyledListItemTopRowText = styled.div`
    grid-row: 1;
    grid-column: 2;
    text-align: left;
    & p {
        white-space: pre-line;
        padding-right: 8px;
        padding-top: 8px;
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
    bottom: 0;
    left: 0;
    z-index: 10;
    border-top: 1px solid;
`;

export const mobileNavigationButton = (theme: any) => css`
    color: ${theme.headerTextColor};
`;

export const profileMobileBottomSpacer = css`
    height: 72px;
`;
