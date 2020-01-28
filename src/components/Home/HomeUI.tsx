import { TextField, IconButton } from "@material-ui/core";
import styled from "styled-components";
import { Gradient } from "./Gradient";

export const HomeContainer = styled.div`
    position: absolute;
    height: 100%;
    display: grid;
    grid-template-columns: 250px auto;
    grid-template-rows: 0.1fr auto;
    width: 100%;
    background-color: black;
    ${Gradient}
`;

export const FeaturedProjectsContainer = styled.div`
    grid-row: 2;
    grid-column: 2;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 0.1fr 0.1fr 0.1fr 0.3fr;
    transition: opacity 0.3s;
    width: 100%;
    height: 100%;
    // enter from
    &.fade-enter {
        opacity: 0;
    }

    // enter to
    &.fade-enter-active {
        opacity: 1;
    }

    // exit from
    &.fade-exit {
        opacity: 1;
        transition-delay: 2s;
    }

    // exit to
    &.fade-exit-active {
        opacity: 0;
        transition-delay: 2s;
    }
`;

export const SearchResultsContainer = styled.div`
    grid-row: 1;
    grid-column: 1;
`;

export const SearchContainer = styled.div`
    grid-row: 1;
    grid-column: 2;
    padding: 5px;
`;

export const StyledTextField = styled(TextField)`
    && {
        background-color: black;
        border-radius: 5px;
    }
`;

type IProjectSection = {
    row: number;
};

export const ProjectSectionHeader = styled.div<IProjectSection>`
    grid-row: ${props => props.row};
    grid-column: 1;
    font-family: "Merriweather", serif;
    font-size: 2em;
    padding-right: 5px;
    color: white;
`;

export const ProjectSectionCardContainer = styled.div<IProjectSection>`
    grid-row: ${props => props.row};
    grid-column: 1;
    padding-right: 5px;
`;

export const HorizontalRule = styled.hr`
    border: 0;
    height: 3px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 1);
    margin-top: -2px;
`;

export const ProjectCardContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    background-color: black;
    border-radius: 8px;
    overflow: hidden;
    z-index: 1;
`;

interface IProjectCardSVGContainer {
    backgroundColor: string;
    mouseOver: boolean;
}
export const ProjectCardSVGContainer = styled.div<IProjectCardSVGContainer>`
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: ${props => props.backgroundColor};
    opacity: ${props => (props.mouseOver ? 0.8 : 0.5)};
    z-index: 2;
    transition: opacity 0.3s;
`;

export const ProjectCardContentContainer = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: 0.25fr 0.5fr 0.25fr;
    grid-template-columns: 1fr;
    z-index: 3;
    font-family: "Merriweather", serif;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

export const ProjectCardContentTop = styled.div`
    grid-row: 1;
    grid-column: 1;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 10px;
    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
`;

export const ProjectCardContentMiddle = styled.div`
    grid-row: 2;
    grid-column: 1;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const ProjectCardContentTopHeader = styled.div`
    grid-row: 1;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 18px;
`;

export const ProjectCardContentTopDescription = styled.div`
    grid-row: 2;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
`;

export const ProjectCardContentBottom = styled.div`
    grid-row: 3;
    grid-column: 1;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    box-shadow: 0px 3px 8px 3px rgba(0, 0, 0, 0.4);
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 0.2fr 0.8fr;
`;

export const ProjectCardContentBottomPhoto = styled.div`
    grid-row: 1;
    grid-column: 1;
    padding: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const ProjectCardContentBottomID = styled.div`
    grid-row: 1;
    grid-column: 2;
    padding: 5px;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr;
`;

export const Photo = styled.img`
    vertical-align: middle;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
`;

export const StyledIconButton = styled(IconButton)`
    && {
        filter: invert(1);
    }
`;

export const ProjectCardContentBottomHeader = styled.div`
    grid-row: 1;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
    padding-top: 8px;
`;

export const ProjectCardContentBottomDescription = styled.div`
    grid-row: 2;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 12px;
`;
