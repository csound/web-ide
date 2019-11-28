import { Card, Fab, TextField, Chip } from "@material-ui/core";
import styled from "styled-components";
import { Gradient } from "./Gradient";
export const ProfileContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 250px 8fr;
    grid-template-rows: 30px 175px 1fr 100px;
    width: 100%;
    height: calc(100vh - 40px);
    background-color: black;
    ${Gradient}
`;
export const IDContainer = styled(Card)`
    && {
        grid-row-start: 2;
        grid-row-end: 4;
        grid-column-start: 2;
        grid-column-end: 3;
        display: grid;
        grid-template-rows: 250px 1fr 100px;
        grid-template-columns: 1fr;
        z-index: 2;
    }
`;
export const DescriptionSection = styled.div`
    grid-row: 2;
    grid-column: 1;
    padding: 20px;
`;

export const EditProfileButtonSection = styled.div`
    grid-row: 3;
    grid-column: 1;
    margin: auto;
`;
export const MainContent = styled.div`
    grid-row-start: 3;
    grid-row-end: 6;
    grid-column-start: 1;
    grid-column-end: 4;
    background: #dedede;
    box-shadow: 0 3px 10px 0px;
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
    imageHover: Boolean;
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
    opacity: ${props => (props.imageHover ? 1 : 0)};
`;
export const UploadProfilePictureText = styled.div`
    font-family: Arial, Helvetica, sans-serif;
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
    grid-template-rows: 1fr 120px;
    grid-template-columns: 1fr;
`;
export const NameSection = styled.div`
    grid-row: 2;
    grid-column: 1;
    color: white;
    padding: 20px;
`;
export const ContentSection = styled.div`
    grid-row-start: 3;
    grid-row-end: 5;
    grid-column: 3;
    z-index: 2;
    padding: 0 20px;
    display: grid;
    grid-template-rows: 60px 50px 1fr;
    grid-template-columns: 1fr 250px;
`;
export const ContentTabsContainer = styled.div`
    grid-row: 1;
    grid-column: 1;
`;
export const ContentActionsContainer = styled.div`
    grid-row: 2;
    grid-column: 1;
`;
export const AddFab = styled(Fab)`
    float: right;

    && {
        margin-top: 6px;
    }
`;
export const ListContainer = styled.div`
    padding-top: 10px;
    grid-row: 3;
    grid-column: 1;
    overflow: scroll;
`;
export const SearchBox = styled(TextField)`
    && {
        height: 20px;
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
    grid-template-rows: 1fr 0.5fr;
    grid-template-columns: 1fr 8fr 70px ${props =>
            props.isProfileOwner ? "70px" : ""};
    width: 100%;
    padding-bottom: 2px;
`;
export const StyledListItemAvatar = styled.div`
    grid-row-start: 1;
    grid-row-end: 2;
    grid-column: 1;
`;
export const StyledListItemTopRowText = styled.div`
    grid-row: 1;
    grid-column: 2;
`;
export const StyledListItemChipsRow = styled.div`
    grid-row: 2;
    grid-column-start: 2;
    grid-column-end: 3;
`;
export const StyledListPlayButtonContainer = styled.div`
    grid-row-start: 1;
    grid-row-end: 3;
    grid-column-start: 3;
    grid-column-end: 4;
`;
export const StyledListButtonsContainer = styled.div`
    grid-row-start: 1;
    grid-row-end: 3;
    grid-column-start: 4;
    grid-column-end: 5;
`;
