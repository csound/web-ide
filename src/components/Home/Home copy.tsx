// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Header from "../Header/Header";
// import withStyles from "./styles";
// import {
//     searchProjects,
//     getPopularProjects,
//     getTags,
//     getStars,
//     getProjectLastModified
// } from "./actions";
// import { BulletList } from "react-content-loader";
// import {
//     HomeContainer,
//     SearchContainer,
//     StyledTextField,
//     ProjectsContainer
// } from "./HomeUI";

// import {
//     selectTags,
//     selectStars,
//     selectProjectLastModified,
//     // selectDisplayedRecentProjects,
//     selectDisplayedStarredProjects,
//     selectProjectUserProfiles
// } from "./selectors";

// import FeaturedProjects from "./FeaturedProjects";
// import SearchResults from "./SearchResults";
// import { Transition, TransitionGroup } from "react-transition-group";

// const duration = 200;

// const Home = props => {
//     const { classes } = props;
//     const dispatch = useDispatch();
//     const [showFeaturedProjects, setShowFeaturedProjects] = useState(true);
//     const [searchValue, setSearchValue] = useState("");
//     const tags = useSelector(selectTags);
//     const stars = useSelector(selectStars);
//     const projectLastModified = useSelector(selectProjectLastModified);
//     const starredProjects = useSelector(selectDisplayedStarredProjects);
//     const projectUserProfiles = useSelector(selectProjectUserProfiles);
//     const columnCount = 4;
//     const columnPlaceHolderArray = new Array(columnCount).fill(0);
//     let projectColumnCount = 4;
//     useEffect(() => {
//         if (
//             Array.isArray(tags) === true &&
//             Array.isArray(stars) === true &&
//             Array.isArray(projectLastModified) === true
//         ) {
//             dispatch(getPopularProjects(4));
//         }
//     }, [dispatch, tags, stars, projectLastModified]);

//     useEffect(() => {
//         dispatch(getTags());
//         dispatch(getStars());
//         dispatch(getProjectLastModified());
//     }, [dispatch]);

//     useEffect(() => {
//         if (searchValue.length > 0 && showFeaturedProjects === true) {
//             setShowFeaturedProjects(false);
//         }

//         if (searchValue.length === 0 && showFeaturedProjects === false) {
//             setShowFeaturedProjects(true);
//         }
//     }, [searchValue, setShowFeaturedProjects, showFeaturedProjects]);

//     return (
//         <div className={classes.root}>
//             <Header />
//             <HomeContainer
//                 colorA={"rgba(30, 30, 30, 1)"}
//                 colorB={"rgba(40, 40, 40, 1)"}
//                 colorC={"rgba(20, 20, 20, 1)"}
//             >
//                 <SearchContainer>
//                     <StyledTextField
//                         fullWidth
//                         value={searchValue}
//                         variant="outlined"
//                         id="standard-name"
//                         label="Search Projects"
//                         className={classes.textField}
//                         margin="normal"
//                         InputLabelProps={{
//                             classes: {
//                                 root: classes.cssLabel,
//                                 focused: classes.cssFocused
//                             }
//                         }}
//                         InputProps={{
//                             classes: {
//                                 root: classes.cssOutlinedInput,
//                                 focused: classes.cssFocused,
//                                 notchedOutline: classes.notchedOutline
//                             },
//                             inputMode: "numeric"
//                         }}
//                         onChange={e => {
//                             setSearchValue(e.target.value);
//                             // dispatch(searchProjects(e.target.value));
//                         }}
//                     />
//                 </SearchContainer>
//                 <ProjectsContainer>
//                     <TransitionGroup>
//                         {searchValue === "" && (
//                             <Transition appear timeout={duration}>
//                                 {transitionStatus => {
//                                     return (
//                                         <FeaturedProjects
//                                             transitionStatus={transitionStatus}
//                                             projectColumnCount={
//                                                 projectColumnCount
//                                             }
//                                             duration={duration}
//                                             starredProjects={starredProjects}
//                                         />
//                                     );
//                                 }}
//                             </Transition>
//                         )}
//                         {/* {searchValue !== "" && (
//                             <Transition appear timeout={duration}>
//                                 {transitionStatus => {
//                                     return (
//                                         <SearchResults
//                                             transitionStatus={transitionStatus}
//                                             heading={"Search Results"}
//                                             projectColumnCount={
//                                                 projectColumnCount
//                                             }
//                                             duration={duration}
//                                         />
//                                     );
//                                 }}
//                             </Transition>
//                         )} */}
//                     </TransitionGroup>
//                 </ProjectsContainer>
//             </HomeContainer>
//         </div>
//     );
// };

// export default withStyles(Home);
