import { ICsoundStatus } from "./types";

/*
   CsoundObj.js

   Copyright (C) 2018 Steven Yi, Victor Lazzarini

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

/* eslint-disable */

declare global {
    interface Window {
        CsoundNodeFactory: any;
        CsoundScriptProcessorNodeFactory: any;
        CSOUND_AUDIO_CONTEXT: AudioContext;
    }
}

/** Csound global AudioContext
 */
let CSOUND_AUDIO_CONTEXT =
    (window as any).CSOUND_AUDIO_CONTEXT ||
    (function() {
        try {
            var AudioContext =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext;
            return new AudioContext();
        } catch (error) {
            console.log("Web Audio API is not supported in this browser");
        }
        return null;
    })();
window.CSOUND_AUDIO_CONTEXT = CSOUND_AUDIO_CONTEXT;

// Global singleton variables
var AudioWorkletGlobalScope = (window as any).AudioWorkletGlobalScope || {};
var CSOUND_NODE_SCRIPT: any;
let CS_HAS_AUDIO_WORKLET: boolean;
let CS_NODE_FACTORY: any;

/* SETUP NODE TYPE */
if (
    typeof AudioWorkletNode !== "undefined" &&
    CSOUND_AUDIO_CONTEXT.audioWorklet !== undefined
) {
    console.log("Using WASM + AudioWorklet Csound implementation");
    CSOUND_NODE_SCRIPT = "CsoundNode.js";
    CS_HAS_AUDIO_WORKLET = true;
} else {
    console.log("Using WASM + ScriptProcessorNode Csound implementation");
    CSOUND_NODE_SCRIPT = "CsoundScriptProcessorNode.js";
    CS_HAS_AUDIO_WORKLET = false;
}

const csound_load_script = function(src: any, callback: any) {
    var script: any = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "script"
    );
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
};

/** This ES6 Class provides an interface to the Csound
 * engine running on a node (an AudioWorkletNode where available,
 * ScriptProcessorNode elsewhere)
 * This class is designed to be compatible with
 * the previous ScriptProcessorNode-based CsoundObj
 */
class CsoundObj {
    /** Create a CsoundObj
     * @constructor
     */
    public audioContext: any;
    public node: any;
    public microphoneNode: any;

    constructor() {
        this.audioContext = CSOUND_AUDIO_CONTEXT;

        // exposes node as property, user may access to set port onMessage callback
        // or we can add a setOnMessage(cb) method on CsoundObj...
        this.node = CsoundObj.createNode();
        this.node.connect(this.audioContext.destination);
        this.microphoneNode = null;
    }

    /** Returns the underlying Csound node
       running the Csound engine.
     */
    getNode() {
        return this.node;
    }

    /** Writes data to a file in the WASM filesystem for
     *  use with csound.
     *
     * @param {string} filePath A string containing the path to write to.
     * @param {blob}   blobData The data to write to file.
     */
    writeToFS(filePath: any, blobData: any) {
        this.node.writeToFS(filePath, blobData);
    }

    /** Unlink file from WASM filesystem (i.e. remove).
     *
     * @param {string} filePath A string containing the path to unlink.
     */
    unlinkFromFS(filePath: string) {
        this.node.unlinkFromFS(filePath);
    }

    /** Compiles a CSD, which may be given as a filename in the
     *  WASM filesystem or a string containing the code
     *
     * @param {string} csd A string containing the CSD filename or the CSD code.
     */
    compileCSD(csd: any) {
        this.node.compileCSD(csd);
    }

    /** Compiles Csound orchestra code.
     *
     * @param {string} orcString A string containing the orchestra code.
     */
    compileOrc(orcString: any) {
        this.node.compileOrc(orcString);
    }

    /** Sets a Csound engine option (flag)
     *
     *
     * @param {string} option The Csound engine option to set. This should
     * not contain any whitespace.
     */
    setOption(option: any) {
        this.node.setOption(option);
    }

    render(filePath: any) {}

    /** Evaluates Csound orchestra code.
     *
     * @param {string} codeString A string containing the orchestra code.
     */
    evaluateCode(codeString: any) {
        this.node.evaluateCode(codeString);
    }

