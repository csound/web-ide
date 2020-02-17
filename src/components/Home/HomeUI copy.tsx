import { TextField, IconButton } from "@material-ui/core";
import styled, { css } from "styled-components";
import { Gradient } from "./Gradient";

export const HomeContainer = styled.div`
    height: calc(100% - 50px);
    display: grid;
    grid-template-columns: 250px auto;
    overflow: hidden;
    grid-template-rows: 0.1fr 0.9fr;
    width: 100%;
    background-color: black;
    ${Gradient}
`;

export const SearchContainer = styled.div`
    grid-row: 1;
    grid-column: 2;
    padding: 5px;
`;

export const ProjectsContainer = styled.div`
    grid-row: 2;
    grid-column: 2;
    width: 100%;
    height: 100%;
`;

export const StyledTextField = styled(TextField)`
    && {
        background-color: black;
        border-radius: 5px;
    }
`;

interface IFeaturedProjectContainer {
    duration: number;
}

export const FeaturedProjectContainer = styled.div<IFeaturedProjectContainer>`
    display: grid;
    height: 100%;
    width: 100%;
    position: absolute;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr;
    transition: all ${props => props.duration}ms;

    &.entering {
        opacity: 0;
        transform: translate(30px);
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
        transform: translate(30px);
    }
`;

interface ISearchProjectContainer {
    duration: number;
}

export const SearchProjectContainer = styled.div<ISearchProjectContainer>`
    position: absolute;
    display: grid;
    grid-template-rows: 50px auto auto 50px;
    grid-template-columns: 1fr;
    width: 100%;
    height: 100%;
    transition: all ${props => props.duration}ms;

    &.entering {
        opacity: 0;
        transform: translate(30px);
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
        transform: translate(30px);
    }
`;

interface IFeaturedProjectsRowContainer {
    row: number;
}

export const FeaturedProjectsRowContainer = styled.div<
    IFeaturedProjectsRowContainer
>`
    grid-row: ${props => props.row};
    grid-column: 1;
    display: grid;
    grid-template-rows: 50px auto;
    grid-template-columns: 1fr;
    position: relative;
    width: 100%;
    height: 100%;
`;

interface IProjectSectionHeader {
    row: number;
    duration: number;
}

export const ProjectSectionHeader = styled.div<IProjectSectionHeader>`
    grid-row: ${props => props.row};
    grid-column: 1;
    font-family: "Merriweather", serif;
    font-size: 2em;
    padding-right: 5px;
    color: white;
    transition: all ${props => props.duration}ms;

    &.entering {
        opacity: 0;
        transform: translate(30px);
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
        transform: translate(30px);
    }
`;

interface IProjectSectionCardContainer {
    row: number;
}

export const ProjectSectionCardContainer = styled.div<
    IProjectSectionCardContainer
>`
    grid-row: ${props => props.row};
    grid-column: 1;
    margin-right: 5px;
    height: 100%;
`;

export const HorizontalRule = styled.hr`
    border: 0;
    height: 3px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 1);
    margin-top: -2px;
`;

interface IProjectCard {
    duration: number;
    projectIndex: number;
    projectColumnCount: number;
}

export const moveAnimation = css<IProjectCard>`
    left: ${props => (props.projectIndex / props.projectColumnCount) * 100}%;
    right: ${props =>
        100 - ((props.projectIndex + 1) / props.projectColumnCount) * 100}%;
    top: 0%;
    bottom: 0%;
`;

// export const ProjectCardContainer = styled.div<IProjectCard>`
//     position: relative;
//     width: 100%;
//     height: 100%;
//     background-color: black;
//     border-radius: 8px;
//     overflow: hidden;
//     z-index: 1;
//     transition: all ${props => props.duration}ms;
//     overflow: hidden;
//     border: 1px solid white;
//     pointer-events: none;
//     margin: 4px;
//     background-color: grey;
//     display: grid;
//     grid-template-rows: 1;
//     grid-template-columns: 1;
//     transition-delay: ${props => props.projectIndex * 50}ms;

//     &.entering {
//         opacity: 0;
//         transform: translate(10px);
//     }
//     &.entered {
//         opacity: 1;
//     }
//     &.exiting {
//         opacity: 0;
//         transform: translate(10px);
//     }
// `;

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
    height: 100%;
    background-color: ${props => props.backgroundColor};
    opacity: ${props => (props.mouseOver ? 0.8 : 0.5)};
    z-index: 2;
    transition: opacity 0.3s;
    grid-row: 1;
    grid-column: 1;
`;

export const ProjectCardContentContainer = styled.div`
    position: absolute;
    height: 100%;
    width: 100%;
    grid-row: 1;
    grid-column: 1;
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
