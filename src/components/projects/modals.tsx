import React, { useState } from "react";
import { useSelector } from "react-redux";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { pathOr, isEmpty, values } from "ramda";
import { some } from "lodash";
import { formatFileSize } from "@root/utils";
import * as SS from "./styles";
import { IProject, IDocument } from "./types";

export const deleteDocumentPrompt = (
    filename: string,
    isFolder: boolean,
    folderContents: string[],
    cancelCallback: () => void,
    deleteCallback: () => void
) => {
    return (() => {
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <h3>
                    {isFolder
                        ? `Delete${
                              folderContents.length === 0 ? " empty" : ""
                          } directory ${filename}?`
                        : "Confirm deletion of file: " + filename}
                </h3>
                {folderContents.length > 0 && (
                    <>
                        <p>{`Warning! Deleting directory ${filename} will also permenantly delete the following files:`}</p>
                        <ul>
                            {folderContents.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </>
                )}

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => cancelCallback()}
                    style={{ marginTop: 12 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => deleteCallback()}
                    style={{ marginTop: 12 }}
                >
                    Delete
                </Button>
            </div>
        );
    }) as React.FC;
};

// https://stackoverflow.com/questions/11100821/javascript-regex-for-validating-filenames
const isValidFolderName = (name: string) =>
    // eslint-disable-next-line no-useless-escape
    !/^(con|prn|aux|nul|com\d|lpt\d)$|(["*/:<>?\\|])|([\s.])$/i.test(name);

export const newFolderPrompt = (
    callback: (fileName: string) => void,
    project: IProject
) => {
    return (() => {
        const [input, setInput] = useState("");
        const [nameCollides, setNameCollides] = useState(false);

        const reservedFilenames = project.documents
            ? (values(project.documents) as IDocument[]).map(
                  (document_) => document_.filename
              )
            : [];

        const shouldDisable = isEmpty(input) || !isValidFolderName(input);

        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <TextField
                    label={
                        nameCollides ? input + " already exists!" : "New Folder"
                    }
                    onKeyDown={(event_) =>
                        event_.key === "Enter" &&
                        !shouldDisable &&
                        callback(input)
                    }
                    error={nameCollides}
                    value={input}
                    onChange={(event) => {
                        setInput(event.target.value);
                        setNameCollides(
                            some(
                                reservedFilenames,
                                (fn) => fn === event.target.value
                            )
                        );
                    }}
                />
                <Button
                    css={SS.modalSubmitButton}
                    variant="outlined"
                    color={shouldDisable ? undefined : "primary"}
                    disabled={shouldDisable || nameCollides}
                    onClick={() => callback(input)}
                    style={{ marginTop: 11 }}
                >
                    {"Create"}
                </Button>
            </div>
        );
    }) as React.FC;
};

export const newDocumentPrompt = (
    callback: (fileName: string) => void,
    renameAction: boolean,
    initFilename: string
) => {
    return (() => {
        const [input, setInput] = useState(renameAction ? initFilename : "");
        const [nameCollides, setNameCollides] = useState(false);

        const activeProjectUid = useSelector(
            pathOr("", ["ProjectsReducer", "activeProjectUid"])
        );
        const project: IProject = useSelector(
            pathOr({} as IProject, [
                "ProjectsReducer",
                "projects",
                activeProjectUid
            ])
        );

        const reservedFilenames = project.documents
            ? (values(project.documents) as IDocument[]).map(
                  (document_) => document_.filename
              )
            : [];

        const shouldDisable = isEmpty(input);
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <TextField
                    label={
                        nameCollides
                            ? input + " already exists!"
                            : "New filename"
                    }
                    onKeyDown={(event_) =>
                        event_.key === "Enter" &&
                        !shouldDisable &&
                        callback(input)
                    }
                    error={nameCollides}
                    value={input}
                    onChange={(event) => {
                        setInput(event.target.value);
                        setNameCollides(
                            some(
                                reservedFilenames,
                                (fn) => fn === event.target.value
                            )
                        );
                    }}
                />
                <Button
                    css={SS.modalSubmitButton}
                    variant="outlined"
                    color={shouldDisable ? undefined : "primary"}
                    disabled={shouldDisable || nameCollides}
                    onClick={() => callback(input)}
                    style={{ marginTop: 11 }}
                >
                    {renameAction ? "Rename" : "Create"}
                </Button>
            </div>
        );
    }) as React.FC;
};

export const addDocumentPrompt = (callback: (filelist: FileList) => void) => {
    return (() => {
        const [files, setFiles]: [
            FileList | undefined | null,
            (files: FileList | null) => void
        ] = useState();
        const [nameCollides, setNameCollides] = useState(false);

        const activeProjectUid = useSelector(
            pathOr("", ["ProjectsReducer", "activeProjectUid"])
        );
        const project: IProject = useSelector(
            pathOr({} as IProject, [
                "ProjectsReducer",
                "projects",
                activeProjectUid
            ])
        );

        const reservedFilenames = (values(
            project.documents
        ) as IDocument[]).map((document_) => document_.filename);

        const megabyte = Math.pow(10, 6);
        const shouldDisable =
            !files || isEmpty(files) || files[0].size > megabyte;
        const filesize = !files ? "Select file" : formatFileSize(files[0].size);
        return (
            <div style={{ display: "flex", flexDirection: "column" }}>
                <Button variant="contained" color="primary" component="label">
                    {files ? `${files[0].name}` : "Choose file..."}
                    <input
                        id="fileSelector"
                        type="file"
                        style={{ display: "none" }}
                        onChange={(event) => {
                            const files: FileList | null = event.target.files;
                            const fileName = files ? files[0].name : "";
                            files && setFiles(files);
                            setNameCollides(
                                some(reservedFilenames, (fn) => fn === fileName)
                            );
                        }}
                    ></input>
                </Button>
                <p>{`File Size: ${filesize} (Max file size is 1MB)`}</p>
                <Button
                    variant="outlined"
                    color="primary"
                    disabled={shouldDisable || nameCollides}
                    onClick={() => callback(files!)}
                    style={{ marginTop: 11 }}
                >
                    Upload
                </Button>
            </div>
        );
    }) as React.FC;
};