    /** Evaluates Csound orchestra code and returns promise containing result code
     *
     * @param {string} codeString A string containing the orchestra code.
     */
    evaluateCodePromise(codeString: any) {
        return this.node.evaluateCodePromise(codeString);
    }

    /** Reads a numeric score string.
     *
     * @param {string} scoreString A string containing a numeric score.
     */
    readScore(scoreString: any) {
        this.node.readScore(scoreString);
    }

    /** Sets the value of a control channel in the software bus
     *
     * @param {string} channelName A string containing the channel name.
     * @param {number} value The value to be set.
     */
    setControlChannel(channelName: any, value: any) {
        this.node.setControlChannel(channelName, value);
    }

    /** Sets the value of a string channel in the software bus
     *
     * @param {string} channelName A string containing the channel name.
     * @param {string} stringValue The string to be set.
     */
    setStringChannel(channelName: any, stringValue: any) {
        this.node.setStringChannel(channelName, stringValue);
    }

    /** Request the data from a control channel
     *
     * @param {string} channelName A string containing the channel name.
     * @param {function} callback An optional callback to be called when
     *  the requested data is available. This can be set once for all
     *  subsequent requests.
     */
    requestControlChannel(channelName: any, callback: any = null) {
        this.node.requestControlChannel(channelName, callback);
    }

    /** Request the string data from a control channel
     *
     * @param {string} channelName A string containing the channel name.
     * @param {function} callback An optional callback to be called when
     *  the requested data is available. This can be set once for all
     *  subsequent requests.
     */
    requestStringChannel(channelName: any, callback: any = null) {
        this.node.requestStringChannel(channelName, callback);
    }

    /** Get the latest requested control channel data
     *
     * @param {string} channelName A string containing the channel name.
     * @returns {(number)} The latest channel value requested.
     */
    getControlChannel(channelName: any) {
        return this.node.getControlChannel(channelName);
    }

    /** Get the latest requested string channel data
     *
     * @param {string} channelName A string containing the channel name.
     * @returns {(number|string)} The latest channel value requested.
     */
    getStringChannel(channelName: any) {
        return this.node.getStringChannel(channelName);
    }

    /** Request the data from a Csound function table
     *
     * @param {number} number The function table number
     * @param {function} callback An optional callback to be called when
     *  the requested data is available. This can be set once for all
     *  subsequent requests.
     */
    requestTable(number: any, callback: any = null) {
        this.node.requestTable(number, callback);
    }

    /** Get the requested table number
     *
     * @param {number} number The function table number
     * @returns {Float32Array} The table as a typed array.
     */
    getTable(number: any) {
        return this.node.getTable(number);
    }

    /** Set a specific table position
     *
     * @param {number} number The function table number
     * @param {number} index The index of the position to be set
     * @param {number} value The value to set
     */
    setTableValue(number: any, index: any, value: any) {
        this.node.setTableValue(number, index, value);
    }

    /** Set a table with data from an array
     *
     * @param {number} number The function table number
     * @param {Float32Array} table The source data for the table
     */
    setTable(number: any, table: any) {
        this.node.setTable(number, table);
    }

    /** Starts the node containing the Csound engine.
     */
    start() {
        if (this.microphoneNode != null) {
            this.microphoneNode.connect(this.node);
        }
        this.node.start();
    }

    /** Resets the Csound engine.
     */
    reset() {
        this.node.reset();
    }

    destroy() {}

    /** Starts performance, same as start()
     */
    play() {
        this.node.start();
    }

    /** Stops (pauses) performance
     */
    stop() {
        this.node.stop();
    }

    /** Sets a callback to process Csound console messages.
     *
     * @param {function} msgCallback A callback to process messages
     * with signature function(message), where message is a string
     * from Csound.
     */
    setMessageCallback(msgCallback: any) {
        this.node.setMessageCallback(msgCallback);
    }

    /** Sends a MIDI channel message to Csound
     *
     * @param {number} byte1 MIDI status byte
     * @param {number} byte2 MIDI data byte 1
     * @param {number} byte1 MIDI data byte 2
     *
     */
    midiMessage(byte1: any, byte2: any, byte3: any) {
        this.node.midiMessage(byte1, byte2, byte3);
    }

