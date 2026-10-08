export type ScoreSection = {
    from: number;
    to: number;
    bodyFrom: number;
    bodyTo: number;
    command: string;
    closed: boolean;
};

/** Read score tags without treating orchestra strings or embedded files as CSD markup. */
export function scoreSections(source: string): ScoreSection[] {
    const masked = source.replace(
        /<!--[\s\S]*?(?:-->|(?![\s\S]))|^[\t ]*<(CsInstruments|CsOptions|CsFileB?|CsLicense|CsLicence|html)\b[^>]*>[\s\S]*?(?:^[\t ]*<\/\1>|(?![\s\S]))/gm,
        (text) => text.replace(/[^\r\n]/g, " ")
    );
    const sections: ScoreSection[] = [];
    const tags = /^[\t ]*<CsScore\b([^>\r\n]*)>/gm;
    for (const tag of masked.matchAll(tags)) {
        const bodyFrom = tag.index + tag[0].length;
        if (sections.length && tag.index < sections.at(-1)!.to) continue;
        const close = /^[\t ]*<\/CsScore>/gm;
        close.lastIndex = bodyFrom;
        const end = close.exec(masked);
        sections.push({
            from: tag.index,
            to: end ? end.index + end[0].length : source.length,
            bodyFrom,
            bodyTo: end?.index ?? source.length,
            command: tag[1].match(/\bbin="([^"]+)"/)?.[1].trim() ?? "",
            closed: Boolean(end)
        });
    }
    return sections;
}

export function scoreProgramPath(command: string): string {
    return (
        command
            .match(/^(?:'([^']+)'|([^\s]+))/)
            ?.slice(1)
            .find(Boolean) ?? ""
    );
}

/** Only known basenames select a notation; paths still resolve in Csound's filesystem. */
export function scoreNotation(command: string): "csbeats" | "scot" | undefined {
    const name = scoreProgramPath(command)
        .split("/")
        .at(-1)
        ?.replace(/\.wasm$/, "");
    return name === "csbeats" || name === "scot" ? name : undefined;
}
