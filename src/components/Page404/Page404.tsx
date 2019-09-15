import React, { useEffect } from "react";
import Header from "../Header/Header";
import { push } from "connected-react-router";
import styled from "styled-components";
import withStyles from "./styles";
import CSLogo from "../CSLogo/CSLogo";
import { get } from "lodash";
const MainContainer = styled.div`
    display: grid;
    width: 100%;
    height: calc(100vh - 39px);
    grid-template-columns: auto 300px 300px auto;
    grid-template-rows: auto 300px auto;
    background-color: #556;
    background-image: linear-gradient(
            30deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            150deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            30deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            150deg,
            #445 12%,
            transparent 12.5%,
            transparent 87%,
            #445 87.5%,
            #445
        ),
        linear-gradient(
            60deg,
            #aaa 25%,
            transparent 25.5%,
            transparent 75%,
            #aaa 75%,
            #aaa
        ),
        linear-gradient(
            60deg,
            #aaa 25%,
            transparent 25.5%,
            transparent 75%,
            #aaa 75%,
            #99a
        );
    background-size: 80px 140px;
    background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
`;

interface ILogoContainer {
    size: number;
}

const TextContainer = styled.div<ILogoContainer>`
    font-family: "Merriweather", serif;
    font-size: ${props => Math.floor(props.size * 0.75)}px;
    color: #fff;
    line-height: ${props => props.size}px;
    text-align: center;
    font-weight: bold;
    grid-row: 2;
    grid-column: 3;
    display: grid;
    grid-template-rows: 3fr 1fr;
    grid-template-columns: 1fr;
    text-shadow: 0 1px 1px black;
`;

const MessageText = styled.div<ILogoContainer>`
    grid-row: 2;
    grid-column: 1;
    font-size: ${props => Math.floor(props.size * 0.15)}px;
    line-height: 0;
`;

const Page404 = props => {
    const { classes } = props;

    let message = get(props, "location.state.message") || "Page Not Found";

    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <main>
                <MainContainer>
                    <CSLogo size={300} />
                    <TextContainer size={200}>
                        404<MessageText size={200}>{message}</MessageText>
                    </TextContainer>
                </MainContainer>
            </main>
        </div>
    );
};

export default withStyles(Page404);
