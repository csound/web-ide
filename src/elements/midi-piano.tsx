import React, { useEffect, useMemo, useState } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import { ICsoundStatus } from "@comp/csound/types";
import { useSelector } from "react-redux";
import { pathOr } from "ramda";
import { csoundInstance } from "@comp/csound/actions";
import "react-piano/dist/styles.css";

const MIN_OCTAVE_OFFSET = -2;
const MAX_OCTAVE_OFFSET = 2;
const SEMITONES_PER_OCTAVE = 12;

const clampOctaveOffset = (offset: number): number =>
    Math.min(MAX_OCTAVE_OFFSET, Math.max(MIN_OCTAVE_OFFSET, offset));

const isEditableEventTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName.toLowerCase();
    return (
        target.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
    );
};

const MidiPiano = (): React.ReactElement => {
    const [octaveOffset, setOctaveOffset] = useState<number>(0);

    const baseFirstNote = MidiNumbers.fromNote("c3");
    const baseLastNote = MidiNumbers.fromNote("f5");
    const firstNote = baseFirstNote + octaveOffset * SEMITONES_PER_OCTAVE;
    const lastNote = baseLastNote + octaveOffset * SEMITONES_PER_OCTAVE;
    const csound = csoundInstance;

    const csoundStatus: ICsoundStatus = useSelector(
        pathOr("stopped", ["csound", "status"])
    ) as ICsoundStatus;

    const keyboardShortcuts = useMemo(
        () =>
            KeyboardShortcuts.create({
                firstNote,
                lastNote,
                keyboardConfig: KeyboardShortcuts.HOME_ROW
            }),
        [firstNote, lastNote]
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.repeat || isEditableEventTarget(event.target)) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === "z") {
                event.preventDefault();
                setOctaveOffset((currentOffset) =>
                    clampOctaveOffset(currentOffset - 1)
                );
                return;
            }

            if (key === "x") {
                event.preventDefault();
                setOctaveOffset((currentOffset) =>
                    clampOctaveOffset(currentOffset + 1)
                );
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    const displayBaseOctave = 3 + octaveOffset;
    const displayOffset =
        octaveOffset > 0 ? `+${octaveOffset}` : `${octaveOffset}`;

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                    fontSize: 12,
                    opacity: 0.85
                }}
            >
                <span>Octave: Z down, X up</span>
                <span>
                    Current: C{displayBaseOctave} to F{displayBaseOctave + 2} (
                    {displayOffset})
                </span>
            </div>
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
        </div>
    );
};

export default MidiPiano;
