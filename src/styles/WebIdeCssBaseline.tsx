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
    position: relative;
}

#root {
    position: relative;
    min-height: 100vh;
}

main {
    position: relative;
    min-height: calc(100% - 64px);
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
