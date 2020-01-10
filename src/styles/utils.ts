import hexRgb from "hex-rgb";

export const rgba = (hex, alpha) => {
    const rgb = hexRgb(hex, { format: "array" })
        .slice(0, -1)
        .join(",");
    return `${rgb},${alpha}`;
};
