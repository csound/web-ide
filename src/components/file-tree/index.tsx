import React, { useState, useCallback } from "react";
import {
    addIndex,
    append,
    assoc,
    both,
    concat,
    curry,
    find,
    filter,
    isEmpty,
    last,
    mergeAll,
    not,
    reduce,
    reject,
    sort,
    path,
    pathOr,
    pipe,
    propEq,
    propOr,
    values
} from "ramda";
import { getType as mimeLookup } from "mime";
import moment from "moment";
import { rgba } from "@styles/utils";
import { useTheme } from "@emotion/react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { useDispatch, useSelector } from "react-redux";
import Collapse from "@material-ui/core/Collapse";
// import DescriptionIcon from "@material-ui/icons/Description";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import {
    CsdFileIcon,
    OrcFileIcon,
    ScoFileIcon,
    UdoFileIcon
} from "@elem/filetype-icons";
import EditIcon from "@material-ui/icons/EditTwoTone";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import DownloadIcon from "@mui/icons-material/Download";
import Tooltip from "@material-ui/core/Tooltip";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { ReactComponent as DirectoryClose } from "@root/svgs/fad-close.svg";
import { ReactComponent as DirectoryOpen } from "@root/svgs/fad-open.svg";
import { ReactComponent as WaveFormIcon } from "@root/svgs/fad-waveform.svg";
import { IDocument, IDocumentsMap, IProject } from "../projects/types";
import { deleteFile, renameDocument } from "../projects/actions";
import {
    tabOpenByDocumentUid,
    tabOpenNonCloudDocument
} from "@comp/project-editor/actions";
import {
    selectIsOwner,
    selectCurrentTabDocumentUid
} from "@comp/project-editor/selectors";
import { useDnD } from "./context";
import * as SS from "./styles";
import FileTreeHeader from "./header";
import { selectNonCloudFiles } from "./selectors";
import { NonCloudFile } from "./types";

const reduceIndexed = addIndex(reduce);

const RootReference = React.forwardRef((properties: any, reference: any) => (
    <div ref={reference} {...properties}>
        {properties.children}
    </div>
));

RootReference.displayName = "FileTree";

const hopefulSorting = curry((documentIndex, documentA, documentB) => {
    const indexA = path([documentA.documentUid, "index"], documentIndex);
    const indexB = path([documentB.documentUid, "index"], documentIndex);
    if (indexA && indexB) {
        return indexA < indexB ? -1 : indexA > indexB ? 1 : 0;
    } else {
        return documentA.filename < documentB.filename
            ? -1
            : documentA.filename > documentB.filename
            ? 1
            : 0;
    }
});

const humanizeBytes = (size: number) => {
    const gb = Math.pow(1024, 3);
    const mb = Math.pow(1024, 2);
    const kb = 1024;

    if (size >= gb) {
        return Math.floor(size / gb) + " GB";
    } else if (size >= mb) {
        return Math.floor(size / mb) + " MB";
    } else if (size >= kb) {
        return Math.floor(size / kb) + " KB";
    } else {
        return size + " Bytes";
    }
};

function DownloadNonCloudFileIcon({
    file,
    mimeType
}: {
    file: NonCloudFile;
    mimeType: string;
}): JSX.Element {
    const onClick = useCallback(() => {
        const blob = new Blob([file.buffer], { type: mimeType });
        const tmpUrl = URL.createObjectURL(blob);
        (window as any).open(tmpUrl);
    }, [file, mimeType]);

    return (
        <Tooltip
            placement="right"
            title={
                <>
                    {`Download ${propOr("", "name", file)} (${humanizeBytes(
                        file.buffer.length
                    )})`}
                    <br />{" "}
                    <small>{`Created: ${moment(
                        file.createdAt
                    ).fromNow()}`}</small>
                </>
            }
        >
            <DownloadIcon css={SS.editIcon} onClick={onClick} />
        </Tooltip>
    );
}

function FileExtIcon({
    isBinary,
    filename,
    nestingDepth = 0
}: {
    isBinary: boolean;
    filename: string;
    nestingDepth?: number;
}): JSX.Element {
    if (isBinary) {
        return (
            <ListItemIcon
                css={SS.listItemIcon}
                style={{ marginLeft: 24 * nestingDepth }}
            >
                <WaveFormIcon css={SS.mediaIcon} />
            </ListItemIcon>
        );
    }

    return filename.endsWith(".csd") ||
        filename.endsWith(".sco") ||
        filename.endsWith(".orc") ||
        filename.endsWith(".udo") ? (
        <ListItemIcon
            css={SS.listItemIconMui}
            style={{
                left: 6,
                marginLeft: 24 * nestingDepth
            }}
        >
            <span css={SS.csoundFileIcon}>
                {filename.endsWith(".csd") ? (
                    <CsdFileIcon />
                ) : filename.endsWith(".orc") ? (
                    <OrcFileIcon />
                ) : filename.endsWith(".sco") ? (
                    <ScoFileIcon />
                ) : filename.endsWith(".udo") ? (
                    <UdoFileIcon />
                ) : (
                    <CsdFileIcon />
                )}
            </span>
        </ListItemIcon>
    ) : (
        <ListItemIcon
            css={SS.listItemIconMui}
            style={{ left: 0 + 24 * nestingDepth }}
        >
            <InsertDriveFileIcon css={SS.muiIcon} />
        </ListItemIcon>
    );
}

