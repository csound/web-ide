import { getDownloadURL } from "firebase/storage";
import { storageReference } from "@config/firestore";
import type { IDocument } from "../../../projects/types";
import { readAudioStream } from "../../../audio-tools/limits";
import { pluginMetadata, type PluginFile } from "./cache";
import { MAX_PLUGIN_BYTES } from "./signatures";
import { pluginPath } from "./options";
import type { CheckRequest } from "../types";

function projectFiles(
    projectUid: string,
    documents: Record<string, IDocument>,
    request: CheckRequest
): PluginFile[] {
    const byPath = new Map(
        Object.values(documents).map((document) => [
            [
                ...document.path.map((id) => documents[id]?.filename ?? id),
                document.filename
            ].join("/"),
            document
        ])
    );
    const paths = [
        ...new Set(
            (request.pluginRequests ?? []).map(({ path }) => pluginPath(path))
        )
    ];
    return paths.map((name) => {
        const document = byPath.get(name);
        if (!document || document.type !== "bin")
            throw new Error("Opcode plugin is not in the project");
        return {
            name,
            revision: JSON.stringify([
                document.userUid,
                document.documentUid,
                document.lastModified,
                document.created
            ]),
            load: async (signal) => {
                signal.throwIfAborted();
                const url = await getDownloadURL(
                    await storageReference(
                        `${document.userUid}/${projectUid}/${document.documentUid}`
                    )
                );
                signal.throwIfAborted();
                const response = await fetch(url, { signal });
                if (!response.ok || !response.body)
                    throw new Error("Could not read opcode plugin");
                return readAudioStream(
                    response.body,
                    signal,
                    Number(response.headers.get("content-length")),
                    (size) => {
                        if (size > MAX_PLUGIN_BYTES)
                            throw new Error("Opcode plugin is too large");
                    }
                );
            }
        };
    });
}

/** Resolve only explicit project files; never fetch a URL found inside a CSD. */
export async function projectPluginSignatures(
    projectUid: string,
    documents: Record<string, IDocument>,
    request: CheckRequest
) {
    return pluginMetadata.get(
        projectUid,
        projectFiles(projectUid, documents, request)
    );
}
