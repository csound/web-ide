import React, { useEffect, useState } from "react";
import { getDownloadURL } from "firebase/storage";
import { storageReference } from "../../config/firestore";
import { rootStyle } from "./styles";

export const AudioEditor = ({ audioFileUrl }: { audioFileUrl: string }) => {
    const [data, setData] = useState("");
    console.log({ audioFileUrl });

    useEffect(() => {
        if (
            !data &&
            typeof audioFileUrl === "string" &&
            !audioFileUrl.startsWith("blob")
        ) {
            storageReference(audioFileUrl).then((storage) => {
                getDownloadURL(storage).then((fileUrl) => {
                    setData(fileUrl);
                });
            });
        } else if (
            typeof audioFileUrl === "string" &&
            audioFileUrl.startsWith("blob")
        ) {
            setData(audioFileUrl);
        }
    }, [data, setData, audioFileUrl]);
    console.log({ data });
    return data ? (
        <div css={rootStyle}>
            <audio controls>
                <source src={data} />
            </audio>
        </div>
    ) : (
        <div>
            <p>Looking up audio file URL...</p>
        </div>
    );
};