const makeTree = (
    activeProjectUid,
    currentTabDocumentUid,
    dispatch,
    collapseState,
    setCollapseState,
    isOwner,
    theme,
    path,
    [documentIndex, elementArray],
    filelist
) => {
    const allDirectories = filter(propEq("type", "folder"), filelist);
    const allFiles = filter((f) => not(propEq("type", "folder", f)), filelist);
    const dragHoverCss = `{background-color: rgba(${rgba(
        theme.allowed,
        0.1
    )}) !important;}`;

    // this could be problematic, but then again, we need to test what behaviour we want
    const sortedFiles = concat(
        sort(hopefulSorting(documentIndex), allDirectories),
        sort(hopefulSorting(documentIndex), allFiles)
    );

    const currentFiles = filter(propEq("path", path || []), sortedFiles);
    const newFileList = reject(
        both(propEq("path", path || []), (p) =>
            not(propEq("type", "folder", p))
        ),
        sortedFiles
    );

    const folderDocument =
        !isEmpty(path) && find(propEq("documentUid", last(path)), sortedFiles);

    const folderClassName = `folder-${
        folderDocument ? folderDocument.documentUid : "root"
    }`;
    const deleteIcon = (document_) =>
        isOwner && (
            <Tooltip
                placement="right"
                title={`Delete ${propOr("", "filename", document_)}`}
            >
                <DeleteIcon
                    color="secondary"
                    css={SS.deleteIcon}
                    onClick={() =>
                        dispatch(
                            deleteFile(activeProjectUid, document_.documentUid)
                        )
                    }
                />
            </Tooltip>
        );

    const editIcon = (document_) =>
        isOwner && (
            <Tooltip
                placement="right"
                title={`Rename ${propOr("", "filename", document_)}`}
            >
                <EditIcon
                    css={SS.editIcon}
                    onClick={() =>
                        dispatch(
                            renameDocument(
                                activeProjectUid,
                                document_.documentUid
                            )
                        )
                    }
                />
            </Tooltip>
        );

    return reduceIndexed(
        (
            [documentIndex_, elementArray_],
            document_: IDocument,
            index: number
        ) => {
            if (propEq("type", "folder", document_)) {
                const folderPath = append(
                    document_.documentUid,
                    document_.path
                );
                const FolderIcon = (
                    <ListItemIcon
                        key={`${document_.documentUid}-folder`}
                        css={SS.listItemIcon}
                        style={{ left: 1 + (24 * path.length - 1) }}
                    >
                        {collapseState[document_.documentUid] ? (
                            <DirectoryOpen css={SS.directoryOpenIcon} />
                        ) : (
                            <DirectoryClose css={SS.directoryCloseIcon} />
                        )}
                    </ListItemIcon>
                );
                const [newDocumentIndex, newElementArray] = makeTree(
                    activeProjectUid,
                    currentTabDocumentUid,
                    dispatch,
                    collapseState,
                    setCollapseState,
                    isOwner,
                    theme,
                    folderPath,
                    [documentIndex_, []],
                    newFileList
                );
                return [
                    assoc(
                        document_.documentUid,
                        {
                            index,
                            parent: folderDocument
                                ? folderDocument.documentUid
                                : "root"
                        },
                        newDocumentIndex
                    ),
                    pipe(
                        append(
                            <Droppable
                                key={`${document_.documentUid}`}
                                droppableId={`${document_.documentUid}`}
                                direction="vertical"
                                mode="standard"
                            >
                                {(droppableProvided, droppableSnapshot) => (
                                    <RootReference
                                        ref={droppableProvided.innerRef}
                                    >
                                        <Draggable
                                            isDragDisabled={!isOwner}
                                            draggableId={`${document_.documentUid}`}
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
                                                                document_.documentUid,
                                                                not(
                                                                    collapseState[
                                                                        document_
                                                                            .documentUid
                                                                    ]
                                                                ),
                                                                collapseState
                                                            )
                                                        )
                                                    }
                                                    className={`folder-${document_.documentUid}`}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={mergeAll([
                                                        snapshot.isDragging
                                                            ? provided
                                                                  .draggableProps
                                                                  .style
                                                            : {},
                                                        {
                                                            paddingLeft: 40,
                                                            height: 36
                                                        }
                                                    ])}
                                                    button
                                                >
                                                    {FolderIcon}
                                                    {document_.filename}
                                                    <div
                                                        css={
                                                            SS.delEditContainer
                                                        }
                                                    >
                                                        {deleteIcon(document_)}
                                                        {editIcon(document_)}
                                                    </div>
                                                </ListItem>
                                            )}
                                        </Draggable>

                                        <Collapse
                                            timeout={{
                                                enter: 300,
                                                exit: 200
                                            }}
                                            in={
                                                collapseState[
                                                    document_.documentUid
                                                ]
                                            }
                                            key={`${document_.documentUid}-collapse`}
                                        >
                                            {newElementArray}
                                            <span
                                                className={`folder-${document_.documentUid}`}
                                            >
                                                {droppableProvided.placeholder}
                                            </span>
                                        </Collapse>
                                    </RootReference>
                                )}
                            </Droppable>
                        )
                    )(elementArray_)
                ];
            } else {
                return [
                    assoc(
                        document_.documentUid,
                        {
                            index,
                            parent: folderDocument
                                ? folderDocument.documentUid
                                : "root"
                        },
                        documentIndex_
                    ),
                    append(
                        <Droppable
                            droppableId={`${document_.documentUid}`}
                            key={`${document_.documentUid}-fragment`}
                        >
                            {(droppableProvided, droppableSnapshot) => (
                                <RootReference ref={droppableProvided.innerRef}>
                                    {droppableSnapshot.isDraggingOver && (
                                        <style>
                                            {`.${folderClassName} > span.MuiTouchRipple-root` +
                                                dragHoverCss}
                                        </style>
                                    )}
                                    <React.Fragment>
                                        <Draggable
                                            isDragDisabled={!isOwner}
                                            draggableId={`${document_.documentUid}`}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <ListItem
                                                    key={document_.documentUid}
                                                    ref={provided.innerRef}
                                                    css={SS.listItem}
                                                    className={folderClassName}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() =>
                                                        dispatch(
                                                            tabOpenByDocumentUid(
                                                                document_.documentUid,
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
                                                                40 +
                                                                24 *
                                                                    path.length,
                                                            height: 36,
                                                            backgroundColor:
                                                                currentTabDocumentUid ===
                                                                document_.documentUid
                                                                    ? "rgba(0,0,0,0.2)"
                                                                    : "inherit"
                                                        }
                                                    ])}
                                                    button
                                                >
                                                    <FileExtIcon
                                                        isBinary={
                                                            document_.type ===
                                                            "bin"
                                                        }
                                                        filename={
                                                            document_.filename
                                                        }
                                                    />

                                                    <p css={SS.filenameStyle}>
                                                        {document_.filename}
                                                    </p>
                                                    <div
                                                        css={
                                                            SS.delEditContainer
                                                        }
                                                    >
                                                        {deleteIcon(document_)}
                                                        {editIcon(document_)}
                                                    </div>
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    </React.Fragment>
                                    {droppableProvided.placeholder}
                                </RootReference>
                            )}
                        </Droppable>,
                        elementArray_
                    )
                ];
            }
        },
        [documentIndex, elementArray],
        currentFiles
    );
};

