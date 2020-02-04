import React, { useState } from "react";
import { rgba } from "@styles/utils";
import useDnD from "./context";
import { useTheme } from "emotion-theming";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { useDispatch, useSelector } from "react-redux";
import Collapse from "@material-ui/core/Collapse";
import DescriptionIcon from "@material-ui/icons/Description";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import EditIcon from "@material-ui/icons/EditTwoTone";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import Tooltip from "@material-ui/core/Tooltip";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { ReactComponent as DirectoryClose } from "@root/svgs/fad-close.svg";
import { ReactComponent as DirectoryOpen } from "@root/svgs/fad-open.svg";
import { ReactComponent as WaveFormIcon } from "@root/svgs/fad-waveform.svg";
import * as SS from "./styles";
import FileTreeHeader from "./header";
import { IDocument, IDocumentsMap, IProject } from "../Projects/types";
import { deleteFile, renameDocument } from "../Projects/actions";
import { tabOpenByDocumentUid } from "@comp/ProjectEditor/actions";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import {
    addIndex,
    append,
    assoc,
    both,
    concat,
    find,
    filter,
    isEmpty,
    last,
    mergeAll,
    not,
    reduce,
    reject,
    sort,
    pathOr,
    pipe,
    propEq,
    propOr,
    values
} from "ramda";
import curry3 from "ramda/es/internal/_curry3";
const reduceIndexed = addIndex(reduce);

const RootRef = React.forwardRef((props: any, ref: any) => (
    <div ref={ref} {...props}>
        {props.children}
    </div>
));

const hopefulSorting = curry3((docIdx, docA, docB) => {
    const idxA = pathOr(null, [docA.documentUid, "index"], docIdx);
    const idxB = pathOr(null, [docB.documentUid, "index"], docIdx);
    if (idxA && idxB) {
        return idxA < idxB ? -1 : idxA > idxB ? 1 : 0;
    } else {
        return docA.filename < docB.filename
            ? -1
            : docA.filename > docB.filename
            ? 1
            : 0;
    }
});

