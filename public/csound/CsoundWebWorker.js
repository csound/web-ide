/*
    CsoundWebWorker.js

    Copyright (C) 2019 Steven Yi

    This file is part of Csound.

    The Csound Library is free software; you can redistribute it
    and/or modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation; either
    version 2.1 of the License, or (at your option) any later version.

    Csound is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with Csound; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
    02110-1301 USA
*/

//import libcsound from './libcsound-worklet.js'
importScripts('./libcsound-worker.js')

const CSMOD = {} 

let printCallbacks = [];
let printMessages = (t) => {
  for(let i = 0; i < printCallbacks.length; i++) {
    printCallbacks[i](t);
  }
};

CSMOD["ENVIRONMENT"] = "WEB";
CSMOD["print"] = printMessages;
CSMOD["printErr"] = printMessages;


// INITIALIAZE WASM
libcsound(CSMOD);

// SETUP FS

let FS = CSMOD["FS"];
let pointerStringify = CSMOD["Pointer_stringify"];



// Get cwrap-ed functions
const Csound = {

    new: CSMOD.cwrap('CsoundObj_new', ['number'], null),
    compileCSD: CSMOD.cwrap('CsoundObj_compileCSD', ['number'], ['number', 'string']),
    compile: CSMOD.cwrap('CsoundObj_compile', ['number'], ['number', 'string', 'string']),
    reset: CSMOD.cwrap('CsoundObj_reset', null, ['number']),
    render: CSMOD.cwrap('CsoundObj_render', null, ['number']),
    setOption: CSMOD.cwrap('CsoundObj_setOption', null, ['number', 'string']),
    getScoreTime: CSMOD.cwrap('CsoundObj_getScoreTime', null, ['number']),

}

printCallbacks.push((t) => {
    postMessage(["log", t]);
});

onmessage = (evt) => {
    const data = evt.data;

    switch(data[0]) {

        case "writeToFS": {
            const name = data[1];
            const blobData = data[2];
            postMessage(['log', `File Received: ${name}`]);
            const buf = new Uint8Array(blobData)
            const stream = FS.open(name, 'w+');
            FS.write(stream, buf, 0, buf.length, 0);
            FS.close(stream);
            break;
        }
        case "renderCSD": {
            const name = data[1];
            const csObj = Csound.new();

            Csound.setOption(csObj, "-W");
            // Csound.setOption(csObj, "--output=output.wav");
            Csound.compile(csObj, name, "-ooutput.wav");
            Csound.render(csObj);

            const output = FS.readFile("output.wav");
            postMessage(['renderResult', output]);
            
            break;
        }
        default:
            postMessage(['log', '[CsoundWebWorker] Invalid Message: "' + evt.data]);
    }
};