    /** Enables microphone (external audio) input in browser
     *
     * @param {function} audioInputCallback A callback with a signature
     * function(result), with result set to true in the event of success
     * or false if the microphone cannot be enabled
     */
    enableAudioInput(audioInputCallback: any) {
        navigator.getUserMedia =
            (window as any).navigator.getUserMedia ||
            (window as any).navigator.webkitGetUserMedia ||
            (window as any).navigator.mozGetUserMedia ||
            null;
        let that = this;

        if (navigator.getUserMedia === null) {
            console.log("Audio Input not supported in this browser");
            audioInputCallback(false);
        } else {
            let onSuccess = function(stream: any) {
                that.microphoneNode = CSOUND_AUDIO_CONTEXT.createMediaStreamSource(
                    stream
                );
                audioInputCallback(true);
            };

            let onFailure = function(error: any) {
                that.microphoneNode = null;
                console.log("Could not initialise audio input, error:" + error);
                audioInputCallback(false);
            };
            navigator.getUserMedia(
                {
                    audio: true,
                    video: false
                },
                onSuccess,
                onFailure
            );
        }
    }

    enableMidiInput(midiInputCallback: any) {
        const handleMidiInput = (evt: any) => {
            this.midiMessage(evt.data[0], evt.data[1], evt.data[2]);
        };
        const midiSuccess = function(midiInterface: any) {
            const inputs = midiInterface.inputs.values();

            for (
                let input = inputs.next();
                input && !input.done;
                input = inputs.next()
            ) {
                input = input.value;
                input.onmidimessage = handleMidiInput;
            }
            if (midiInputCallback) {
                midiInputCallback(true);
            }
        };

        const midiFail = function(error: any) {
            console.log("MIDI failed to start, error:" + error);
            if (midiInputCallback) {
                midiInputCallback(false);
            }
        };

        if ((window as any).navigator.requestMIDIAccess) {
            (window as any).navigator
                .requestMIDIAccess()
                .then(midiSuccess, midiFail);
        } else {
            console.log("MIDI not supported in this browser");
            if (midiInputCallback) {
                midiInputCallback(false);
            }
        }
    }

    /** Returns the current play state of Csound. Results are either
     * "playing", "paused", or "stopped".
     */

    getPlayState(): ICsoundStatus {
        return this.node.getPlayState();
    }

    /** Add a listener callback for play state listening. Must be a function
     * of type (csoundObj:CsoundObj):void.
     */

    addPlayStateListener(listener: (csoundObj: CsoundObj) => void) {
        // CsoundObj will wrap the listener so that it will use itself as the
        // as the listener's argument
        this.node.addPlayStateListener((csoundObj: CsoundObj) =>
            listener(this)
        );
    }

    /** Remove a listener callback for play state listening. Must be the same
     * function as passed in with addPlayStateListener.
     */

    removePlayStateListener(listener: (csoundObj: CsoundObj) => void) {
        this.node.removePlayStateListener(listener);
    }

    /**
     * This static method is used to asynchronously setup the Csound
     *  engine node.
     *
     * @param {string} script_base A string containing the base path to scripts
     */
    static importScripts(script_base = "./") {
        return new Promise(resolve => {
            csound_load_script(script_base + CSOUND_NODE_SCRIPT, () => {
                CS_NODE_FACTORY = CS_HAS_AUDIO_WORKLET
                    ? window.CsoundNodeFactory
                    : window.CsoundScriptProcessorNodeFactory;
                // FIXME
                CS_NODE_FACTORY.importScripts(script_base).then(() => {
                    resolve();
                });
            });
        });
    }

    /**
     * This static method creates a new Csound Engine node unattached
     * to a CsoundObj object. It can be used in scenarios where
     * CsoundObj is not needed (ie. WebAudio API programming)
     *
     *  @param {number} InputChannelCount number of input channels
     *  @param {number} OutputChannelCount number of output channels
     *  @return A new Csound Engine Node (CsoundNode or CsoundScriptProcessorNode)
     */
    static createNode(inputChannelCount = 1, outputChannelCount = 2) {
        return CS_NODE_FACTORY.createNode(
            inputChannelCount,
            outputChannelCount
        );
    }
}

export default CsoundObj;
