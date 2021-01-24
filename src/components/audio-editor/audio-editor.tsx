import React, { useEffect, useState } from "react";
import { storageReference } from "../../config/firestore";

import withStyles from "./styles";

type IAudioEditorProperties = {
    audioFileUrl: string;
    classes: any;
};

const AudioEditor = ({ audioFileUrl, classes }: IAudioEditorProperties) => {
    const [data, setData] = useState();
    // console.log("AFURL: " + audioFileUrl)
    // console.log("Data: " + data)
    useEffect(() => {
        if (!data) {
            storageReference
                .child(audioFileUrl)
                .getDownloadURL()
                .then((fileUrl) => {
                    setData(fileUrl);
                });
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
