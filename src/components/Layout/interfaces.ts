export interface ITabDock {
    tabIndex: number;
    openDocumentUids: string[];
}

export interface ISession {
    projectUid: string;
    tabDock: ITabDock;
}
