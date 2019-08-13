interface IOpenDocument {
    editorInstance: any;
    uid: string;
}

export interface ITabDock {
    tabIndex: number;
    openDocuments: IOpenDocument[];
}

export interface ISession {
    projectUid: string;
    tabDock: ITabDock;
}
