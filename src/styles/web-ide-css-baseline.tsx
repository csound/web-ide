import React from "react";
import { Theme } from "@emotion/react";
import { headerHeight } from "@styles/constants";

const WebIdeCssBaseline = ({ theme }: { theme: Theme }): React.ReactElement => (
    <style>{`
* {
  -webkit-font-smoothing: antialiased;
  font-smooth: always;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  height: 100%;
}

html,
body {
    padding: 0;
    margin: 0;
    overscroll-behavior-y: none;
    overscroll-behavior-x: none;
}

body {
    position: relative;
    /* 0 important because
     mui's <Menu> adds some
     annoying padding and overflow */
    padding: 0!important;
    overflow: auto!important;
    min-height: 100vh;
}

#root {
    position: relative;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
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
  opacity: 0.2;
  z-index: 1;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

.Resizer:hover {
  -webkit-transition: all 0.2s ease;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.Resizer.horizontal {
  position: relative;
  height: 2px;
  margin: -5px 0;
  padding: 5px;
  cursor: row-resize;
  width: 100%;
  z-index: 2;
}

.Resizer.horizontal::before {
    height: 3px;
    width: 100%;
    background-color: black;
    content: "";
    margin: auto 0;
    position: absolute;
    top: 3px;
    left: 0;
    z-index: -1;
  }


.Resizer.vertical::before {
    width: 3px;
    height: 100%;
    background-color: black;
    content: "";
    margin: 0 auto;
    position: absolute;
    top: 0;
    left: -2px;
    z-index: -1;
  }


.Resizer.vertical {
  position: relative;
  top: 0;
  left: 5px;
  width: 2px;
  height: 100%;
  padding: 5px;
  margin: 0 -5px;
  cursor: col-resize;
  z-index: 1;
}

.Resizer.vertical:hover {
  opacity: 0.5;
}
.Resizer.disabled {
  cursor: not-allowed;
}
.Resizer.disabled:hover {
  border-color: transparent;
}
.Pane1 > div {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.Pane1 > div > div:nth-of-type(2) {
  width: 100%;
  min-width: 0;
  height: 100%;
  position: relative;
}

 [data-rbd-drag-handle-context-id="0"] {
      cursor: inherit!important;
 }

.MuiSvgIcon-root, .MuiIconButton-label svg {
  fill: ${theme.buttonIcon};
}

.MuiListItem-button {
  cursor: grabbing!important;
}

.cm-theme,.cm-editor {
  height: 100%;
}

.cm-scroller {
  overflow: auto;
}

.cm-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.cm-scroller::-webkit-scrollbar-thumb {
  background-color: ${theme.scrollbar};
  border-radius: 6px;
  border: 3px solid transparent;
}

.cm-scroller::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  background: transparent;
}

.cm-scroller::-webkit-scrollbar-corner {
  background: transparent;
}

.cm-lineNumbers {
  order: 0!important;
}

.flexible-modal {
  position: absolute;
  z-index: 1;
  border: 1px solid #ccc;
  background: white;
}
.flexible-modal-mask {
  position: fixed;
  height: 100%;
  background: rgba(55, 55, 55, 0.6);
  top:0;
  left:0;
  right:0;
  bottom:0;
}
.flexible-modal-resizer {
  position:absolute;
  right:0;
  bottom:0;
  cursor:se-resize;
  margin:5px;
  border-bottom: solid 2px #333;
  border-right: solid 2px #333;
}
.flexible-modal-drag-area{
  background: rgba(22, 22, 333, 0.2);
  height: 50px;
  position:absolute;
  right:0;
  top:0;
  cursor:move;
}

/* blink eval */
@keyframes flash-animation {
    0% {
       background-color: ${theme.flash};
    }
    100% {
       background-color: ${theme.flashFade};
    }
}

.blink-eval {
    z-index: 9999999;
    animation-name: flash-animation;
    animation-duration: 0.1s;
    animation-fill-mode: forwards;
}

.cm-line:has(.blink-eval) {
    z-index: 9999999;
    animation-name: flash-animation;
    animation-duration: 0.1s;
    animation-fill-mode: forwards;
}

.blink-eval-error {
    z-index: 9999999;
    background-color: ${theme.errorText};
}

.cm-line:has(.blink-eval-error) {
    z-index: 9999999;
    background-color: ${theme.errorText};
}

    `}</style>
);

export default WebIdeCssBaseline;
