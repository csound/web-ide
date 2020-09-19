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
    height: calc(100% - ${headerHeight}px);
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

.ps__rail-x,
.ps__rail-y,
.ps__rail-x:hover,
.ps__rail-y:hover,
.ps__rail-x:focus,
.ps__rail-y:focus,
.ps__rail-x.ps--clicking,
.ps__rail-y.ps--clicking {
  z-index: 2;
}
    `}</style>
);

export default WebIdeCssBaseline;
