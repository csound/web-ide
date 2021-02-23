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
}

body {
    position: relative;
    /* 0 important because
     mui's <Menu> adds some
     annoying padding and overflow */
    padding: 0!important;
    overflow: auto!important;
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

.CodeMirror {
    min-height: 50px;
    position: relative;
    overflow: hidden;
    height: 100%;
}

.CodeMirror-scroll {
   box-sizing: content-box !important;
   overflow: scroll !important;
   height: 100%;
   outline: none;
   position: relative;
   margin-bottom: -50px;
    margin-right: -50px;
    padding-bottom: 50px;
}

.CodeMirror-sizer {
   box-sizing: content-box !important;
   position: relative;
}

.CodeMirror-simplescroll-vertical {
    right: 0;
    top: 0;
    position: absolute;
    z-index: 6;
    margin-bottom: -8px;
}

.CodeMirror-simplescroll-horizontal {
    bottom: 0;
    left: 0;
    position: absolute;
    z-index: 6;
}

.CodeMirror-simplescroll-horizontal,
.CodeMirror-simplescroll-vertical {
  background: ${theme.highlightBackgroundAlt}!important;
}

.CodeMirror-simplescroll-horizontal div,
.CodeMirror-simplescroll-vertical div {
  background: ${theme.scrollbar}!important;
  border-radius: 6px!important;
  border: 3px solid transparent!important;
  opacity: 0.8;
}

.CodeMirror-simplescroll-horizontal div:hover,
.CodeMirror-simplescroll-vertical div:hover {
    -webkit-transition: all 0.2s ease;
   transition: all 0.2s ease;
   opacity: 1;
}

.CodeMirror-vscrollbar,.CodeMirror-hscrollbar {
  display: none;
}

.CodeMirror-scrollbar-filler {
    right: 0;
    bottom: 0;
    position: absolute;
    z-index: 6;
    display: none;
}

.CodeMirror-gutter-filler {
    left: 0;
    bottom: 0;
    position: absolute;
    z-index: 6;
    display: none;
}

.CodeMirror-gutters {
    box-sizing: content-box!important;
    position: absolute;
    top: 0;
    min-height: 100%;
    z-index: 0;
    white-space: nowrap;
}

.CodeMirror-lint-markers {
    width: 16px;
}

.CodeMirror-foldgutter {
    width: .7em;
}

.CodeMirror-cursors {
    position: relative;
    z-index: 3;
}

.CodeMirror-cursor {
    position: absolute;
    pointer-events: none;
}

.CodeMirror-cursor {
    border-left: 1px solid black;
    border-right: none;
    width: 0;
}

.CodeMirror-lines {
    cursor: text;
    min-height: 1px;
    padding: 4px 0;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}

.CodeMirror-linenumber {
    position: absolute;
    cursor: default;
    z-index: 4;
    padding: 1px 8px 0 5px;
    min-width: 32px;
    text-align: right;
    white-space: nowrap;
}

.CodeMirror-line {
    padding: 0 4px;
    display: block;
    white-space: pre-wrap;
    word-break: normal;
    -moz-border-radius: 0;
    -webkit-border-radius: 0;
    border-radius: 0;
    border-width: 0;
    background: transparent;
    font-size: inherit;
    margin: 0;
    white-space: pre;
    word-wrap: normal;
    line-height: inherit;
    color: inherit;
    z-index: 2;
    position: relative;
    overflow: visible;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-variant-ligatures: contextual;
    font-variant-ligatures: contextual;
}

.CodeMirror-scroll,
.CodeMirror-sizer,
.CodeMirror-gutter,
.CodeMirror-gutters,
.CodeMirror-linenumber {
    -moz-box-sizing: content-box;
    box-sizing: content-box;
}

.CodeMirror-gutter-wrapper {
    position: absolute;
    z-index: 1;
    background: none !important;
    border: none !important;
}

.CodeMirror-measure {
    position: absolute;
    width: 100%;
    height: 0;
    overflow: hidden;
    visibility: hidden;
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

    `}</style>
);

export default WebIdeCssBaseline;
