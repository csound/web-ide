import { useEffect, useRef, useState } from "react";
import { Box, LinearProgress, Paper, Portal, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useDispatch } from "@root/store";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import {
    uploadProjectFiles,
    PROJECT_FILE_SIZE_LABEL,
    type FileUploadProgress
} from "@comp/projects/upload-files";

const containsFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");

// Audio tools consume local files without uploading them into the project.
const isLocalDrop = (event: DragEvent) =>
    event.target instanceof Element &&
    Boolean(event.target.closest("[data-local-file-drop]"));

/** Handle OS files before CodeMirror or the browser can open the dropped file. */
export function ProjectFileDrop({
    projectUid,
    projectName,
    isOwner
}: {
    projectUid: string;
    projectName: string;
    isOwner: boolean;
}) {
    const dispatch = useDispatch();
    const [hovering, setHovering] = useState(false);
    const [progress, setProgress] = useState<FileUploadProgress>();
    const uploading = useRef(false);

    useEffect(() => {
        let depth = 0;
        let mounted = true;
        const reset = () => {
            depth = 0;
            setHovering(false);
        };
        const enter = (event: DragEvent) => {
            if (!containsFiles(event)) return;
            if (isLocalDrop(event)) return reset();
            event.preventDefault();
            event.stopPropagation();
            depth++;
            setHovering(true);
        };
        const over = (event: DragEvent) => {
            if (!containsFiles(event)) return;
            if (isLocalDrop(event)) return reset();
            event.preventDefault();
            event.stopPropagation();
            if (event.dataTransfer)
                event.dataTransfer.dropEffect =
                    isOwner && !uploading.current ? "copy" : "none";
        };
        const leave = (event: DragEvent) => {
            if (!depth && !containsFiles(event)) return;
            depth = Math.max(0, depth - 1);
            if (
                depth === 0 ||
                (!event.relatedTarget &&
                    (event.clientX <= 0 ||
                        event.clientY <= 0 ||
                        event.clientX >= window.innerWidth ||
                        event.clientY >= window.innerHeight))
            )
                reset();
        };
        const drop = (event: DragEvent) => {
            if (!containsFiles(event)) return;
            if (isLocalDrop(event)) return reset();
            event.preventDefault();
            event.stopPropagation();
            reset();
            if (!isOwner || uploading.current) return;
            const transfer = event.dataTransfer!;
            const items = Array.from(transfer.items ?? []).filter(
                (item) => item.kind === "file"
            );
            let hasDirectories = false;
            // Read File objects during the event, before the browser protects the transfer again.
            const files = items.length
                ? items.flatMap((item) => {
                      if (item.webkitGetAsEntry?.()?.isDirectory) {
                          hasDirectories = true;
                          return [];
                      }
                      const file = item.getAsFile();
                      return file ? [file] : [];
                  })
                : Array.from(transfer.files);
            if (hasDirectories)
                dispatch(
                    openSnackbar(
                        "Folders were skipped. Drop individual files instead.",
                        SnackbarType.Error
                    )
                );
            if (!files.length) return;
            // Keep reads alive if the manual iframe navigates after the drop.
            const uploadFiles = files.map(
                (file) =>
                    new File([file], file.name, {
                        type: file.type,
                        lastModified: file.lastModified
                    })
            );
            uploading.current = true;
            void dispatch(
                uploadProjectFiles(projectUid, uploadFiles, (next) => {
                    if (mounted) setProgress(next);
                })
            ).finally(() => {
                uploading.current = false;
            });
        };
        const keyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") reset();
        };
        const windows = new Set<Window>();
        const listen = (target: Window) => {
            windows.add(target);
            target.addEventListener("dragenter", enter, true);
            target.addEventListener("dragover", over, true);
            target.addEventListener("dragleave", leave, true);
            target.addEventListener("drop", drop, true);
            target.addEventListener("dragend", reset);
            target.addEventListener("blur", reset);
            target.addEventListener("keydown", keyDown);
        };
        // Manual pages run in a same-origin iframe; their events never reach the parent window.
        const listenToFrame = (frame: HTMLIFrameElement) => {
            if (frame.contentDocument && frame.contentWindow)
                listen(frame.contentWindow);
        };
        const frameLoaded = (event: Event) => {
            if (event.target instanceof HTMLIFrameElement)
                listenToFrame(event.target);
        };
        listen(window);
        document.querySelectorAll("iframe").forEach(listenToFrame);
        document.addEventListener("load", frameLoaded, true);
        return () => {
            mounted = false;
            document.removeEventListener("load", frameLoaded, true);
            for (const target of windows) {
                target.removeEventListener("dragenter", enter, true);
                target.removeEventListener("dragover", over, true);
                target.removeEventListener("dragleave", leave, true);
                target.removeEventListener("drop", drop, true);
                target.removeEventListener("dragend", reset);
                target.removeEventListener("blur", reset);
                target.removeEventListener("keydown", keyDown);
            }
        };
    }, [dispatch, projectUid, isOwner]);

    return (
        <Portal>
            {hovering && (
                <Box
                    role="status"
                    aria-label="File drop"
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: (theme) => theme.zIndex.modal + 1,
                        display: "grid",
                        placeItems: "center",
                        p: 3,
                        bgcolor: "rgba(12, 16, 20, 0.62)",
                        pointerEvents: "none"
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            width: "100%",
                            maxWidth: 420,
                            p: { xs: 3, sm: 4 },
                            textAlign: "center",
                            border: "2px dashed",
                            borderColor: "text.secondary",
                            borderRadius: 2
                        }}
                    >
                        <UploadFileIcon
                            sx={{
                                fontSize: 36,
                                mb: 1.5,
                                color: "text.secondary"
                            }}
                        />
                        <Typography variant="h6" component="h2">
                            {!isOwner
                                ? "This project is read-only"
                                : uploading.current
                                  ? "Upload in progress"
                                  : "Drop files to upload"}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ mt: 1, overflowWrap: "anywhere" }}
                        >
                            {!isOwner
                                ? "Open a project you own to add files."
                                : uploading.current
                                  ? "Wait for the current upload to finish."
                                  : `Add files to ${projectName}.`}
                        </Typography>
                        {isOwner && !uploading.current && (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Multiple files welcome. Up to{" "}
                                {PROJECT_FILE_SIZE_LABEL} per file.
                            </Typography>
                        )}
                    </Paper>
                </Box>
            )}
            {progress && (
                <Paper
                    role="status"
                    elevation={3}
                    sx={{
                        position: "fixed",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "calc(100% - 32px)",
                        maxWidth: 400,
                        p: 2,
                        zIndex: (theme) => theme.zIndex.snackbar,
                        pointerEvents: "none"
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{ overflowWrap: "anywhere", mb: 1 }}
                    >
                        Uploading {progress.index + 1} of {progress.total}:{" "}
                        {progress.filename}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={
                            ((progress.index + progress.percent / 100) /
                                progress.total) *
                            100
                        }
                        aria-label="File upload progress"
                    />
                </Paper>
            )}
        </Portal>
    );
}
