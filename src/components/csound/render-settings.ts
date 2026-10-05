export type RenderFormat = "wav" | "ogg" | "mp3";
export type RenderSettings = {
    filename: string;
    format: RenderFormat;
    bitDepth: "8" | "16" | "24" | "32" | "float" | "double";
    quality: number;
    sampleRate?: number;
    ksmps?: number;
    channels?: number;
    dither?: boolean;
    orchestraMacros?: string;
    scoreMacros?: string;
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
    if (!["8", "16", "24", "32", "float", "double"].includes(settings.bitDepth))
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
    if (
        settings.channels !== undefined &&
        (!Number.isInteger(settings.channels) ||
            settings.channels < 1 ||
            settings.channels > 64)
    )
        return "Choose 1 to 64 output channels.";
    if (settings.format === "mp3" && settings.channels && settings.channels > 2)
        return "MP3 supports one or two channels. Use WAV or Ogg for multichannel audio, or export separate mono files.";
    try {
        macroOptions(settings.orchestraMacros, "o");
        macroOptions(settings.scoreMacros, "s");
    } catch (error) {
        return (error as Error).message;
    }
    return undefined;
}

export function renderFilename(settings: RenderSettings): string {
    return `${settings.filename.trim().replace(/\.(wav|ogg|mp3)$/i, "")}.${settings.format}`;
}

export function projectSettingHint(
    source: string,
    name: "sr" | "ksmps" | "nchnls"
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
            ? `--format=raw:${{ "8": "uchar", "16": "short", "24": "24bit", "32": "long", float: "float", double: "double" }[settings.bitDepth]}`
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
        ...(settings.ksmps ? [`--ksmps=${settings.ksmps}`] : []),
        ...(settings.channels ? [`--nchnls=${settings.channels}`] : []),
        settings.dither &&
        settings.format === "wav" &&
        settings.bitDepth === "16"
            ? "-Z1"
            : "-Z0",
        ...macroOptions(settings.orchestraMacros, "o"),
        ...macroOptions(settings.scoreMacros, "s")
    ];
}

export function macroOptions(text = "", scope: "o" | "s"): string[] {
    const names = new Set<string>();
    return text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => {
            const match = line.match(
                /^\s*([A-Za-z_][A-Za-z_0-9]*)\s*:\s*(\S+)\s*$/
            );
            if (!match || /["'<>#;\\]/.test(match[2]))
                throw new Error(
                    "Use one macro per line: NAME: value. Values may be numbers or expressions without spaces, quotes, or score delimiters."
                );
            if (names.has(match[1]))
                throw new Error(`Macro ${match[1]} appears more than once.`);
            names.add(match[1]);
            return `--${scope}macro:${match[1]}=${match[2]}`;
        });
}

// Append run-only overrides so source CsOptions cannot take precedence.
// The editor and saved document are never changed.
export function withPerformanceOptions(
    source: string,
    options: string[]
): string {
    const overrides = `\n${options.join("\n")}\n`;
    if (/<CsOptions>[\s\S]*?<\/CsOptions>/i.test(source))
        return source.replace(
            /<\/CsOptions>/i,
            () => `${overrides}</CsOptions>`
        );
    return source.replace(
        /<CsoundSynthesizer>/i,
        (tag) => `${tag}\n<CsOptions>${overrides}</CsOptions>`
    );
}
