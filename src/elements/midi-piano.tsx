import React from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import { ICsoundStatus } from "@comp/csound/types";
import { useSelector } from "react-redux";
import { pathOr } from "ramda";
import { csoundInstance } from "@comp/csound/actions";
import "react-piano/dist/styles.css";

const MidiPiano = (): React.ReactElement => {
    const firstNote = MidiNumbers.fromNote("c3");
    const lastNote = MidiNumbers.fromNote("f5");
    const csound = csoundInstance;

    const csoundStatus: ICsoundStatus = useSelector(
        pathOr("stopped", ["csound", "status"])
    ) as ICsoundStatus;

    console.log("csoundStatus", csoundStatus);

    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW
    });

    return (
        <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber: number) => {
                // TODO make velocity configureable
                if (csound && csoundStatus === "playing") {
                    csound.midiMessage(144, midiNumber, 64);
                }
            }}
            stopNote={(midiNumber: number) => {
                if (csound && csoundStatus === "playing") {
                    csound.midiMessage(128, midiNumber, 64);
                }
            }}
            width={1000}
            keyboardShortcuts={keyboardShortcuts}
        />
    );
};

export default MidiPiano;
