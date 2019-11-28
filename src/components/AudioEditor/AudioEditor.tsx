import React from "react";
import { storageRef } from "../../config/firestore";
import { useEffect, useState } from "react";

type AudioEditorProps = {
    audioFileUrl:string,
}

export const AudioEditor = ({audioFileUrl}:AudioEditorProps) => {
    const [data, setData] = useState(null);
    console.log("AFURL: " + audioFileUrl)
    console.log("Data: " + data)
    useEffect(() => {
        (async () => {
        const fileUrl = await storageRef
                        .child(audioFileUrl)
                        .getDownloadURL();
        setData(fileUrl);
        })();
    }, [audioFileUrl]);
    return data == null ?
        <div>
            <p>Looking up audio file URL...</p>
        </div> 
        :
        <div>
            <audio controls>
                <source src={data!}/>
            </audio>
        </div>
        ;
};

export default AudioEditor;