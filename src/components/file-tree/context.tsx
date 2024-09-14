import { collection, doc, updateDoc } from "firebase/firestore";
import { DragDropContext } from "react-beautiful-dnd";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import React, { createContext, useContext, useReducer } from "react";
import { IProject } from "@comp/projects/types";
import { listifyObject } from "@root/utils";
import { getFirebaseTimestamp, projects } from "@config/firestore";
import {
    addIndex,
    append,
    ascend,
    assoc,
    assocPath,
    equals,
    filter,
    map,
    move,
    path,
    pathOr,
    prop,
    propEq,
    reduce,
    sort
} from "ramda";

type DnDState = {
    docIdx: Record<string, any>;
};

const initialState: DnDState = { docIdx: {} };

export const DnDStateContext = createContext(initialState);

export const DnDDispatchContext = createContext(
    (dispatch: Record<string, any>): void => {}
);

const reduceIndexed = addIndex(reduce);

const reducer = (state: DnDState, action: Record<string, any>): DnDState => {
    switch (action.type) {
        case "handleDrop": {
            if (
                action.payload.reason === "DROP" &&
                action.payload.destination
            ) {
                const destinationUid = action.payload.destination.droppableId;
                const sourceUid = action.payload.source.droppableId;
                const destinationDocument =
                    action.project.documents[destinationUid];
                const sourceDocument = action.project.documents[sourceUid];

                if (destinationDocument.type === "folder") {
                    updateDoc(
                        doc(
                            collection(
                                doc(projects, action.project.projectUid),
                                "files"
                            ),
                            sourceUid
                        ),
                        {
                            path: append(
                                destinationUid,
                                destinationDocument.path || []
                            ),
                            lastModified: getFirebaseTimestamp()
                        }
                    );
                    updateProjectLastModified(action.project.projectUid);
                } else if (
                    !equals(destinationDocument.path, sourceDocument.path)
                ) {
                    updateDoc(
                        doc(
                            collection(
                                doc(projects, action.project.projectUid),
                                "files"
                            ),
                            sourceUid
                        ),
                        {
                            path: destinationDocument.path || [],
                            lastModified: getFirebaseTimestamp()
                        }
                    );

                    updateProjectLastModified(action.project.projectUid);
                }
            }
            return state;
        }
        // WIP
        case "reorder": {
            // const docUid = pathOr(null, ["payload", "draggableId"], action);
            const sourceIndex = pathOr(
                0,
                ["payload", "source", "index"],
                action
            );
            const destinationId = pathOr(
                "",
                ["payload", "destination", "droppableId"],
                action
            );
            const destinationIndex = pathOr(
                0,
                ["payload", "destination", "index"],
                action
            );
            const destinationDirectoryFiles = filter(
                propEq("parent", destinationId),
                state.docIdx
            );

            const sortableList = map(
                (x) => ({
                    index: path(["val", "index"], x),
                    uid: prop("key", x)
                }),
                listifyObject(destinationDirectoryFiles)
            );
            const filesToReorder = sort(ascend(prop("index")), sortableList);
            const reorderedFiles = move(
                sourceIndex,
                destinationIndex,
                filesToReorder
            );

            const newState = reduceIndexed(
                (accumulator, item: any, newIndex) =>
                    assocPath(
                        ["docIdx", item.uid, "index"],
                        newIndex,
                        accumulator
                    ),
                state as DnDState,
                reorderedFiles
            );

            return newState as DnDState;
        }
        case "setDocIdx": {
            return assoc("docIdx", action.docIdx, state);
        }
        default: {
            return state;
        }
    }
};

export const DnDProvider = ({
    children,
    project
}: {
    children: React.ReactElement;
    project: IProject;
}): React.ReactElement => {
    const [state, dispatch]: [DnDState, (action: Record<string, any>) => void] =
        useReducer(reducer, initialState);

    return (
        <DragDropContext
            onDragEnd={(result) =>
                dispatch({ type: "handleDrop", payload: result, project })
            }
        >
            <DnDStateContext.Provider value={state}>
                <DnDDispatchContext.Provider value={dispatch}>
                    {children}
                </DnDDispatchContext.Provider>
            </DnDStateContext.Provider>
        </DragDropContext>
    );
};

export const useDnDState = (): DnDState | undefined => {
    const context = useContext(DnDStateContext);
    if (context === undefined) {
        throw new Error("useDnDState must be used within a DnDProvider");
    }
    return context;
};

export const useDnDDispatch = ():
    | undefined
    | ((dispatch: Record<string, any>) => void) => {
    const context = useContext(DnDDispatchContext);
    if (context === undefined) {
        throw new Error("useDnD must be used within a DnDProvider");
    }
    return context;
};

export const useDnD = (): [DnDState | undefined, any] => [
    useDnDState(),
    useDnDDispatch()
];
