import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Breadcrumbs,
    Button,
    LinearProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography
} from "@mui/material";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import CreateNewFolderOutlined from "@mui/icons-material/CreateNewFolderOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { store, useDispatch, useSelector } from "@root/store";
import { ProfileDialog } from "@comp/profile/profile-dialog";
import { closeModal } from "@comp/modal/actions";
import { tabOpenByDocumentUid } from "@comp/project-editor/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { ADD_PROJECT_DOCUMENTS } from "./types";
import type { SaveAsSource } from "./save-as-source";
import {
    destinationError,
    listSaveAsProjects,
    loadSaveAsDestination,
    sameFolder,
    saveTextAs,
    type SaveAsEntry,
    type SaveAsProject
} from "./save-as";

export interface SaveAsDialogProps {
    source: SaveAsSource;
    onSubmittingChange?: (busy: boolean) => void;
}

export function SaveAsDialog({
    source,
    onSubmittingChange
}: SaveAsDialogProps) {
    const dispatch = useDispatch();
    const uid = useSelector((state) => state.LoginReducer.loggedInUid) || "";
    const formId = useId();
    const filenameInput = useRef<HTMLInputElement>(null);
    const [projects, setProjects] = useState<SaveAsProject[]>([]);
    const [projectUid, setProjectUid] = useState("");
    const [destination, setDestination] =
        useState<Awaited<ReturnType<typeof loadSaveAsDestination>>>();
    const [path, setPath] = useState<string[]>([]);
    const [folders, setFolders] = useState<SaveAsEntry[]>([]);
    const [filename, setFilename] = useState(source.filename);
    const [folderName, setFolderName] = useState("");
    const [addingFolder, setAddingFolder] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingDestination, setLoadingDestination] = useState(false);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const [busy, setBusy] = useState(false);
    const saving = useRef(false);
    const suggestedName = useRef(false);
    const [saved, setSaved] = useState<SaveAsProject>();
    const entries = useMemo(
        () => [...(destination?.entries || []), ...folders],
        [destination, folders]
    );
    const currentProject = destination?.project;
    const ready =
        !!currentProject &&
        currentProject.id === projectUid &&
        !loadingDestination &&
        !loadingProjects;
    const fileError = ready
        ? destinationError(filename, path, entries)
        : undefined;
    const folderError = destinationError(folderName, path, entries);
    const visible = useMemo(
        () =>
            entries
                .filter((entry) => sameFolder(entry.path, path))
                .sort(
                    (a, b) =>
                        Number(b.type === "folder") -
                            Number(a.type === "folder") ||
                        a.name.localeCompare(b.name)
                ),
        [entries, path]
    );
    const close = () => {
        if (!saving.current) dispatch(closeModal());
    };

    useEffect(() => {
        let cancelled = false;
        setLoadingProjects(true);
        setProjects([]);
        setDestination(undefined);
        setProjectUid("");
        setError("");
        void listSaveAsProjects(uid)
            .then((items) => {
                if (cancelled) return;
                setProjects(items);
                setProjectUid(
                    items.find((item) => item.id === source.projectUid)?.id ||
                        items[0]?.id ||
                        ""
                );
            })
            .catch((error) => {
                if (!cancelled)
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load projects."
                    );
            })
            .finally(() => {
                if (!cancelled) setLoadingProjects(false);
            });
        return () => {
            cancelled = true;
        };
    }, [uid, source.projectUid, retry]);

    useEffect(() => {
        if (!projectUid) return;
        let cancelled = false;
        setLoadingDestination(true);
        setDestination(undefined);
        setFolders([]);
        setPath([]);
        setAddingFolder(false);
        setError("");
        void loadSaveAsDestination(uid, projectUid)
            .then((result) => {
                if (cancelled) return;
                const initialPath: string[] = [];
                if (projectUid === source.projectUid) {
                    for (const id of source.path) {
                        if (
                            !result.entries.some(
                                (entry) =>
                                    entry.id === id &&
                                    entry.type === "folder" &&
                                    sameFolder(entry.path, initialPath)
                            )
                        )
                            break;
                        initialPath.push(id);
                    }
                }
                setPath(initialPath);
                setDestination(result);
                if (!suggestedName.current) {
                    suggestedName.current = true;
                    const dot = source.filename.lastIndexOf(".");
                    const base =
                        dot > 0
                            ? source.filename.slice(0, dot)
                            : source.filename;
                    const extension = dot > 0 ? source.filename.slice(dot) : "";
                    let name = source.filename;
                    let number = 1;
                    while (
                        result.entries.some(
                            (entry) =>
                                entry.name === name &&
                                sameFolder(entry.path, initialPath)
                        )
                    ) {
                        name = `${base}-copy${number === 1 ? "" : `-${number}`}${extension}`;
                        number++;
                    }
                    setFilename(name);
                }
            })
            .catch((error) => {
                if (!cancelled)
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load folders."
                    );
            })
            .finally(() => {
                if (!cancelled) setLoadingDestination(false);
            });
        return () => {
            cancelled = true;
        };
    }, [uid, projectUid, source]);

    useEffect(() => () => onSubmittingChange?.(false), [onSubmittingChange]);

    function addFolder() {
        if (folderError || !ready || busy) return;
        const id = crypto.randomUUID();
        setFolders([
            ...folders,
            { id, name: folderName, type: "folder", path, pending: true }
        ]);
        setPath([...path, id]);
        setFolderName("");
        setAddingFolder(false);
        filenameInput.current?.focus();
    }

    async function save() {
        if (!ready || fileError || addingFolder || saving.current) return;
        saving.current = true;
        setBusy(true);
        onSubmittingChange?.(true);
        setError("");
        try {
            const result = await saveTextAs(uid, {
                projectUid,
                filename,
                value: source.value,
                path,
                folders
            });
            if (store.getState().ProjectsReducer.projects[projectUid]) {
                dispatch({
                    type: ADD_PROJECT_DOCUMENTS,
                    projectUid,
                    documents: Object.fromEntries(
                        result.documents.map((document) => [
                            document.documentUid,
                            document
                        ])
                    )
                });
            }
            if (
                projectUid === store.getState().ProjectsReducer.activeProjectUid
            ) {
                dispatch(tabOpenByDocumentUid(result.documentUid, projectUid));
                dispatch(
                    openSnackbar(`Saved ${filename}.`, SnackbarType.Success)
                );
                dispatch(closeModal());
            } else setSaved(result.project);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not save. Your source is unchanged."
            );
        } finally {
            saving.current = false;
            setBusy(false);
            onSubmittingChange?.(false);
        }
    }

    return (
        <ProfileDialog
            title={saved ? "Copy saved" : "Save As"}
            width={560}
            actions={
                saved ? (
                    <>
                        <Button key="done" autoFocus onClick={close}>
                            Done
                        </Button>
                        <Button
                            component="a"
                            href={`/editor/${saved.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNew />}
                            variant="contained"
                            onClick={close}
                        >
                            Open project
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={close} disabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form={formId}
                            variant="contained"
                            disabled={
                                !ready || !!fileError || addingFolder || busy
                            }
                        >
                            {busy ? "Saving…" : "Save copy"}
                        </Button>
                    </>
                )
            }
        >
            {saved ? (
                <Typography sx={{ overflowWrap: "anywhere" }}>
                    Saved <strong>{filename}</strong> in{" "}
                    <strong>{saved.name}</strong>. Open the project in a new tab
                    to use it.
                </Typography>
            ) : (
                <Box
                    component="form"
                    id={formId}
                    aria-busy={busy}
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                    sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Save the current text as a new file. The source stays
                        unchanged.
                    </Typography>
                    <TextField
                        inputRef={filenameInput}
                        label="File name"
                        value={filename}
                        disabled={busy}
                        fullWidth
                        error={!!fileError}
                        helperText={fileError}
                        onChange={(event) => {
                            suggestedName.current = true;
                            setFilename(event.target.value);
                        }}
                        onFocus={(event) => {
                            const dot = event.target.value.lastIndexOf(".");
                            event.target.setSelectionRange(
                                0,
                                dot > 0 ? dot : event.target.value.length
                            );
                        }}
                    />
                    <Autocomplete
                        onKeyDown={(event) => {
                            // Enter chooses a project; it must not also submit the file.
                            if (event.key === "Enter") event.preventDefault();
                        }}
                        options={projects}
                        value={
                            projects.find((item) => item.id === projectUid) ||
                            null
                        }
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        getOptionKey={(option) => option.id}
                        disableClearable={projects.length > 0}
                        disabled={busy || loadingProjects}
                        onChange={(_, project) =>
                            setProjectUid(project?.id || "")
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Project"
                                helperText={
                                    currentProject?.isPublic
                                        ? "This project is public. Your copy will be public too."
                                        : "Only projects you can write to appear here."
                                }
                            />
                        )}
                    />
                    {(loadingProjects || loadingDestination) && (
                        <Box role="status">
                            <Typography variant="body2">
                                Loading destinations…
                            </Typography>
                            <LinearProgress sx={{ mt: 1 }} />
                        </Box>
                    )}
                    {!loadingProjects && !error && projects.length === 0 && (
                        <Alert severity="info">
                            Create a project from your profile, then save a copy
                            here.
                        </Alert>
                    )}
                    {error && (
                        <Alert
                            severity="error"
                            action={
                                !busy && (
                                    <Button
                                        color="inherit"
                                        size="small"
                                        onClick={() =>
                                            setRetry((value) => value + 1)
                                        }
                                    >
                                        Reload
                                    </Button>
                                )
                            }
                        >
                            {error}
                        </Alert>
                    )}
                    {ready && (
                        <Box
                            sx={{
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                overflow: "hidden"
                            }}
                        >
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderBottom: 1,
                                    borderColor: "divider"
                                }}
                            >
                                <Breadcrumbs
                                    aria-label="Destination folder"
                                    separator="/"
                                    sx={{
                                        "& .MuiBreadcrumbs-ol": { rowGap: 0.5 }
                                    }}
                                >
                                    <Button
                                        size="small"
                                        disabled={busy}
                                        aria-current={
                                            !path.length
                                                ? "location"
                                                : undefined
                                        }
                                        onClick={() => setPath([])}
                                    >
                                        Project root
                                    </Button>
                                    {path.map((id, index) => (
                                        <Button
                                            key={id}
                                            aria-current={
                                                index === path.length - 1
                                                    ? "location"
                                                    : undefined
                                            }
                                            size="small"
                                            disabled={busy}
                                            onClick={() =>
                                                setPath(
                                                    path.slice(0, index + 1)
                                                )
                                            }
                                            sx={{
                                                overflowWrap: "anywhere",
                                                textAlign: "left"
                                            }}
                                        >
                                            {
                                                entries.find(
                                                    (entry) => entry.id === id
                                                )?.name
                                            }
                                        </Button>
                                    ))}
                                </Breadcrumbs>
                            </Box>
                            <List
                                aria-label="Destination contents"
                                dense
                                sx={{ height: 176, overflowY: "auto", p: 0 }}
                            >
                                {visible.map((entry) =>
                                    entry.type === "folder" ? (
                                        <ListItem
                                            key={entry.id}
                                            disablePadding
                                            sx={{
                                                "&&": {
                                                    padding: "0 !important"
                                                }
                                            }}
                                        >
                                            <ListItemButton
                                                sx={{ px: 3, minHeight: 44 }}
                                                disabled={busy}
                                                onClick={() =>
                                                    setPath([...path, entry.id])
                                                }
                                            >
                                                <ListItemIcon
                                                    sx={{ minWidth: 32 }}
                                                >
                                                    <FolderOutlined fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={entry.name}
                                                    secondary={
                                                        entry.pending
                                                            ? "New folder"
                                                            : undefined
                                                    }
                                                    sx={{
                                                        overflowWrap: "anywhere"
                                                    }}
                                                />
                                                <ChevronRight fontSize="small" />
                                            </ListItemButton>
                                        </ListItem>
                                    ) : (
                                        <ListItem key={entry.id}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <InsertDriveFileOutlined fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={entry.name}
                                                sx={{
                                                    color: "text.secondary",
                                                    overflowWrap: "anywhere"
                                                }}
                                            />
                                        </ListItem>
                                    )
                                )}
                                {!visible.length && (
                                    <ListItem>
                                        <ListItemText
                                            primary="This folder is empty"
                                            sx={{
                                                color: "text.secondary",
                                                py: 2
                                            }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                            <Box
                                sx={{
                                    borderTop: 1,
                                    borderColor: "divider",
                                    p: 1.5
                                }}
                            >
                                {addingFolder ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1,
                                            flexWrap: "wrap",
                                            alignItems: "start"
                                        }}
                                    >
                                        <TextField
                                            autoFocus
                                            label="Folder name"
                                            size="small"
                                            value={folderName}
                                            error={
                                                !!folderName && !!folderError
                                            }
                                            helperText={
                                                folderName
                                                    ? folderError
                                                    : undefined
                                            }
                                            sx={{ flex: "1 1 180px" }}
                                            onChange={(event) =>
                                                setFolderName(
                                                    event.target.value
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    addFolder();
                                                }
                                            }}
                                        />
                                        <Button
                                            disabled={!!folderError}
                                            onClick={addFolder}
                                        >
                                            Add
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setAddingFolder(false)
                                            }
                                        >
                                            Cancel folder
                                        </Button>
                                    </Box>
                                ) : (
                                    <Button
                                        size="small"
                                        startIcon={<CreateNewFolderOutlined />}
                                        disabled={busy}
                                        onClick={() => {
                                            setFolderName("");
                                            setAddingFolder(true);
                                        }}
                                    >
                                        New folder
                                    </Button>
                                )}
                                {folders.some((folder) =>
                                    path.includes(folder.id)
                                ) && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block" }}
                                    >
                                        New folders are created when you save.
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </ProfileDialog>
    );
}
