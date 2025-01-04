import { Link } from "react-router";
import styled from "@emotion/styled";
import { headerHeight } from "@styles/constants";

export const StyledGrid = styled.div`
    && {
        background-color: black;
    }
`;

const outerPadding = 10;

export const HomeContainer = styled.div`
    min-height: calc(100% - ${headerHeight + outerPadding}px);
    width: 100%;
    position: absolute;
    top: 0;
    padding: ${outerPadding}px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export const StyledTextField = styled.div`
    && {
        background-color: black;
        border-radius: 5px;
    }
`;

interface IProjectCard {
    duration: number;
    projectIndex: number;
}

export const ProjectCardContainer = styled.div<IProjectCard>`
    height: 182px;
    z-index: 1;
    position: relative;
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
    duration: number;
}

interface IProjectCardSpinnerContainer {
    duration: number;
}

export const ProjectCardSpinnerContainer = styled.div<IProjectCardSpinnerContainer>`
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
    opacity: 0.5;
    &:hover {
        opacity: 1;
    }
    z-index: 2;
    transition: opacity 0.3s;
    grid-row: 1;
    grid-column: 1;
    transition: all ${(properties) => properties.duration}ms;
`;

interface IProjectCardContentContainer {
    duration: number;
}

export const ProjectCardContentContainer = styled.div<IProjectCardContentContainer>`
    position: absolute;
    height: 100%;
    width: 100%;
    grid-row: 1;
    grid-column: 1;
    display: grid;
    grid-template-rows: 60px auto 60px;
    grid-template-columns: 1fr;
    z-index: 3;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    transition: all 200ms;
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
    grid-template-rows: 1.1fr 0.9fr;
    grid-template-columns: 1fr;
    background-color: rgba(0, 0, 0, 0);
    color: white;
    padding: 6px 10px;
    box-shadow: none;
    overflow: hidden;
    transition: all 200ms;
    &:hover {
        box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
        background-color: rgba(0, 0, 0, 0.5);
    }
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
    font-weight: 600;
    cursor: pointer;
`;

export const ProjectCardContentTopDescription = styled.div`
    grid-row: 2;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
`;

export const ProjectCardContentBottom = styled(Link)`
    grid-row: 3;
    grid-column: 1;
    z-index: 4;
    background-color: rgba(0, 0, 0, 0);
    color: white;
    box-shadow: none;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 60px auto;
    transition: all 200ms;
    overflow: hidden;
    cursor: pointer;
    &:hover {
        box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
        background-color: rgba(0, 0, 0, 0.4);
    }
`;

export const ProjectCardContentBottomPhoto = styled.div`
    grid-row: 1;
    grid-column: 1;
    padding-left: 10px;
    padding-bottom: 6px;
    display: flex;
    align-items: center;
    overflow: hidden;
`;

export const ProjectCardContentBottomID = styled.div`
    grid-row: 1;
    grid-column: 2;
    padding: 6px 10px;
    padding-top: 0;
    display: grid;
    grid-template-rows: 1.1fr 0.9fr;
    grid-template-columns: 1fr;
`;

export const Photo: any = styled.div`
    position: relative;
    bottom: 3px;
    vertical-align: middle;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-image: url("${(property: any) => property.src}");
    background-size: cover;
    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.4);
`;

export const StyledIconButton = styled.div`
    && {
        filter: invert(1);
    }
`;

// export const PaginationIconButton = styled.div`
//     && {
//         color: white;
//         position: absolute;
//         right: 0;
//         bottom: 6px;
//     }
// `;

export const ProjectCardContentBottomHeader = styled.div`
    grid-row: 1;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    padding-top: 8px;
`;

export const ProjectCardContentBottomDescription = styled.div`
    grid-row: 2;
    grid-column: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
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

export const SearchProjectWaitContainer = styled.div<ISearchProjectContainer>`
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