const makeTree = (
    activeProjectUid,
    dispatch,
    collapseState,
    setCollapseState,
    isOwner,
    theme,
    path,
    [docIdx, elemArray],
    filelist
) => {
    const allDirs = filter(propEq("type", "folder"), filelist);
    const allFiles = filter(f => not(propEq("type", "folder", f)), filelist);
    const dragHoverCss = `{background-color: rgba(${rgba(
        theme.allowed.primary,
        0.1
    )}) !important;}`;

    // this could be problematic, but then again, we need to test what behaviour we want
    const sortedFiles = concat(
        sort(hopefulSorting(docIdx), allDirs),
        sort(hopefulSorting(docIdx), allFiles)
    );

    const currentFiles = filter(propEq("path", path || []), sortedFiles);
    const newFileList = reject(
        both(propEq("path", path || []), p => not(propEq("type", "folder", p))),
        sortedFiles
    );

    const folderDoc = !isEmpty(path)
        ? find(propEq("documentUid", last(path)), sortedFiles)
        : null;

    const folderClassName = `folder-${
        folderDoc ? folderDoc.documentUid : "root"
    }`;
    const deleteIcon = doc =>
        isOwner && (
            <Tooltip
                placement="right"
                title={`Delete ${propOr("", "filename", doc)}`}
            >
                <DeleteIcon
                    color="secondary"
                    css={SS.deleteIcon}
                    onClick={() =>
                        dispatch(deleteFile(activeProjectUid, doc.documentUid))
                    }
                />
            </Tooltip>
        );

    const editIcon = doc =>
        isOwner && (
            <Tooltip
                placement="right"
                title={`Rename ${propOr("", "filename", doc)}`}
            >
                <EditIcon
                    css={SS.editIcon}
                    onClick={() =>
                        dispatch(
                            renameDocument(activeProjectUid, doc.documentUid)
                        )
                    }
                />
            </Tooltip>
        );

    return reduceIndexed(
        ([docIdx, elemArray], doc: IDocument, index: number) => {
            if (propEq("type", "folder", doc)) {
                const folderPath = append(doc.documentUid, doc.path);
                const FolderIcon = (
                    <ListItemIcon
                        key={`${doc.documentUid}-folder`}
                        css={SS.listItemIcon}
                        style={{ left: 22 + 24 * path.length }}
                    >
                        {collapseState[doc.documentUid] ? (
                            <DirectoryOpen css={SS.directoryOpenIcon} />
                        ) : (
                            <DirectoryClose css={SS.directoryCloseIcon} />
                        )}
                    </ListItemIcon>
                );
                const [newDocIdx, newElemArray] = makeTree(
                    activeProjectUid,
                    dispatch,
                    collapseState,
                    setCollapseState,
                    isOwner,
                    theme,
                    folderPath,
                    [docIdx, []],
                    newFileList
                );
                return [
                    assoc(
                        doc.documentUid,
                        {
                            index,
                            parent: folderDoc ? folderDoc.documentUid : "root"
                        },
                        newDocIdx
                    ),
                    pipe(
                        append(
                            <Droppable
                                key={`${doc.documentUid}`}
                                droppableId={`${doc.documentUid}`}
                                direction="vertical"
                                mode="standard"
                            >
                                {(droppableProvided, droppableSnapshot) => (
                                    <RootRef ref={droppableProvided.innerRef}>
                                        <Draggable
                                            isDragDisabled={!isOwner}
                                            draggableId={`${doc.documentUid}`}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <ListItem
                                                    ref={provided.innerRef}
                                                    css={
                                                        droppableSnapshot.isDraggingOver
                                                            ? SS.draggingOver
                                                            : SS.listItem
                                                    }
                                                    onClick={() =>
                                                        setCollapseState(
                                                            assoc(
                                                                doc.documentUid,
                                                                not(
                                                                    collapseState[
                                                                        doc
                                                                            .documentUid
                                                                    ]
                                                                ),
                                                                collapseState
                                                            )
                                                        )
                                                    }
                                                    className={`folder-${doc.documentUid}`}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={
                                                        snapshot.isDragging
                                                            ? provided
                                                                  .draggableProps
                                                                  .style
                                                            : {}
                                                    }
                                                    button
                                                >
                                                    {FolderIcon}
                                                    {doc.filename}
                                                </ListItem>
                                            )}
                                        </Draggable>
                                        {deleteIcon(doc)}
                                        {editIcon(doc)}
                                        <Collapse
                                            timeout={{
                                                enter: 300,
                                                exit: 200
                                            }}
                                            in={collapseState[doc.documentUid]}
                                            key={`${doc.documentUid}-collapse`}
                                        >
                                            {newElemArray}
                                            <span
                                                className={`folder-${doc.documentUid}`}
                                            >
                                                {droppableProvided.placeholder}
                                            </span>
                                        </Collapse>
                                    </RootRef>
                                )}
                            </Droppable>
                        )
                    )(elemArray)
                ];
            } else {
                let IconComp;
                if (doc.type === "bin") {
                    IconComp = (
                        <ListItemIcon
                            key={`${doc.documentUid}-bin-icon`}
                            css={SS.listItemIcon}
                            style={{ left: 22 + 24 * path.length }}
                        >
                            <WaveFormIcon css={SS.mediaIcon} />
                        </ListItemIcon>
                    );
                } else if (
                    doc.filename.endsWith(".csd") ||
                    doc.filename.endsWith(".sco") ||
                    doc.filename.endsWith(".orc") ||
                    doc.filename.endsWith(".udo")
                ) {
                    IconComp = (
                        <ListItemIcon
                            css={SS.listItemIconMui}
                            key={`${doc.documentUid}-csd-icon`}
                            style={{ left: 12 + 24 * path.length }}
                        >
                            <DescriptionIcon css={SS.muiIcon} />
                        </ListItemIcon>
                    );
                } else {
                    IconComp = (
                        <ListItemIcon
                            css={SS.listItemIconMui}
                            key={`${doc.documentUid}-txt-icon`}
                            style={{ left: 12 + 24 * path.length }}
                        >
                            <InsertDriveFileIcon css={SS.muiIcon} />
                        </ListItemIcon>
                    );
                }

                return [
                    assoc(
                        doc.documentUid,
                        {
                            index,
                            parent: folderDoc ? folderDoc.documentUid : "root"
                        },
                        docIdx
                    ),
                    append(
                        <Droppable
                            droppableId={`${doc.documentUid}`}
                            key={`${doc.documentUid}-fragment`}
                        >
                            {(droppableProvided, droppableSnapshot) => (
                                <RootRef ref={droppableProvided.innerRef}>
                                    {droppableSnapshot.isDraggingOver && (
                                        <style>
                                            {`.${folderClassName} > span.MuiTouchRipple-root` +
                                                dragHoverCss}
                                        </style>
                                    )}
                                    <React.Fragment>
                                        <Draggable
                                            isDragDisabled={!isOwner}
                                            draggableId={`${doc.documentUid}`}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <ListItem
                                                    key={doc.documentUid}
                                                    ref={provided.innerRef}
                                                    css={SS.listItem}
                                                    className={folderClassName}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() =>
                                                        dispatch(
                                                            tabOpenByDocumentUid(
                                                                doc.documentUid,
                                                                activeProjectUid
                                                            )
                                                        )
                                                    }
                                                    style={mergeAll([
                                                        snapshot.isDragging
                                                            ? mergeAll([
                                                                  provided
                                                                      .draggableProps
                                                                      .style,
                                                                  {
                                                                      backgroundColor:
                                                                          "rgba(0, 0, 0, 0.1)"
                                                                  }
                                                              ])
                                                            : {},
                                                        {
                                                            paddingLeft:
                                                                32 +
                                                                path.length * 24
                                                        }
                                                    ])}
                                                    button
                                                >
                                                    {IconComp}
                                                    {doc.filename}
                                                </ListItem>
                                            )}
                                        </Draggable>
                                        {deleteIcon(doc)}
                                        {editIcon(doc)}
                                    </React.Fragment>
                                    {droppableProvided.placeholder}
                                </RootRef>
                            )}
                        </Droppable>,
                        elemArray
                    )
                ];
            }
        },
        [docIdx, elemArray],
        currentFiles
    );
};

