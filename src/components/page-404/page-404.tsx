import React from "react";
import Header from "@comp/header/header";
import styled from "@emotion/styled";
import withStyles from "./styles";
import CSLogo from "../cs-logo/cs-logo";
import { get } from "lodash";
import { Gradient } from "./gradient";

const MainContainer = styled.div`
    display: grid;
    width: 100%;
    height: calc(100vh);
    grid-template-columns: auto 300px 300px auto;
    grid-template-rows: auto 300px auto;
    background-color: #556;
`;

const CSLogoContainer = styled.div`
    grid-row: 2;
    grid-column: 2;
`;

interface ILogoContainer {
    size: number;
}

const TextContainer = styled.div<ILogoContainer>`
    font-family: ${(properties) => properties.theme.font.regular};
    font-size: ${(properties) => Math.floor(properties.size * 0.75)}px;
    color: ${(properties) => properties.theme.textColor};
    line-height: ${(properties) => properties.size}px;
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
    font-size: ${(properties) => Math.floor(properties.size * 0.15)}px;
    line-height: 0;
`;

const Page404 = (properties) => {
    const { classes } = properties;

    const message =
        get(properties, "location.state.message") || "Page Not Found";

    return (
        <div
            className={classes.root}
            css={Gradient({
                colorA: "rgba(30, 30, 30, 1)",
                colorB: "rgba(40, 40, 40, 1)",
                colorC: "rgba(20, 20, 20, 1)"
            })}
        >
            <Header />
            <main>
                <MainContainer>
                    <CSLogoContainer>
                        <CSLogo size={300} />
                    </CSLogoContainer>
                    <TextContainer size={200}>
                        404<MessageText size={200}>{message}</MessageText>
                    </TextContainer>
                </MainContainer>
            </main>
        </div>
    );
};

export default withStyles(Page404);
