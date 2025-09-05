import React, { useState, useEffect, useRef } from "react";
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
}

const StyledImg = styled("img")`
    object-fit: cover;
`;

// Cache configuration
const CACHE_PREFIX = "csound_profile_img_";
const CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours
const MAX_CACHE_SIZE = 50; // Maximum number of cached images

interface CacheEntry {
    dataUrl: string;
    timestamp: number;
    lastAccessed: number;
}

class ImageCache {
    private static instance: ImageCache;

    static getInstance(): ImageCache {
        if (!ImageCache.instance) {
            ImageCache.instance = new ImageCache();
        }
        return ImageCache.instance;
    }

    private constructor() {
        this.cleanupExpiredEntries();
    }

    private getCacheKey(url: string): string {
        return CACHE_PREFIX + btoa(url).replace(/[^a-zA-Z0-9]/g, "");
    }

    private isExpired(timestamp: number): boolean {
        const now = Date.now();
        const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
        return now - timestamp > expiryTime;
    }

    private cleanupExpiredEntries(): void {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter((key) =>
                key.startsWith(CACHE_PREFIX)
            );

            for (const key of cacheKeys) {
                try {
                    const entry: CacheEntry = JSON.parse(
                        localStorage.getItem(key) || "{}"
                    );
                    if (this.isExpired(entry.timestamp)) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Remove corrupted entries
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            console.warn("Failed to cleanup expired cache entries:", e);
        }
    }

    private enforceMaxCacheSize(): void {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter((key) =>
                key.startsWith(CACHE_PREFIX)
            );

            if (cacheKeys.length >= MAX_CACHE_SIZE) {
                // Sort by last accessed time and remove oldest entries
                const entries = cacheKeys
                    .map((key) => {
                        try {
                            const entry: CacheEntry = JSON.parse(
                                localStorage.getItem(key) || "{}"
                            );
                            return {
                                key,
                                lastAccessed: entry.lastAccessed || 0
                            };
                        } catch (e) {
                            return { key, lastAccessed: 0 };
                        }
                    })
                    .sort((a, b) => a.lastAccessed - b.lastAccessed);

                // Remove oldest entries to make room
                const entriesToRemove = entries.slice(
                    0,
                    cacheKeys.length - MAX_CACHE_SIZE + 1
                );
                for (const entry of entriesToRemove) {
                    localStorage.removeItem(entry.key);
                }
            }
        } catch (e) {
            console.warn("Failed to enforce cache size limit:", e);
        }
    }

    get(url: string): string | null {
        if (!url) return null;

        try {
            const key = this.getCacheKey(url);
            const cached = localStorage.getItem(key);

            if (cached) {
                const entry: CacheEntry = JSON.parse(cached);

                if (this.isExpired(entry.timestamp)) {
                    localStorage.removeItem(key);
                    return null;
                }

                // Update last accessed time
                entry.lastAccessed = Date.now();
                localStorage.setItem(key, JSON.stringify(entry));

                return entry.dataUrl;
            }
        } catch (e) {
            console.warn("Failed to get cached image:", e);
        }

        return null;
    }

    async set(url: string, dataUrl: string): Promise<void> {
        if (!url || !dataUrl) return;

        try {
            this.enforceMaxCacheSize();

            const key = this.getCacheKey(url);
            const entry: CacheEntry = {
                dataUrl,
                timestamp: Date.now(),
                lastAccessed: Date.now()
            };

            localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            console.warn("Failed to cache image:", e);
            // If localStorage is full, try to clear some space
            if (e instanceof DOMException && e.code === 22) {
                this.clearOldestEntries(5);
                try {
                    const key = this.getCacheKey(url);
                    const entry: CacheEntry = {
                        dataUrl,
                        timestamp: Date.now(),
                        lastAccessed: Date.now()
                    };
                    localStorage.setItem(key, JSON.stringify(entry));
                } catch (retryError) {
                    console.warn(
                        "Failed to cache image after cleanup:",
                        retryError
                    );
                }
            }
        }
    }

    private clearOldestEntries(count: number): void {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter((key) =>
                key.startsWith(CACHE_PREFIX)
            );

            const entries = cacheKeys
                .map((key) => {
                    try {
                        const entry: CacheEntry = JSON.parse(
                            localStorage.getItem(key) || "{}"
                        );
                        return { key, lastAccessed: entry.lastAccessed || 0 };
                    } catch (e) {
                        return { key, lastAccessed: 0 };
                    }
                })
                .sort((a, b) => a.lastAccessed - b.lastAccessed);

            for (let i = 0; i < Math.min(count, entries.length); i++) {
                localStorage.removeItem(entries[i].key);
            }
        } catch (e) {
            console.warn("Failed to clear oldest cache entries:", e);
        }
    }

    clear(): void {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter((key) =>
                key.startsWith(CACHE_PREFIX)
            );
            for (const key of cacheKeys) {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn("Failed to clear image cache:", e);
        }
    }
}

const imageCache = ImageCache.getInstance();

// Convert image URL to data URL for caching
const urlToDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                // Convert to data URL with compression
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                resolve(dataUrl);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
};

export const CachedProfileImage: React.FC<CachedImageProps> = ({
    src,
    alt = "Profile Image",
    width,
    height,
    className,
    style,
    onLoad,
    onError
}) => {
    const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const loadingRef = useRef<string | null>(null);

    useEffect(() => {
        if (!src) {
            setImageSrc(undefined);
            setHasError(false);
            return;
        }

        // Prevent loading the same image multiple times
        if (loadingRef.current === src) {
            return;
        }

        setHasError(false);
        setIsLoading(true);
        loadingRef.current = src;

        // Check cache first
        const cachedImage = imageCache.get(src);
        if (cachedImage) {
            setImageSrc(cachedImage);
            setIsLoading(false);
            loadingRef.current = null;
            onLoad?.();
            return;
        }

        // Load and cache the image
        const loadImage = async () => {
            try {
                const dataUrl = await urlToDataUrl(src);

                // Only update if this is still the current request
                if (loadingRef.current === src) {
                    await imageCache.set(src, dataUrl);
                    setImageSrc(dataUrl);
                    setIsLoading(false);
                    loadingRef.current = null;
                    onLoad?.();
                }
            } catch (error) {
                console.warn("Failed to load and cache image:", error);

                // Only update if this is still the current request
                if (loadingRef.current === src) {
                    // Fallback to original URL
                    setImageSrc(src);
                    setIsLoading(false);
                    setHasError(true);
                    loadingRef.current = null;
                    onError?.();
                }
            }
        };

        loadImage();

        return () => {
            // Clear loading ref if component unmounts
            if (loadingRef.current === src) {
                loadingRef.current = null;
            }
        };
    }, [src, onLoad, onError]);

    if (!src) {
        return null;
    }

    if (isLoading && !imageSrc) {
        // Show a placeholder while loading
        return (
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
        );
    }

    return (
        <StyledImg
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            className={className}
            style={style}
            onLoad={onLoad}
            onError={(e) => {
                setHasError(true);
                onError?.();
            }}
        />
    );
};

export default CachedProfileImage;

// Export cache utilities for manual cache management
export const profileImageCache = {
    clear: () => imageCache.clear(),
    get: (url: string) => imageCache.get(url),
    set: (url: string, dataUrl: string) => imageCache.set(url, dataUrl)
};
