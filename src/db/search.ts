import firebase from "firebase/app";

export interface ISearchResultItem {
    id: string;
    created: firebase.firestore.Timestamp;
    description: string;
    iconBackgroundColor: string;
    iconForegroundColor: string;
    iconName: string;
    name: string;
    public: boolean;
    userUid: string;
}

export interface ISearchResult {
    data: ISearchResultItem[];
    totalRecords: number;
}

interface IStarredProjectMeta {
    id: string;
    count: number;
}

type IStar = { [userUid: string]: firebase.firestore.Timestamp };

export type IStarredProject = IStarredProjectMeta & IStar;

export type IStarredProjectSearchResult = {
    data: IStarredProject[];
    totalRecords: number;
};
