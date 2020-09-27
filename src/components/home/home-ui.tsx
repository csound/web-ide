import { TextField, IconButton, Grid } from "@material-ui/core";
import { Link } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { Gradient } from "./gradient";

import { headerHeight } from "@styles/constants";

export const GlobalStyle = createGlobalStyle`
  body {
    ${Gradient}
  }
`;

export const StyledGrid = styled(Grid)`
    && {
        background-color: black;
    }
`;

const outerPadding = 10;

export const HomeContainer = styled.div`
    min-height: calc(100% - ${headerHeight + outerPadding}px);
    width: 100%;
    position: absolute;
    padding: ${outerPadding}px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export const StyledTextField = styled(TextField)`
    && {
        background-color: black;
        border-radius: 5px;
    }
`;

interface IAnimatedGridContainer {
    duration: number;
}

export const AnimatedGridContainer = styled(Grid)<IAnimatedGridContainer>`
    position: relative;
    transition: all ${(properties) => properties.duration}ms;

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

interface IProjectCard {
    duration: number;
    projectIndex: number;
    projectColumnCount: number;
}

export const ProjectCardContainer = styled.div<IProjectCard>`
    height: 20vh;
    border-radius: 8px;
    z-index: 1;
    position: relative;
    margin: 5px;
    background-color: black;

    transition-delay: ${(properties) => properties.projectIndex * 50}ms;
    transition: all ${(properties) => properties.duration}ms;
    &.entering {
        opacity: 0;
        transform: translate(10px);
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
        transform: translate(10px);
    }
`;

interface IProjectCardSVGContainer {
    backgroundColor: string;
    mouseOver: boolean;
    duration: number;
}

interface IProjectCardSpinnerContainer {
    duration: number;
}

export const ProjectCardSpinnerContainer = styled.div<
    IProjectCardSpinnerContainer
>`
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 2;
    grid-row: 1;
    grid-column: 1;
    background-color: black;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all ${(properties) => properties.duration}ms;
    &.entering {
        opacity: 0;
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 1;
    }
`;

export const ProjectCardSVGContainer = styled.div<IProjectCardSVGContainer>`
    position: absolute;
    height: 100%;
    width: 100%;
    background-color: ${(properties) => properties.backgroundColor};
    opacity: ${(properties) => (properties.mouseOver ? 1 : 0.5)};
    z-index: 2;
    transition: opacity 0.3s;
    grid-row: 1;
    grid-column: 1;
    transition: all ${(properties) => properties.duration}ms;
    &.entering {
        opacity: 0;
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
    }
`;

interface IProjectCardContentContainer {
    duration: number;
}
export const ProjectCardContentContainer = styled.div<
    IProjectCardContentContainer
>`
    position: absolute;
    height: 100%;
    width: 100%;
    grid-row: 1;
    grid-column: 1;
    display: grid;
    grid-template-rows: 60px auto 60px;
    grid-template-columns: 1fr;
    z-index: 3;
    font-family: "Merriweather", serif;
    text-overflow: ellipsis;
    white-space: nowrap;

    transition: all ${(properties) => properties.duration}ms;
    &.entering {
        opacity: 0;
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
    }
`;

export const ProjectCardContentTop = styled(Link)`
    grid-row: 1;
    grid-column: 1;
    display: grid;
    grid-template-rows: 1.2fr 0.8fr;
    grid-template-columns: 1fr;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 10px;
    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }
`;

export const ProjectCardContentMiddle = styled.div`
    grid-row: 2;
    grid-column: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.2);
`;

export const ProjectCardContentTopHeader = styled.div`
    grid-row: 1;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 18px;
    cursor: pointer;
`;

export const ProjectCardContentTopDescription = styled.div`
    grid-row: 2;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 12px;
`;

export const ProjectCardContentBottom = styled(Link)`
    grid-row: 3;
    grid-column: 1;
    z-index: 4;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    box-shadow: 0px 3px 8px 3px rgba(0, 0, 0, 0.4);
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 60px auto;
    overflow: hidden;
    cursor: pointer;
    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }
`;

export const ProjectCardContentBottomPhoto = styled.div`
    grid-row: 1;
    grid-column: 1;
    padding-left: 5px;
    display: flex;
    align-items: center;
    overflow: hidden;
`;

export const ProjectCardContentBottomID = styled.div`
    grid-row: 1;
    grid-column: 2;
    padding: 5px;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr;
`;

export const Photo: any = styled.div`
    vertical-align: middle;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    background-image: url(${(property: any) => property.src});
    background-size: cover;
    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
`;

export const StyledIconButton = styled(IconButton)`
    && {
        filter: invert(1);
    }
`;

export const PaginationIconButton = styled(IconButton)`
    && {
        color: white;
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

export const ProjectSectionHeader = styled(Grid)`
    font-family: "Merriweather", serif;
    font-size: 1.5em;
    color: white;
    flex: 1;
    width: 100%;
`;

export const HorizontalRule = styled.hr`
    border: 0;
    height: 1px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 1);
    margin-top: -10px;
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
    transition: all ${(properties) => properties.duration}ms;

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

export const SearchProjectWaitContainer = styled(Grid)<ISearchProjectContainer>`
    position: absolute;
    width: 100%;
    padding-top: 100px;
    color: white;
    transition: all ${(properties) => properties.duration}ms;
    display: flex;
    justify-content: center;
    align-items: center;
    &.entering {
        opacity: 0;
    }
    &.entered {
        opacity: 1;
    }
    &.exiting {
        opacity: 0;
    }
`;
