import React from "react";
import { useDispatch } from "react-redux";
import withStyles from "./styles";
import Header from "../Header/Header";
import { searchProjects } from "./actions";
// import {

// } from "./selectors";

// import { SET_LIST_PLAY_STATE } from "./types";
import { HomeContainer, SearchContainer, StyledTextField } from "./HomeUI";

const Home = props => {
    const { classes } = props;
    const dispatch = useDispatch();

    return (
        <div className={classes.root}>
            <Header showMenuBar={false} />
            <main>
                <HomeContainer
                    colorA={"rgba(30, 30, 30, 1)"}
                    colorB={"rgba(40, 40, 40, 1)"}
                    colorC={"rgba(20, 20, 20, 1)"}
                >
                    <SearchContainer>
                        <StyledTextField
                            fullWidth
                            variant="outlined"
                            id="standard-name"
                            label="Search Projects"
                            className={classes.textField}
                            margin="normal"
                            InputLabelProps={{
                                classes: {
                                    root: classes.cssLabel,
                                    focused: classes.cssFocused
                                }
                            }}
                            InputProps={{
                                classes: {
                                    root: classes.cssOutlinedInput,
                                    focused: classes.cssFocused,
                                    notchedOutline: classes.notchedOutline
                                },
                                inputMode: "numeric"
                            }}
                            onChange={e => {
                                dispatch(searchProjects(e.target.value));
                            }}
                        />
                    </SearchContainer>
                </HomeContainer>
            </main>
        </div>
    );
};

export default withStyles(Home);
