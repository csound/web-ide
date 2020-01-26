import { TextField } from "@material-ui/core";
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
    grid-template-rows: 0.1fr 0.3fr 0.1fr 0.3fr;
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
    padding: 5px;
    color: white;
`;

export const ProjectSectionCardContainer = styled.div<IProjectSection>`
    grid-row: ${props => props.row};
    grid-column: 1;
`;

export const HorizontalRule = styled.hr`
    border: 0;
    height: 3px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 1);
    margin-top: -2px;
`;
