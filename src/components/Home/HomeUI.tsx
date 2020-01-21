import { TextField } from "@material-ui/core";
import styled from "styled-components";
import { Gradient } from "./Gradient";

export const HomeContainer = styled.div`
    position: absolute;
    height: 100%;
    display: grid;
    grid-template-columns: 250px 8fr 10px;
    grid-template-rows: 0.1fr 0.1fr 0.8fr 0.1fr;
    width: 100%;
    background-color: black;
    ${Gradient}
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
