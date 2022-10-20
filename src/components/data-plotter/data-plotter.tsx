import React from "react";

type DataPlotterProperties = {
    dataFileUrl: string;
};

const DataPlotter = ({ dataFileUrl }: DataPlotterProperties) => {
    return <h1>HELLO!</h1>;
    // const [data, setData] = useState("");
    // // console.log("AFURL: " + audioFileUrl)
    // // console.log("Data: " + data)
    // useEffect(() => {
    //     if (!data) {
    //         storageReference(audioFileUrl).then((storage) => {
    //             getDownloadURL(storage).then((fileUrl) => {
    //                 setData(fileUrl);
    //             });
    //         });
    //     }
    // }, [data, setData, audioFileUrl]);

    // return !data ? (
    //     <div>
    //         <p>Looking up audio file URL...</p>
    //     </div>
    // ) : (
    //     <div className={classes.root}>
    //         <audio controls>
    //             <source src={data} />
    //         </audio>
    //     </div>
    // );
};

export default DataPlotter;
