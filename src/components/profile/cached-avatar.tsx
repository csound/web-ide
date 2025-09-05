import React, { useState, useEffect } from "react";
import Avatar from "@mui/material/Avatar";
import { profileImageCache } from "./cached-profile-image";

interface CachedAvatarProps {
    src?: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    [key: string]: any; // Allow other Avatar props
}

export const CachedAvatar: React.FC<CachedAvatarProps> = ({
    src,
    alt,
    className,
    style,
    children,
    ...otherProps
}) => {
    const [cachedSrc, setCachedSrc] = useState<string | undefined>(src);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!src) {
            setCachedSrc(undefined);
            return;
        }

        // Check cache first
        const cached = profileImageCache.get(src);
        if (cached) {
            setCachedSrc(cached);
            return;
        }

        // If not cached, show loading state and cache the image
        setIsLoading(true);

        // Use the original src while we cache it in the background
        setCachedSrc(src);

        // Cache the image for future use
        const cacheImage = async () => {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (ctx) {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);

                            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                            profileImageCache.set(src, dataUrl);
                            setCachedSrc(dataUrl);
                        }
                    } catch (error) {
                        console.warn("Failed to cache avatar image:", error);
                    } finally {
                        setIsLoading(false);
                    }
                };

                img.onerror = () => {
                    console.warn("Failed to load avatar image for caching");
                    setIsLoading(false);
                };

                img.src = src;
            } catch (error) {
                console.warn("Failed to cache avatar image:", error);
                setIsLoading(false);
            }
        };

        cacheImage();
    }, [src]);

    return (
        <Avatar
            src={cachedSrc}
            alt={alt}
            className={className}
            style={style}
            {...otherProps}
        >
            {children}
        </Avatar>
    );
};

export default CachedAvatar;
