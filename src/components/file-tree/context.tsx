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
    curry,
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

export const DnDStateContext = createContext({});
export const DnDDispatchContext = createContext({});

interface DnDState {
    docIdx?: any;
}

const reduceIndexed = addIndex(reduce);

const reducer = curry((state, action) => {
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
                    projects
                        .doc(action.project.projectUid)
                        .collection("files")
                        .doc(sourceUid)
                        .update({
                            path: append(
                                destinationUid,
                                destinationDocument.path || []
                            ),
                            lastModified: getFirebaseTimestamp()
                        });
                    updateProjectLastModified(action.project.projectUid);
                } else if (
                    !equals(destinationDocument.path, sourceDocument.path)
                ) {
                    projects
                        .doc(action.project.projectUid)
                        .collection("files")
                        .doc(sourceUid)
                        .update({
                            path: destinationDocument.path || [],
                            lastModified: getFirebaseTimestamp()
                        });
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
                (accumulator, item, newIndex) =>
                    assocPath(
                        ["docIdx", item.uid, "index"],
                        newIndex,
                        accumulator
                    ),
                state,
                reorderedFiles
            );

            return newState;
        }
        case "setDocIdx": {
            return assoc("docIdx", action.docIdx, state);
        }
        default: {
            return state;
        }
    }
});

export const DnDProvider = ({
    children,
    project
}: {
    children: React.ReactElement;
    project: IProject;
}): React.ReactElement => {
    const [state, dispatch]: [any, any] = useReducer(reducer, {
        docIdx: {}
    });

    return (
        <DragDropContext
            onDragEnd={(result) =>
                dispatch({ type: "handleDrop", payload: result, project })
            }
        >
            <DnDStateContext.Provider value={state as any}>
                <DnDDispatchContext.Provider value={dispatch}>
                    {children}
                </DnDDispatchContext.Provider>
            </DnDStateContext.Provider>
        </DragDropContext>
    );
};

export const useDnDState = (): React.ReactContext => {
    const context = useContext(DnDStateContext);
    if (context === undefined) {
        throw new Error("useDnDState must be used within a DnDProvider");
    }
    return context;
};

export const useDnDDispatch = (): React.ReactContext => {
    const context = useContext(DnDDispatchContext);
    if (context === undefined) {
        throw new Error("useDnD must be used within a DnDProvider");
    }
    return context;
};

export const useDnD = (): [DnDState, any] => [useDnDState(), useDnDDispatch()];