const FileTree = (): React.ReactElement => {
    const [collapseState, setCollapseState] = useState({});
    // const [isLoaded, setIsLoaded] = useState(false);
    const [stateDnD] = useDnD();
    const dispatch = useDispatch();
    const theme = useTheme();
    const activeProjectUid: string = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const nonCloudFiles = useSelector(selectNonCloudFiles);

    const isOwner: boolean = useSelector(selectIsOwner(activeProjectUid));
    const project: IProject | undefined = useSelector(
        path(["ProjectsReducer", "projects", activeProjectUid])
    );

    const documents: IDocumentsMap | undefined = useSelector(
        path(["ProjectsReducer", "projects", activeProjectUid, "documents"])
    );

    const currentTabDocumentUid = useSelector(selectCurrentTabDocumentUid);

    const filelist = values(documents || {});

    return (
        <React.Fragment>
            {stateDnD && project && (
                <div css={SS.container}>
                    <List css={SS.listContainer} dense>
                        {
                            makeTree(
                                activeProjectUid,
                                currentTabDocumentUid,
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
                        {nonCloudFiles.length > 0 && <hr />}
                        {nonCloudFiles.map((file, index) => {
                            const mimeType = mimeLookup(file.name);

                            return (
                                <div
                                    key={file.name + index}
                                    style={{
                                        paddingLeft: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <ListItem
                                        onClick={() =>
                                            dispatch(
                                                tabOpenNonCloudDocument(
                                                    file,
                                                    mimeType
                                                )
                                            )
                                        }
                                        css={SS.listItem}
                                        style={{
                                            position: "relative",
                                            height: "42px"
                                        }}
                                    >
                                        <FileExtIcon
                                            filename={file.name}
                                            isBinary={mimeType.startsWith(
                                                "audio"
                                            )}
                                            nestingDepth={0}
                                        />
                                        <p css={SS.filenameStyle}>
                                            {file.name}
                                        </p>
                                        <DownloadNonCloudFileIcon
                                            file={file}
                                            mimeType={mimeType}
                                        />
                                    </ListItem>
                                </div>
                            );
                        })}
                    </List>
                    <FileTreeHeader isOwner={isOwner} project={project} />
                </div>
            )}
        </React.Fragment>
    );
};

export default FileTree;
