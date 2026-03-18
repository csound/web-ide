import React from "react";
import { useTheme } from "@emotion/react";
import mime from "mime";

export type MediaFileCategory = "audio" | "midi" | "sample" | "media";

type MediaFileIconProps = {
    label: string;
    category: MediaFileCategory;
};

type CsoundFileCategory = "csd" | "orc" | "sco" | "udo";

export type FileTypeIconDetails =
    | {
          kind: "csound";
          category: CsoundFileCategory;
      }
    | {
          kind: "media";
          category: MediaFileCategory;
          label: string;
      };

const csoundExtensions = new Set<CsoundFileCategory>([
    "csd",
    "orc",
    "sco",
    "udo"
]);
const mediaMimePrefixes = ["audio/", "video/"];
const mediaMimeTypes = new Set([
    "application/ogg",
    "application/x-midi",
    "audio/midi",
    "audio/sp-midi",
    "audio/x-aiff",
    "audio/x-midi",
    "audio/x-wav"
]);
const audioExtensions = new Set([
    ".aif",
    ".aiff",
    ".flac",
    ".m4a",
    ".mp3",
    ".ogg",
    ".wav"
]);
const midiExtensions = new Set([".kar", ".mid", ".midi"]);
const sampleExtensions = new Set([".sf2", ".sfz"]);
const otherMediaExtensions = new Set([".mp4", ".mov", ".webm"]);

const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");

    if (lastDotIndex < 0) {
        return "";
    }

    return filename.slice(lastDotIndex).toLowerCase();
};

export function getFileTypeIconDetails(
    filename: string,
    mimeType?: string
): FileTypeIconDetails | null {
    const extension = getFileExtension(filename);
    const extensionWithoutDot = extension.slice(1);

    if (csoundExtensions.has(extensionWithoutDot as CsoundFileCategory)) {
        return {
            kind: "csound",
            category: extensionWithoutDot as CsoundFileCategory
        };
    }

    const normalizedMimeType =
        mimeType?.toLowerCase() || mime.getType(filename) || "";

    if (sampleExtensions.has(extension)) {
        return {
            kind: "media",
            category: "sample",
            label: extension === ".sf2" ? "SF2" : "SFZ"
        };
    }

    if (midiExtensions.has(extension) || normalizedMimeType.includes("midi")) {
        return {
            kind: "media",
            category: "midi",
            label:
                extension === ".midi"
                    ? "MID"
                    : extension.slice(1).toUpperCase() || "MID"
        };
    }

    if (audioExtensions.has(extension)) {
        return {
            kind: "media",
            category: "audio",
            label: extension.slice(1).toUpperCase()
        };
    }

    if (
        otherMediaExtensions.has(extension) ||
        mediaMimePrefixes.some((prefix) =>
            normalizedMimeType.startsWith(prefix)
        ) ||
        mediaMimeTypes.has(normalizedMimeType)
    ) {
        return {
            kind: "media",
            category: "media",
            label: extension.slice(1).toUpperCase() || "MED"
        };
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
        return null;
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
    const normalizedLabel = label.trim().slice(0, 3).toUpperCase() || "???";

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="512"
            height="512"
            viewBox="0 0 512 512"
            xmlSpace="preserve"
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
                fontSize="120"
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
    const { panel, shadow } = theme.fileIcons[category];
    const normalizedLabel = label.trim().slice(0, 3).toUpperCase() || "MED";
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
