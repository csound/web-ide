export type RenderFormat = "wav" | "ogg" | "mp3";
export type RenderSettings = {
    filename: string;
    format: RenderFormat;
    bitDepth: "16" | "24" | "float";
    quality: number;
    sampleRate?: number;
    ksmps?: number;
};

export function validateRenderSettings(
    settings: RenderSettings
): string | undefined {
    if (
        !settings.filename.trim() ||
        /[/\\"<>|:*?]/.test(settings.filename) ||
        [...settings.filename].some(
            (character) => character.charCodeAt(0) < 32
        ) ||
        /^\.+$/.test(settings.filename)
    )
        return "Enter a filename without path separators or special characters.";
    if (!["wav", "ogg", "mp3"].includes(settings.format))
        return "Choose a supported format.";
    if (!["16", "24", "float"].includes(settings.bitDepth))
        return "Choose a supported bit depth.";
    if (
        !Number.isFinite(settings.quality) ||
        settings.quality < 0 ||
        settings.quality > 1
    )
        return "Quality must be between 0 and 1.";
    if (
        settings.sampleRate !== undefined &&
        (!Number.isInteger(settings.sampleRate) ||
            settings.sampleRate < 8000 ||
            settings.sampleRate > 192000)
    )
        return "Sample rate must be a whole number from 8,000 to 192,000 Hz.";
    if (
        settings.ksmps !== undefined &&
        (!Number.isInteger(settings.ksmps) ||
            settings.ksmps < 1 ||
            settings.ksmps > 8192)
    )
        return "ksmps must be a whole number from 1 to 8,192.";
    return undefined;
}

export function renderFilename(settings: RenderSettings): string {
    return `${settings.filename.trim().replace(/\.(wav|ogg|mp3)$/i, "")}.${settings.format}`;
}

export function projectSettingHint(
    source: string,
    name: "sr" | "ksmps"
): string {
    const orchestra =
        source.match(/<CsInstruments>([\s\S]*?)<\/CsInstruments>/i)?.[1] ??
        source;
    const value = orchestra
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .match(
            new RegExp(`^\\s*${name}\\s*=\\s*(\\d+)\\s*(?:;[^\\n]*)?$`, "m")
        )?.[1];
    return value ? `Project: ${value}` : "Project setting";
}

export function renderOptions(settings: RenderSettings): string[] {
    return [
        settings.format === "wav"
            ? `--format=wav:${settings.bitDepth === "16" ? "short" : settings.bitDepth === "24" ? "24bit" : "float"}`
            : settings.format === "ogg"
              ? "--ogg"
              : "--mpeg",
        ...(settings.format !== "wav"
            ? [
                  `--vbr-quality=${settings.quality}`,
                  ...(settings.format === "mp3" ? ["--vbr"] : [])
              ]
            : []),
        ...(settings.sampleRate
            ? [`--sample-rate=${settings.sampleRate}`]
            : []),
        ...(settings.ksmps ? [`--ksmps=${settings.ksmps}`] : [])
    ];
}

// Append run-only overrides so source CsOptions cannot take precedence.
// The editor and saved document are never changed.
export function withPerformanceOptions(
    source: string,
    options: string[]
): string {
    const overrides = `\n${options.join("\n")}\n`;
    if (/<CsOptions>[\s\S]*?<\/CsOptions>/i.test(source))
        return source.replace(/<\/CsOptions>/i, `${overrides}</CsOptions>`);
    return source.replace(
        /<CsoundSynthesizer>/i,
        `$&\n<CsOptions>${overrides}</CsOptions>`
    );
}
