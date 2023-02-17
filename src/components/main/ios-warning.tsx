import { isIOS } from "@root/utils";
import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";

const IosWarning = (): React.ReactElement => {
    const [open, setOpen] = useState(true);
    if (isIOS()) {
        const alreadyShown = localStorage.getItem("ios:warning:shown") === "1";
        return (
            <>
                {!alreadyShown && (
                    <Dialog open={open} fullScreen={true}>
                        <div
                            style={{
                                marginTop: 20,
                                display: "flex",
                                justifyContent: "center",
                                flexDirection: "column",
                                alignSelf: "center",
                                textAlign: "center",
                                width: "100%"
                            }}
                        >
                            <h1>{`Dear iOS user`}</h1>
                            <img
                                src="/img/ios_notification_warning.png"
                                alt="iphone notification switch"
                                style={{
                                    display: "block",
                                    width: 360,
                                    alignSelf: "center"
                                }}
                            />
                            <p
                                style={{
                                    fontSize: 15,
                                    width: 360,
                                    alignSelf: "center"
                                }}
                            >{`Please make sure that you have the notifications turned ON (Ring) while using the web-ide, otherwise you wont experience any audio trough your web-browser. Enjoy!`}</p>
                            <Button
                                style={{
                                    alignSelf: "center",
                                    color: "white",
                                    backgroundColor: "blue"
                                }}
                                variant="outlined"
                                onClick={() => {
                                    localStorage.setItem(
                                        "ios:warning:shown",
                                        "1"
                                    );
                                    setOpen(false);
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </Dialog>
                )}
            </>
        );
    } else {
        return <></>;
    }
};

export default IosWarning;
