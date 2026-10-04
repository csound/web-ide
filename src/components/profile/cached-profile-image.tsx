import React, { useState } from "react";
import { styled } from "@mui/material/styles";

interface CachedImageProps {
    src?: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    style?: React.CSSProperties;
    onLoad?: () => void;
    onError?: () => void;
    showLoadingPlaceholder?: boolean;
}

const StyledImg = styled("img")`
    object-fit: cover;
`;

const ProfileImage: React.FC<CachedImageProps> = ({
    src,
    alt = "Profile Image",
    width,
    height,
    className,
    style,
    onLoad,
    onError,
    showLoadingPlaceholder = true
}) => {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">(
        "loading"
    );
    if (status === "error") return null;
    const showPlaceholder = status === "loading" && showLoadingPlaceholder;

    // Let HTTP caching handle photos. Canvas/localStorage caching requires CORS
    // access that some otherwise valid profile image hosts do not provide.
    return (
        <>
            {showPlaceholder && (
                <div
                    style={{
                        width: width || "100%",
                        height: height || "100%",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ...style
                    }}
                    className={className}
                >
                    <div style={{ fontSize: "12px", color: "#666" }}>
                        Loading...
                    </div>
                </div>
            )}
            <StyledImg
                src={src}
                crossOrigin={
                    globalThis.crossOriginIsolated ? "anonymous" : undefined
                }
                alt={alt}
                width={width}
                height={height}
                className={className}
                style={{
                    ...style,
                    ...(showPlaceholder ? { display: "none" } : {})
                }}
                onLoad={() => {
                    setStatus("loaded");
                    onLoad?.();
                }}
                onError={() => {
                    setStatus("error");
                    onError?.();
                }}
            />
        </>
    );
};

export const CachedProfileImage: React.FC<CachedImageProps> = (props) =>
    props.src ? <ProfileImage key={props.src} {...props} /> : null;

export default CachedProfileImage;
