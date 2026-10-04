import { getFunctions, httpsCallable } from "firebase/functions";

export interface UserSearchResult {
    userUid: string;
    username: string;
    displayName: string;
    bio: string;
    photoUrl: string;
    links: string[];
}
export interface UserSearchResponse {
    data: UserSearchResult[];
    nextOffset: number | null;
}

export async function searchUsers(query: string, offset: number) {
    const search = httpsCallable<
        { query: string; offset: number; limit: number },
        UserSearchResponse
    >(getFunctions(), "search_users");
    return (await search({ query, offset, limit: 8 })).data;
}
