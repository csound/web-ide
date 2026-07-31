import type { Csound as BrowserCsoundFactory } from "@csound/browser";
import type { IDocument } from "@comp/projects/types";

type CsoundInitializationOptions = Omit<
    NonNullable<Parameters<BrowserCsoundFactory>[0]>,
    "withPlugins"
>;

type LoadBinaryDocument = (
    projectUid: string,
    document: IDocument
) => Promise<Uint8Array>;

type CreateCsoundForProjectArguments = {
    csoundFactory: BrowserCsoundFactory;
    loadBinaryDocument: LoadBinaryDocument;
    projectUid: string;
    documents: Record<string, IDocument>;
    options: CsoundInitializationOptions;
    createObjectURL?: (blob: Blob) => string;
    revokeObjectURL?: (url: string) => void;
};

// TODO: Check the WebAssembly magic header before loading the file.
const isCsoundPlugin = (document: IDocument): boolean =>
    document.type === "bin" &&
    document.filename.toLowerCase().endsWith(".wasm");

export const createCsoundForProject = async ({
    csoundFactory,
    loadBinaryDocument,
    projectUid,
    documents,
    options,
    createObjectURL = (blob) => URL.createObjectURL(blob),
    revokeObjectURL = (url) => URL.revokeObjectURL(url)
}: CreateCsoundForProjectArguments): ReturnType<BrowserCsoundFactory> => {
    const pluginDocuments = Object.values(documents).filter(isCsoundPlugin);
    const pluginUrls: string[] = [];

    try {
        const pluginBinaries = await Promise.all(
            pluginDocuments.map((document) =>
                loadBinaryDocument(projectUid, document)
            )
        );

        for (const binary of pluginBinaries) {
            pluginUrls.push(
                createObjectURL(
                    new Blob([binary], { type: "application/wasm" })
                )
            );
        }

        return await csoundFactory({
            ...options,
            // The package types say object[], but its runtime fetches URL strings.
            withPlugins: pluginUrls as unknown as object[]
        });
    } finally {
        for (const pluginUrl of pluginUrls) {
            revokeObjectURL(pluginUrl);
        }
    }
};
