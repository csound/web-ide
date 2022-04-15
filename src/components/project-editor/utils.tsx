import { append, find, propEq, reduce } from "ramda";
import { IDocument } from "@comp/projects/types";
import { IOpenDocument } from "./types";

export const sortByStoredTabOrder = (
    tabOrder: string[],
    allDocuments: IDocument[]
): IOpenDocument[] => {
    return reduce(
        (accumulator: IOpenDocument[], documentUid: string) => {
            const maybeDocument: IDocument | undefined = find(
                propEq("documentUid", documentUid),
                allDocuments
            );
            return maybeDocument
                ? append(
                      {
                          editorInstance: undefined,
                          uid: maybeDocument.documentUid
                      } as IOpenDocument,
                      accumulator
                  )
                : accumulator;
        },
        [],
        tabOrder
    );
};
