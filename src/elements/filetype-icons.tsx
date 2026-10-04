import React from "react";
import { useTheme } from "@emotion/react";
import mime from "mime";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

export type MediaFileCategory =
    | "audio"
    | "midi"
    | "sample"
    | "media"
    | "md"
    | "code"
    | "text"
    | "data"
    | "analysis"
    | "tuning"
    | "image"
    | "archive"
    | "document";

type MediaFileIconProps = {
    label: string;
    category: MediaFileCategory;
};

type CsoundFileCategory = "csd" | "orc" | "sco" | "udo";

export type FileTypeIconDetails =
    | { kind: "csound"; category: CsoundFileCategory }
    | { kind: "media"; category: MediaFileCategory; label: string };

const csoundExtensions = new Set<CsoundFileCategory>([
    "csd",
    "orc",
    "sco",
    "udo"
]);

// Explicit extensions win over browser MIME guesses (notably MIDI and SF2).
const extensionGroups: [MediaFileCategory, string[]][] = [
    ["md", ["md", "markdown"]],
    [
        "audio",
        [
            "wav",
            "wave",
            "aif",
            "aiff",
            "aifc",
            "flac",
            "m4a",
            "mp3",
            "mp2",
            "ogg",
            "oga",
            "opus",
            "au",
            "snd",
            "caf",
            "w64"
        ]
    ],
    ["midi", ["mid", "midi", "kar", "smf"]],
    ["sample", ["sf2", "sf3", "sfz", "dls"]],
    ["analysis", ["pv", "pvx", "ats", "het", "lpc", "sdif"]],
    [
        "data",
        [
            "mat",
            "matrix",
            "matrx",
            "matrxb",
            "matrxt",
            "csv",
            "tsv",
            "dat",
            "ft",
            "ftable",
            "json",
            "xml",
            "yaml",
            "yml",
            "toml",
            "ini",
            "cfg"
        ]
    ],
    ["tuning", ["scl", "kbm"]],
    [
        "code",
        [
            "h",
            "hpp",
            "inc",
            "c",
            "cpp",
            "py",
            "lua",
            "js",
            "mjs",
            "ts",
            "tsx",
            "jsx",
            "clj",
            "cljs",
            "html",
            "htm",
            "css",
            "sh"
        ]
    ],
    ["text", ["txt", "text", "log", "rst"]],
    [
        "image",
        [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "svg",
            "webp",
            "bmp",
            "tif",
            "tiff",
            "avif"
        ]
    ],
    ["media", ["mp4", "mov", "webm", "mkv", "avi", "mpeg", "mpg", "ogv"]],
    ["archive", ["zip", "gz", "tgz", "tar", "bz2", "xz", "7z", "rar"]],
    ["document", ["pdf"]]
];
const extensionCategories = new Map(
    extensionGroups.flatMap(([category, extensions]) =>
        extensions.map((extension) => [extension, category] as const)
    )
);
const shortLabels: Record<string, string> = {
    markdown: "MD",
    midi: "MID",
    wave: "WAV",
    aiff: "AIF",
    aifc: "AIF",
    matrix: "MTX",
    matrx: "MTX",
    matrxb: "MTX",
    matrxt: "MTX",
    ftable: "FT",
    jpeg: "JPG",
    tiff: "TIF",
    text: "TXT",
    mpeg: "MPG"
};
const mimeCategories = new Map<string, [MediaFileCategory, string]>([
    ["application/x-midi", ["midi", "MID"]],
    ["audio/midi", ["midi", "MID"]],
    ["audio/x-midi", ["midi", "MID"]],
    ["audio/sp-midi", ["midi", "MID"]],
    ["application/ogg", ["audio", "OGG"]],
    ["application/json", ["data", "JSON"]],
    ["application/xml", ["data", "XML"]],
    ["text/xml", ["data", "XML"]],
    ["text/csv", ["data", "CSV"]],
    ["text/markdown", ["md", "MD"]],
    ["application/javascript", ["code", "JS"]],
    ["text/javascript", ["code", "JS"]],
    ["text/html", ["code", "HTML"]],
    ["text/css", ["code", "CSS"]],
    ["application/pdf", ["document", "PDF"]],
    ["application/zip", ["archive", "ZIP"]],
    ["application/gzip", ["archive", "GZ"]],
    ["application/x-tar", ["archive", "TAR"]],
    ["application/x-7z-compressed", ["archive", "7Z"]]
]);

export function getFileTypeIconDetails(
    filename: string,
    mimeType?: string
): FileTypeIconDetails | null {
    const basename = filename.split(/[\\/]/).pop()!.toLowerCase();
    const lastDot = basename.lastIndexOf(".");
    const extension = lastDot > 0 ? basename.slice(lastDot + 1) : "";

    if (csoundExtensions.has(extension as CsoundFileCategory)) {
        return { kind: "csound", category: extension as CsoundFileCategory };
    }
    const category = extensionCategories.get(extension);
    if (category) {
        return {
            kind: "media",
            category,
            label: shortLabels[extension] || extension.toUpperCase()
        };
    }
    if (
        ["readme", "license", "licence", "changelog", "authors"].includes(
            basename
        )
    ) {
        return { kind: "media", category: "text", label: "TXT" };
    }
    if (basename === ".csoundrc") {
        return { kind: "media", category: "data", label: "CFG" };
    }

    const normalizedMimeType = (mimeType || mime.getType(basename) || "")
        .split(";")[0]
        .trim()
        .toLowerCase();
    const match = mimeCategories.get(normalizedMimeType);
    if (match) {
        return { kind: "media", category: match[0], label: match[1] };
    }
    for (const [prefix, category, label] of [
        ["audio/", "audio", "AUD"],
        ["video/", "media", "VID"],
        ["image/", "image", "IMG"],
        ["text/", "text", "TXT"]
    ] as const) {
        if (normalizedMimeType.startsWith(prefix)) {
            return { kind: "media", category, label };
        }
    }
    return null;
}

