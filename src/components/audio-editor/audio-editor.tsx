import React, { useEffect, useState } from "react";
import { storageReference } from "../../config/firestore";

import withStyles from "./styles";

type AudioEditorProps = {
    audioFileUrl: string;
    classes: any;
};

const AudioEditor = ({ audioFileUrl, classes }: AudioEditorProps) => {
    const [data, setData] = useState();
    // console.log("AFURL: " + audioFileUrl)
    // console.log("Data: " + data)
    useEffect(() => {
        (async () => {
            const fileUrl = await storageReference
                .child(audioFileUrl)
                .getDownloadURL();
            setData(fileUrl);
        })();
    }, [audioFileUrl]);
    return !data ? (
        <div>
            <p>Looking up audio file URL...</p>
        </div>
    ) : (
        <div className={classes.root}>
            <audio controls>
                <source src={data!} />
            </audio>
        </div>
    );
};

export default withStyles(AudioEditor);
