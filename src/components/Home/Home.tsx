import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import withStyles from "./styles";
import Header from "../Header/Header";
import ProjectCard from "./ProjectCard";
import { searchProjects, getTags } from "./actions";

import {
    HomeContainer,
    SearchContainer,
    StyledTextField,
    ProjectSectionHeader,
    HorizontalRule,
    FeaturedProjectsContainer,
    ProjectSectionCardContainer
} from "./HomeUI";
import { selectTags } from "./selectors";

const Home = props => {
    const { classes } = props;
    const dispatch = useDispatch();
    const tags = useSelector(selectTags);

    console.log(tags);

    useEffect(() => {
        dispatch(getTags());
    }, [dispatch]);

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
                    <FeaturedProjectsContainer>
                        <ProjectSectionHeader row={1}>
                            Popular Projects
                            <HorizontalRule />
                        </ProjectSectionHeader>
                        <ProjectSectionCardContainer row={2}>
                            <ProjectCard />
                        </ProjectSectionCardContainer>
                    </FeaturedProjectsContainer>
                </HomeContainer>
            </main>
        </div>
    );
};

export default withStyles(Home);
