export const tabOpenByDocumentUid = (
    projectUid: string,
    documentUid: string
) => {
    return async (dispatch: any) => {
        dispatch({
            type: "TAB_DOCK_OPEN_TAB_BY_DOCUMENT_UID",
            documentUid,
            projectUid
        });
    };
};
