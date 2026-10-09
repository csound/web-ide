import { useDispatch, useSelector } from "@root/store";
import { addNonCloudFile, nonCloudFiles } from "../file-tree/actions";
import { getUniqueFilename } from "../projects/utils";
import type { ToolFile } from "./types";

/** Save a separate generated file without replacing project audio. */
export function useSaveAudioFile(projectUid: string) {
    const dispatch = useDispatch();
    const documents = useSelector(
        (state) => state.ProjectsReducer.projects[projectUid]?.documents
    );
    const onSave = (file: ToolFile) => {
        const name = getUniqueFilename(file.name.replace(/^.*[/\\]/, ""), [
            ...nonCloudFiles.keys(),
            ...Object.values(documents || {}).map(
                (document) => document.filename
            )
        ]);
        const createdAt = new Date();
        nonCloudFiles.set(name, { name, createdAt, buffer: file.data });
        dispatch(addNonCloudFile({ name, createdAt: createdAt.getTime() }));
        return name;
    };
    return onSave;
}
