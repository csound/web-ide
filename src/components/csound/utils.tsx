import { ICsoundFileType } from "./types";

export const isClojureFilename = (filename: string): boolean =>
    /\.(?:mal|clj[^./]*)$/i.test(filename);

export function filenameToCsoundType(
    filename: string
): ICsoundFileType | undefined {
    if (isClojureFilename(filename)) return "lisp";
    filename = filename.toLowerCase();
    if (filename.endsWith(".csd")) {
        return "csd";
    } else if (filename.endsWith(".sco")) {
        return "sco";
    } else if (filename.endsWith(".orc")) {
        return "orc";
    } else if (filename.endsWith(".udo")) {
        return "udo";
    }
}
