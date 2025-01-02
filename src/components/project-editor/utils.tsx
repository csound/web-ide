import { IDocument } from "@comp/projects/types";
import { IOpenDocument } from "./types";

export const sortByStoredTabOrder = (
    tabOrder: string[],
    allDocuments: IDocument[]
): IOpenDocument[] => {
    return tabOrder.reduce(
        (accumulator: IOpenDocument[], documentUid: string) => {
            console.log("Document uid", allDocuments, documentUid);
            const maybeDocument: IDocument | undefined = allDocuments.find(
                (doc) => doc.documentUid === documentUid
            );
            return maybeDocument
                ? [
                      ...accumulator,
                      {
                          editorInstance: undefined,
                          uid: maybeDocument.documentUid
                      } as IOpenDocument
                  ]
                : accumulator;
        },
        []
    );
};