export function FileTypeIcon({
    filename,
    mimeType
}: {
    filename: string;
    mimeType?: string;
}): React.ReactElement | null {
    const iconDetails = getFileTypeIconDetails(filename, mimeType);

    if (!iconDetails) {
        return <InsertDriveFileOutlinedIcon />;
    }

    if (iconDetails.kind === "media") {
        return (
            <MediaFileIcon
                category={iconDetails.category}
                label={iconDetails.label}
            />
        );
    }

    switch (iconDetails.category) {
        case "csd":
            return <CsdFileIcon />;
        case "orc":
            return <OrcFileIcon />;
        case "sco":
            return <ScoFileIcon />;
        case "udo":
            return <UdoFileIcon />;
        default:
            return null;
    }
}

function FileIconBadge({
    label,
    panel,
    shadow
}: {
    label: string;
    panel: string;
    shadow: string;
}): React.ReactElement {
    const theme = useTheme();
    const normalizedLabel = label.trim().slice(0, 4).toUpperCase() || "???";

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="512"
            height="512"
            viewBox="0 0 512 512"
            xmlSpace="preserve"
            aria-hidden="true"
            focusable="false"
        >
            {/* Paper body — theme-aware so it fits dark & light themes */}
            <path
                fill={theme.highlightBackground}
                d="M132 48h151.431L380 144.569V420c0 24.301-19.699 44-44 44H132c-24.301 0-44-19.699-44-44V92c0-24.301 19.699-44 44-44z"
            />
            {/* Document outline */}
            <path
                fill={theme.line}
                d="M336 468H132c-26.468 0-48-21.532-48-48V92c0-26.468 21.532-48 48-48h153.087L384 142.913V420c0 26.468-21.532 48-48 48zM132 52c-22.056 0-40 17.944-40 40V420c0 22.056 17.944 40 40 40H336c22.056 0 40-17.944 40-40V146.227L281.773 52H132z"
            />
            {/* Fold corner — subtle darker triangle */}
            <path
                fill="rgba(0,0,0,0.08)"
                d="M292 148c-17.645 0-32-14.355-32-32V47.571L380.43 148H292z"
            />
            {/* Fold crease border */}
            <path
                fill={theme.line}
                d="M260 39.219V116c0 17.645 14.355 32 32 32h100.13L260 39.219z"
            />
            {/* Shadow for type panel */}
            <rect
                x="88"
                y="260"
                width="336"
                height="168"
                rx="12"
                fill={shadow}
                opacity="0.25"
            />
            {/* Colored type panel — covers ~45% of doc for legibility */}
            <rect
                x="88"
                y="252"
                width="336"
                height="168"
                rx="12"
                fill={panel}
            />
            <text
                fill="#FFFFFF"
                fontFamily={theme.font.monospace || theme.font.regular}
                fontSize={normalizedLabel.length > 3 ? 96 : 120}
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="central"
                transform="translate(256 336)"
                letterSpacing="-4"
            >
                {normalizedLabel}
            </text>
        </svg>
    );
}

export function MediaFileIcon({
    label,
    category
}: MediaFileIconProps): React.ReactElement {
    const theme = useTheme();
    // Extend the existing theme palette without adding a competing icon style.
    const palette = {
        audio: "audio",
        midi: "midi",
        sample: "sample",
        media: "media",
        md: "md",
        code: "udo",
        text: "md",
        data: "midi",
        analysis: "audio",
        tuning: "sco",
        image: "media",
        archive: "sample",
        document: "media"
    } as const;
    const { panel, shadow } = theme.fileIcons[palette[category]];
    const normalizedLabel = label.trim().slice(0, 4).toUpperCase() || "MED";
    return (
        <FileIconBadge label={normalizedLabel} panel={panel} shadow={shadow} />
    );
}

export function CsdFileIcon(): React.ReactElement {
    const theme = useTheme();
    return (
        <FileIconBadge
            label="CSD"
            panel={theme.fileIcons.csd.panel}
            shadow={theme.fileIcons.csd.shadow}
        />
    );
}

export function OrcFileIcon(): React.ReactElement {
    const theme = useTheme();
    return (
        <FileIconBadge
            label="ORC"
            panel={theme.fileIcons.orc.panel}
            shadow={theme.fileIcons.orc.shadow}
        />
    );
}

export function ScoFileIcon(): React.ReactElement {
    const theme = useTheme();
    return (
        <FileIconBadge
            label="SCO"
            panel={theme.fileIcons.sco.panel}
            shadow={theme.fileIcons.sco.shadow}
        />
    );
}

export function UdoFileIcon(): React.ReactElement {
    const theme = useTheme();
    return (
        <FileIconBadge
            label="UDO"
            panel={theme.fileIcons.udo.panel}
            shadow={theme.fileIcons.udo.shadow}
        />
    );
}
