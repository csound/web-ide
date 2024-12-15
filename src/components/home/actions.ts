import { difference, keys, isEmpty, pluck } from "ramda";
import { getFunctions, httpsCallable } from "firebase/functions";
import { documentId, getDocs, query, where } from "firebase/firestore";
import { profiles } from "@config/firestore";
import { RootState } from "@root/store";
import {
    ADD_USER_PROFILES,
    ADD_RANDOM_PROJECTS,
    ADD_POPULAR_PROJECTS,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    SET_POPULAR_PROJECTS_OFFSET,
    SET_RANDOM_PROJECTS_LOADING,
    HomeActionTypes,
    RandomProjectResponse,
    PopularProjectResponse
} from "./types";
import { IProject } from "@comp/projects/types";
import { firestoreProjectToIProject } from "@comp/projects/utils";

const databaseID = process.env.REACT_APP_DATABASE === "DEV" ? "dev" : "prod";
const searchURL = `https://web-ide-search-api.csound.com/search/${databaseID}`;
const functions = getFunctions();
const getRandomProjects = httpsCallable<
    { count: number },
    RandomProjectResponse[]
>(functions, "random_projects");
const getPopularProjects = httpsCallable<
    { count: number },
    PopularProjectResponse[]
>(functions, "popular_projects");

// const searchURL = `http://localhost:4000/search/${databaseID}`;

export const searchProjects =
    (query_: string, offset: number) => async (dispatch) => {
        dispatch({ type: SEARCH_PROJECTS_REQUEST, query: query_, offset });

        if (isEmpty(query_)) {
            return;
        }

        let projectsData: any[] = [];
        let totalRecords = 0;
        try {
            const searchRequest = await fetch(
                `${searchURL}/query/projects/${query_}/8/${offset}/name/desc`
            );

            const projects = await searchRequest.json();

            projectsData = projects.data.slice(0, 8);
            totalRecords = projects.totalRecords as number;
        } catch (error) {
            console.error(error);
        }

        const searchResult: IProject[] = projectsData.map(
            firestoreProjectToIProject
        );

        const userIDs = pluck("userUid", searchResult);

        if (!isEmpty(userIDs)) {
            const projectProfiles = {};

            const profilesQuery = await getDocs(
                query(profiles, where(documentId(), "in", userIDs))
            );

            profilesQuery.forEach((snapshot) => {
                projectProfiles[snapshot.id] = snapshot.data();
                if (projectProfiles[snapshot.id]?.userJoinDate) {
                    projectProfiles[snapshot.id].userJoinDate =
                        projectProfiles[snapshot.id].userJoinDate.toMillis();
                }
            });

            dispatch({
                type: ADD_USER_PROFILES,
                payload: projectProfiles
            });
        }

        dispatch({
            type: SEARCH_PROJECTS_SUCCESS,
            result: searchResult,
            totalRecords
        });
    };

export const fetchPopularProjects = (offset = 0, pageSize = 8) => {
    return async (
        dispatch: (action: HomeActionTypes) => Promise<void>,
        getState: () => RootState
    ): Promise<void> => {
        const nextOffset = Math.max(0, offset) + pageSize;

        dispatch({
            type: SET_POPULAR_PROJECTS_OFFSET,
            newOffset: nextOffset
        });
        const state = getState().HomeReducer;

        let popularProjects: PopularProjectResponse[] = [];
        try {
            // const starsRequest = await fetch(
            //     `${searchURL}/list/stars/${pageSize}/${offset}/count/desc`
            // );
            // const starredProjects: IStarredProjectSearchResult =
            //     await starsRequest.json();

            const popularProjectsResponse = await getPopularProjects({
                count: pageSize
            });

            popularProjects = []; // popularProjectsResponse.data;
        } catch (error) {
            console.error(error);
        }

        const userIDs = popularProjects.map((project) => project.userUid);

        const missingProfiles = difference(userIDs, keys(state.profiles));
        if (!isEmpty(missingProfiles)) {
            const projectProfiles = {};

            const profilesQuery = await getDocs(
                query(profiles, where(documentId(), "in", missingProfiles))
            );

            profilesQuery.forEach((snapshot) => {
                projectProfiles[snapshot.id] = snapshot.data();
                if (projectProfiles[snapshot.id]?.userJoinDate) {
                    projectProfiles[snapshot.id].userJoinDate =
                        projectProfiles[snapshot.id].userJoinDate.toMillis();
                }
            });

            dispatch({
                type: ADD_USER_PROFILES,
                payload: projectProfiles
            });
        }

        dispatch({
            type: ADD_POPULAR_PROJECTS,
            payload: popularProjects
        });
    };
};

export const fetchRandomProjects = () => {
    return async (
        dispatch: (action: HomeActionTypes) => Promise<void>,
        getState: () => RootState
    ): Promise<void> => {
        dispatch({ type: SET_RANDOM_PROJECTS_LOADING, isLoading: true });

        const state = getState().HomeReducer;

        let randomProjects: RandomProjectResponse[] = [];

        try {
            const randomProjectsResponse = await getRandomProjects({
                count: 8
            });
            randomProjects = randomProjectsResponse.data;
        } catch (error) {
            console.error(error);
        }

        const userIDs = randomProjects.map((project) => project.userUid);
        const missingProfiles = difference(userIDs, keys(state.profiles));

        if (!isEmpty(missingProfiles)) {
            const projectProfiles = {};

            const profilesQuery = await getDocs(
                query(profiles, where(documentId(), "in", missingProfiles))
            );

            profilesQuery.forEach((snapshot) => {
                projectProfiles[snapshot.id] = snapshot.data();
                if (projectProfiles[snapshot.id]?.userJoinDate) {
                    projectProfiles[snapshot.id].userJoinDate =
                        projectProfiles[snapshot.id].userJoinDate.toMillis();
                }
            });

            dispatch({
                type: ADD_USER_PROFILES,
                payload: projectProfiles
            });
        }

        dispatch({
            type: ADD_RANDOM_PROJECTS,
            payload: randomProjects
        });

        dispatch({ type: SET_RANDOM_PROJECTS_LOADING, isLoading: false });
    };
};
