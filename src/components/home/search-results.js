import React from "react";
import {
    SearchProjectContainer,
    ProjectSectionHeader,
    HorizontalRule
} from "./home-ui";
import { Transition, TransitionGroup } from "react-transition-group";

const SearchResults = ({ heading, transitionStatus, duration }) => {
    return (
        <TransitionGroup
            component={SearchProjectContainer}
            className={transitionStatus}
            duration={duration}
        >
            <Transition appear timeout={duration}>
                {(transitionStatus) => {
                    return (
                        <ProjectSectionHeader
                            className={transitionStatus}
                            row={1}
                            duration={duration}
                        >
                            {heading}
                            <HorizontalRule />
                        </ProjectSectionHeader>
                    );
                }}
            </Transition>
        </TransitionGroup>
    );
};

export default SearchResults;
