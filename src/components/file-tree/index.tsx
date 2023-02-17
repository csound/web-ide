import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "@root/store";
import { getAuth } from "firebase/auth";
import { uploadBytesResumable } from "firebase/storage";
import { addDoc, collection, doc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import {
    getFirebaseTimestamp,
    projects,
    storageReference
} from "@config/firestore";
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
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { rgba } from "@styles/utils";
import { useTheme } from "@emotion/react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
    CsdFileIcon,
    OrcFileIcon,
    ScoFileIcon,
    UdoFileIcon
} from "@elem/filetype-icons";
import EditIcon from "@mui/icons-material/EditTwoTone";
import DeleteIcon from "@mui/icons-material/DeleteTwoTone";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import { ReactComponent as DirectoryClose } from "@root/svgs/fad-close.svg";
import { ReactComponent as DirectoryOpen } from "@root/svgs/fad-open.svg";
import { ReactComponent as WaveFormIcon } from "@root/svgs/fad-waveform.svg";
import { IDocument, IDocumentsMap, IProject } from "../projects/types";
import { deleteFile, renameDocument } from "../projects/actions";
import { textOrBinary } from "@comp/projects/utils";
import {
    tabClose,
    tabOpenByDocumentUid,
    tabOpenNonCloudDocument
} from "@comp/project-editor/actions";
import {
    selectIsOwner,
    selectCurrentTabDocumentUid
} from "@comp/project-editor/selectors";
import { nonCloudFiles, deleteNonCloudFiles } from "./actions";
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

function UploadNonCloudFileIcon({
    file,
    projectUid,
    mimeType
}: {
    file: NonCloudFile;
    projectUid: string;
    mimeType: string;
}): JSX.Element {
    const dispatch = useDispatch();
    const [uploadProgress, setUploadProgress] = useState(-1);

    const handleUpload = React.useCallback(() => {
        const txtOrBin = textOrBinary(file.name);
        const currentUser = getAuth().currentUser;
        const uid = currentUser ? currentUser.uid : "";
        const documentId = uuidv4();

        if (txtOrBin === "txt") {
            const utf8decoder = new TextDecoder();
            const txt = utf8decoder.decode(file.buffer);
            const document_ = {
                type: txtOrBin,
                name: file.name,
                value: txt,
                userUid: uid,
                lastModified: getFirebaseTimestamp(),
                created: getFirebaseTimestamp()
            };

            addDoc(
                collection(doc(projects, projectUid), "files"),
                document_
            ).then((result) => {
                const documentUid = result.id;
                dispatch(tabOpenByDocumentUid(documentUid, projectUid));
            });
        } else {
            const metadata = {
                contentType:
                    mimeType ??
                    mimeType ??
                    (txtOrBin ? "application/octet-stream" : "text/plain"),
                customMetadata: {
                    filename: file.name,
                    projectUid,
                    userUid: uid,
                    docUid: documentId
                }
            };

            storageReference(`${uid}/${projectUid}/${documentId}`).then(
                (ref) => {
                    const uploadTask = uploadBytesResumable(
                        ref,
                        file.buffer,
                        metadata
                    );
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress =
                                (snapshot.bytesTransferred /
                                    snapshot.totalBytes) *
                                100;
                            setUploadProgress(progress);
                            // console.log("Upload is " + progress + "% done");
                        },
                        (error) => {
                            console.error(error);
                            dispatch(
                                openSnackbar(error.message, SnackbarType.Error)
                            );
                        },
                        () => {
                            dispatch(tabClose(projectUid, file.name, false));
                            dispatch(deleteNonCloudFiles(file.name));
                            nonCloudFiles.delete(file.name);
                            setUploadProgress(-1);
                            dispatch(
                                openSnackbar(
                                    "Upload done, the file should appear in a second...",
                                    SnackbarType.Info
                                )
                            );
                        }
                    );
                }
            );
        }
    }, [dispatch, file, projectUid, setUploadProgress, mimeType]);

    return uploadProgress > -1 ? (
        <div
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                backgroundColor: "rebeccapurple",
                zIndex: 10,
                userSelect: "none",
                cursor: "initial"
            }}
        >
            <div
                style={{
                    margin: "auto",
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    lineHeight: "35px"
                }}
            >{`Upload: ${uploadProgress}%`}</div>
        </div>
    ) : (
        <Tooltip
            placement="right"
            title={
                <>
                    {`Upload ${propOr("", "name", file)} (${humanizeBytes(
                        file.buffer.length
                    )}) to your project`}
                    <br />{" "}
                    <small>{`Created: ${moment(
                        file.createdAt
                    ).fromNow()}`}</small>
                </>
            }
        >
            <UploadIcon
                css={SS.editIcon}
                onClick={handleUpload}
                style={{ marginRight: "6px" }}
            />
        </Tooltip>
    );
}

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
                style={{
                    left: 6,
                    marginLeft: 24 * nestingDepth
                }}
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
            style={{
                left: 0,
                marginLeft: 24 * nestingDepth
            }}
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
                                                >
                                                    {FolderIcon}
                                                    <Box
                                                        marginLeft="24px"
                                                        padding="0"
                                                    >
                                                        {document_.filename}
                                                    </Box>
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
                                                    sx={{
                                                        paddingLeft:
                                                            40 +
                                                            24 * path.length +
                                                            "px !important"
                                                    }}
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
                                                            height: 36,
                                                            backgroundColor:
                                                                currentTabDocumentUid ===
                                                                document_.documentUid
                                                                    ? "rgba(0,0,0,0.2)"
                                                                    : "inherit"
                                                        }
                                                    ])}
                                                >
                                                    <FileExtIcon
                                                        nestingDepth={
                                                            path.length
                                                        }
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
                                                    <Box
                                                        css={
                                                            SS.delEditContainer
                                                        }
                                                    >
                                                        {deleteIcon(document_)}
                                                        {editIcon(document_)}
                                                    </Box>
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

    const nonCloudFileTreeEntries: string[] = useSelector(selectNonCloudFiles);
    const nonCloudFileSources: NonCloudFile[] = [];

    for (const ncfEntry of nonCloudFileTreeEntries) {
        if (nonCloudFiles.has(ncfEntry)) {
            nonCloudFileSources.push(
                nonCloudFiles.get(ncfEntry) as NonCloudFile
            );
        }
    }
    // console.log({ nonCloudFileSources, nonCloudFileTreeEntries });
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
                        {nonCloudFileSources.length > 0 && <hr />}
                        {nonCloudFileSources.map((file, index) => {
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
                                                    file.name,
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
                                        <p
                                            css={SS.filenameStyle}
                                            style={{
                                                marginLeft: "16px",
                                                marginRight: "8px"
                                            }}
                                        >
                                            {file.name}
                                        </p>
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                        >
                                            <UploadNonCloudFileIcon
                                                file={file}
                                                mimeType={mimeType}
                                                projectUid={activeProjectUid}
                                            />
                                            <DownloadNonCloudFileIcon
                                                file={file}
                                                mimeType={mimeType}
                                            />
                                        </Box>
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
