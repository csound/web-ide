import { blobFromBytes } from "@root/utils/blob";
import { useEffect, useState } from "react";

/** Own one playback URL and revoke it when the preview changes. */
export function useAudioUrl(data?: Uint8Array) {
    const [owned, setOwned] = useState<{ data: Uint8Array; url: string }>();
    useEffect(() => {
        if (!data) {
            setOwned(undefined);
            return;
        }
        const next = URL.createObjectURL(
            blobFromBytes(data, { type: "audio/wav" })
        );
        setOwned({ data, url: next });
        return () => URL.revokeObjectURL(next);
    }, [data]);
    return owned?.data === data ? owned?.url : undefined;
}
