import { append, find, propEq, reduce } from "ramda";
import { IDocument } from "@comp/Projects/types";
import { IOpenDocument } from "./types";

export const sortByStoredTabOrder = (
    tabOrder: string[],
    allDocuments: IDocument[]
): IOpenDocument[] => {
    return reduce(
        (acc: IOpenDocument[], docUid: string) => {
            const maybeDoc: IDocument | undefined = find(
                propEq("documentUid", docUid),
                allDocuments
            );
            if (maybeDoc) {
                return append(
                    {
                        editorInstance: null,
                        uid: maybeDoc.documentUid
                    } as IOpenDocument,
                    acc
                );
            } else {
                return acc;
            }
        },
        [],
        tabOrder
    );
};
