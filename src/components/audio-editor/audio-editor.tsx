import React, { useEffect, useState } from "react";
import { getDownloadURL } from "firebase/storage";
import { storageReference } from "../../config/firestore";

import withStyles from "./styles";

type IAudioEditorProperties = {
    audioFileUrl: string;
    classes: any;
};

const AudioEditor = ({ audioFileUrl, classes }: IAudioEditorProperties) => {
    const [data, setData] = useState("");

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
    return !data ? (
        <div>
            <p>Looking up audio file URL...</p>
        </div>
    ) : (
        <div className={classes.root}>
            <audio controls>
                <source src={data} />
            </audio>
        </div>
    );
};

export default withStyles(AudioEditor);
