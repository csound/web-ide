import { difference, keys, isEmpty, pluck } from "ramda";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
    DocumentData,
    documentId,
    getDocs,
    query,
    Timestamp,
    where
} from "firebase/firestore";
import { profiles } from "@config/firestore";
import { AppThunkDispatch, RootState } from "@root/store";
import {
    ADD_USER_PROFILES,
    ADD_POPULAR_ARTISTS,
    ADD_RANDOM_PROJECTS,
    ADD_POPULAR_PROJECTS,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    SET_POPULAR_PROJECTS_LOADING,
    SET_POPULAR_PROJECTS_ERROR,
    SET_POPULAR_ARTISTS_ERROR,
    SET_POPULAR_ARTISTS_LOADING,
    SET_RANDOM_PROJECTS_LOADING,
    HomeActionTypes,
    PopularArtistResponse,
    RandomProjectResponse,
    PopularProjectResponse
} from "./types";
import { IProject } from "@comp/projects/types";
import { firestoreProjectToIProject } from "@comp/projects/utils";
import { IProfile } from "../profile/types";

const functions = getFunctions();
const getRandomProjects = httpsCallable<
    { count: number },
    RandomProjectResponse[]
>(functions, "random_projects");
const getPopularProjects = httpsCallable<
    { count: number },
    PopularProjectResponse[]
>(functions, "popular_projects");
const getPopularArtists = httpsCallable<
    { count: number },
    PopularArtistResponse[]
>(functions, "popular_artists");
const searchProjectsFunction = httpsCallable<
    {
        query: string;
        offset?: number;
        limit?: number;
        sortBy?: "name" | "created" | "stars";
        sortOrder?: "asc" | "desc";
    },
    {
        data: any[];
        totalRecords: number;
        offset: number;
        limit: number;
        query: string;
    }
>(functions, "search_projects");

// const searchURL = `http://localhost:4000/search/${databaseID}`;

export const searchProjects =
    (query_: string, offset: number) => async (dispatch: AppThunkDispatch) => {
        dispatch({ type: SEARCH_PROJECTS_REQUEST, query: query_, offset });

        if (isEmpty(query_)) {
            return;
        }

        let projectsData: any[] = [];
        let totalRecords = 0;
        try {
            const searchResponse = await searchProjectsFunction({
                query: query_,
                offset,
                limit: 8,
                sortBy: "name",
                sortOrder: "desc"
            });

            projectsData = searchResponse.data.data;
            totalRecords = searchResponse.data.totalRecords;
        } catch (error) {
            console.error(error);
        }

        const searchResult: IProject[] = projectsData.map(
            firestoreProjectToIProject
        );

        const userIDs = pluck("userUid", searchResult);

        if (!isEmpty(userIDs)) {
            const projectProfiles: Record<string, IProfile> = {};

            const profilesQuery = await getDocs(
                query(profiles, where(documentId(), "in", userIDs))
            );

            profilesQuery.forEach((snapshot: DocumentData) => {
                projectProfiles[snapshot.id] = snapshot.data();
                if (projectProfiles[snapshot.id]?.userJoinDate) {
                    projectProfiles[snapshot.id].userJoinDate = (
                        projectProfiles[snapshot.id]
                            .userJoinDate as unknown as Timestamp
                    ).toMillis();
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

/** Load missing author profiles once, even when several projects share an author. */
const fetchRankingProfiles = async (
    userIDs: string[],
    dispatch: AppThunkDispatch,
    getState: () => RootState
) => {
    const existing = getState().HomeReducer.profiles;
    const missing = [...new Set(userIDs)].filter(
        (uid) => uid && !existing[uid]
    );
    if (!missing.length) return;
    const snapshot = await getDocs(
        query(profiles, where(documentId(), "in", missing))
    );
    const payload: Record<string, IProfile> = {};
    snapshot.forEach((document: DocumentData) => {
        const profile = document.data();
        payload[document.id] = {
            ...profile,
            ...(profile.userJoinDate
                ? { userJoinDate: profile.userJoinDate.toMillis() }
                : {})
        };
    });
    dispatch({ type: ADD_USER_PROFILES, payload });
};

export const fetchPopularProjects = () => {
    return async (
        dispatch: AppThunkDispatch,
        getState: () => RootState
    ): Promise<void> => {
        dispatch({ type: SET_POPULAR_PROJECTS_LOADING, isLoading: true });
        try {
            const response = await getPopularProjects({ count: 8 });
            const projects = response.data;
            // The old endpoint returned IDs without project details or star counts.
            if (
                !Array.isArray(projects) ||
                projects.some(
                    (project) =>
                        !project ||
                        typeof project.projectUid !== "string" ||
                        typeof project.starCount !== "number"
                )
            ) {
                throw new Error("Invalid popular projects response");
            }
            dispatch({ type: ADD_POPULAR_PROJECTS, payload: projects });
            await fetchRankingProfiles(
                projects.map((project) => project.userUid),
                dispatch,
                getState
            ).catch(console.error);
        } catch (error) {
            console.error(error);
            dispatch({
                type: SET_POPULAR_PROJECTS_ERROR,
                error: "Could not load popular projects."
            });
        } finally {
            dispatch({ type: SET_POPULAR_PROJECTS_LOADING, isLoading: false });
        }
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
            const projectProfiles: Record<string, IProfile> = {};

            const profilesQuery = await getDocs(
                query(profiles, where(documentId(), "in", missingProfiles))
            );

            profilesQuery.forEach((snapshot: DocumentData) => {
                projectProfiles[snapshot.id] = snapshot.data();
                if (projectProfiles[snapshot.id]?.userJoinDate) {
                    projectProfiles[snapshot.id].userJoinDate = (
                        projectProfiles[snapshot.id]
                            .userJoinDate as unknown as Timestamp
                    ).toMillis();
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

export const fetchPopularArtists = () => {
    return async (
        dispatch: AppThunkDispatch,
        getState: () => RootState
    ): Promise<void> => {
        dispatch({ type: SET_POPULAR_ARTISTS_LOADING, isLoading: true });
        try {
            const response = await getPopularArtists({ count: 8 });
            const artists = response.data || [];
            dispatch({ type: ADD_POPULAR_ARTISTS, payload: artists });
            await fetchRankingProfiles(
                artists.map((artist) => artist.userUid),
                dispatch,
                getState
            ).catch(console.error);
        } catch (error) {
            console.error(error);
            dispatch({
                type: SET_POPULAR_ARTISTS_ERROR,
                error: "Could not load popular artists."
            });
        } finally {
            dispatch({ type: SET_POPULAR_ARTISTS_LOADING, isLoading: false });
        }
    };
};
