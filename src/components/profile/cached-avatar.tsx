import Avatar, { type AvatarProps } from "@mui/material/Avatar";

// Use the browser cache and MUI's initials fallback. The isolated editor still
// needs CORS permission for remote images under its require-corp policy.
export const CachedAvatar = ({ slotProps, ...props }: AvatarProps) => {
    const imageProps =
        typeof slotProps?.img === "function"
            ? slotProps.img(props)
            : slotProps?.img;
    return (
        <Avatar
            {...props}
            slotProps={{
                ...slotProps,
                img: {
                    crossOrigin: globalThis.crossOriginIsolated
                        ? "anonymous"
                        : undefined,
                    ...imageProps
                }
            }}
        />
    );
};

export default CachedAvatar;
