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

.Resizer {
  background: #000;
  opacity: 0.2;
  z-index: 1;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -moz-background-clip: padding;
  -webkit-background-clip: padding;
  background-clip: padding-box;
}

.Resizer:hover {
  -webkit-transition: all 2s ease;
  transition: all 2s ease;
}

.Resizer.horizontal {
  height: 11px;
  margin: -5px 0;
  border-top: 5px solid rgba(255, 255, 255, 0);
  border-bottom: 5px solid rgba(255, 255, 255, 0);
  cursor: row-resize;
  width: 100%;
}

.Resizer.horizontal:hover {
  border-top: 5px solid rgba(0, 0, 0, 0.5);
  border-bottom: 5px solid rgba(0, 0, 0, 0.5);
}

.Resizer.vertical {
  width: 11px;
  margin: 0 -5px;
  border-left: 5px solid rgba(255, 255, 255, 0);
  border-right: 5px solid rgba(255, 255, 255, 0);
  cursor: col-resize;
}

.Resizer.vertical:hover {
  border-left: 5px solid rgba(0, 0, 0, 0.5);
  border-right: 5px solid rgba(0, 0, 0, 0.5);
}
.Resizer.disabled {
  cursor: not-allowed;
}
.Resizer.disabled:hover {
  border-color: transparent;
}
    `}</style>
);

export default WebIdeCssBaseline;
