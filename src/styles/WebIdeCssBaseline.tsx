import React from "react";

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
    min-height: 100%;
    overflow-x: hidden;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
}

#root {
    position: relative;
    height: 100%;
}

main {
    position: absolute;
    min-height: calc(100% - 64px);
    height: auto;
    width: 100%;
    bottom: 0;
}
nav,
button {
    outline: none;
}
a {text-decoration: none;}

    `}</style>
);

export default WebIdeCssBaseline;