const FileTree = () => {
    const [collapseState, setCollapseState] = useState({});
    // const [isLoaded, setIsLoaded] = useState(false);
    const [stateDnD] = useDnD();
    const dispatch = useDispatch();
    const theme = useTheme();
    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );
    const isOwner: boolean = useSelector(selectIsOwner(activeProjectUid));
    const project: IProject | null = useSelector(
        pathOr(null, ["ProjectsReducer", "projects", activeProjectUid])
    ) as IProject | null;

    const documents: IDocumentsMap | null = useSelector(
        pathOr(null, [
            "ProjectsReducer",
            "projects",
            activeProjectUid,
            "documents"
        ])
    );

    const filelist = values(documents || {});

    // useEffect(() => {
    //     if (isEmpty(keys(stateDnD.docIdx))) {
    //         const [docIdx] = makeTree(
    //             false,
    //             {},
    //             () => {},
    //             false,
    //             theme,
    //             [],
    //             [[], []],
    //             filelist
    //         );
    //         if (!isEmpty(keys(docIdx))) {
    //             dispatchDnD({
    //                 type: "setDocIdx",
    //                 docIdx
    //             });
    //             setIsLoaded(true);
    //         }
    //     }
    // }, [stateDnD.docIdx, dispatchDnD, filelist]);

    return (
        project && (
            <React.Fragment>
                <div css={SS.container}>
                    <List css={SS.listContainer} dense>
                        {
                            makeTree(
                                activeProjectUid,
                                dispatch,
                                collapseState,
                                setCollapseState,
                                isOwner,
                                theme,
                                [],
                                [stateDnD.docIdx, []],
                                filelist
                            )[1]
                        }
                    </List>
                </div>
                {project && (
                    <FileTreeHeader isOwner={isOwner} project={project} />
                )}
            </React.Fragment>
        )
    );
};

export default FileTree;
