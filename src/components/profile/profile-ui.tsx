import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { isMobile } from "@root/utils";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

export const ProfileContainer = styled.div`
    ${isMobile()
        ? `padding: 12.5vw;`
        : `display: grid;
    grid-template-columns: 24px 250px 800px;
    grid-template-rows: 50px 175px 1fr 70px;
    grid-auto-rows: minmax(90px, auto);`}
    width: 100%;
`;
export const IDContainer = styled(Card)`
    && {
        grid-row-start: 2;
        grid-row-end: 3;
        grid-column-start: 2;
        grid-column-end: 3;
        display: grid;
        grid-template-rows: 250px 1fr 100px;
        grid-template-columns: 1fr;
        z-index: 2;
        min-height: 580px;
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
        & > div {
            max-width: 250px;
        }
    }
`;

export const DescriptionSection = styled.div`
    grid-row: 2;
    grid-column: 1;
    padding: 20px;
    div,
    a,
    h1,
    h2 {
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

export const EditProfileButtonSection = styled.div`
    grid-row: 3;
    grid-column: 1;
    margin: auto;
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
    grid-row: 2;
    grid-column: 3;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: 1fr;
    min-width: 680px;
`;
export const NameSection = styled.div`
    grid-row: 2;
    grid-column: 1;
    color: white;
    padding: 20px;
`;
export const ContentSection = styled.div<any>`
    grid-row-start: 3;
    grid-row-end: auto;
    grid-column: 3;
    z-index: 2;
    ${!isMobile() && "margin-left: 48px;"}
    background: ${(properties) => properties.theme.background};
    border-radius: 4px;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.8);
    width: 100%;
    overflow: hidden;
`;
export const ContentTabsContainer = styled.div`
    background-color: rgba(0, 0, 0, 0.2);
`;
export const contentActionsStyle = css`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 58px;
    padding-left: 24px;
    padding-right: 12px;
    margin-top: 12px;
    margin-bottom: 24px;
`;

export const ListContainer = styled.div`
    padding-top: 10px;
    grid-row: 3;
    grid-column: 1;
    & > ul {
        padding: 0 !important;
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
        padding-right: 6px;
        padding-top: 6px;
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
        margin-top: 6px;
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
