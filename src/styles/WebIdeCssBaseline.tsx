import React from "react";
import { headerHeight } from "@styles/constants";

const WebIdeCssBaseline = () => (
    <style>{`
html {
    height: 100%;
    overflow: hidden;
}
html,
body {
    padding: 0;
    margin: 0;
}

body {
    height: inherit;
    min-height: 100%;
    overflow: hidden;
    position: relative;
}

#root {
    position: relative;
    height: calc(100% - ${headerHeight}px)!important;
    height: 100%;
    top: ${headerHeight}px;
    bottom: 0;
    overflow: auto;
}

main {
    position: relative;
    height: auto;
    width: 100%;
    top: 0;
}
nav,
button {
    outline: none;
}
a {text-decoration: none;}

    `}</style>
);

export default WebIdeCssBaseline;
