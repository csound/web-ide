const PREFIX = "CSOUND.";

export type ICsoundStatus =
    | "initialized"
    | "stopped"
    | "paused"
    | "playing"
    | "rendering";

// ACTION TYPES
export const SET_CSOUND = PREFIX + "SET_CSOUND";
export const SET_CSOUND_PLAY_STATE = PREFIX + "SET_CSOUND_PLAY_STATE";

// INTERFACES
export interface ICsoundObj {
    audioContext: any;
    writeToFS: (filepath: string, data: any) => void;
    unlinkFromFS: (filepath: string) => void;
    compileCSD: (csd: string) => void;
    compileOrc: (orc: string) => void;
    setOption: (option: string) => void;
    render: (filepath: string) => void;
    evaluateCode: (code: string) => void;
    readScore: (score: string) => void;
    setControlChannel: (channelName: string, value: number) => void;
    setStringChannel: (channelNama: string, value: string) => void;
    requestControlChannel: (channelName: string, callback: () => void) => void;
    requestStringChannel: (channelName: string, callback: () => void) => void;
    getControlChannel: (channelName: string) => number;
    getStringChannel: (channelName: string) => string | number;
    requestTable: (tabNum: number, callback: () => void) => void;
    getTable: (tabNum: number) => ArrayBuffer;
    setTableValue: (tabNum: number, index: number, value: number) => void;
    setTable: (tabNum: number, table: ArrayBuffer) => void;
    setMessageCallback: (msgCallback: (msg: string) => void) => void;
    midiMessage: (byte1: number, byte2: number, byte3: number) => void;
    enableAudioInput: (audioInputCallback: () => void) => void;
    enableMidiInput: (midiInputCallback: () => void) => void;
    getNode: () => AudioNode;
    start: () => void;
    reset: () => void;
    destroy: () => void;
    play: () => void;
    stop: () => void;
    getPlayState: () => ICsoundStatus; 
    addPlayStateListener: (listener:(csoundObj:ICsoundObj) => void) => void;
    removePlayStateListener: (listener:(csoundObj:ICsoundObj) => void) => void;
}