import React, { useMemo } from "react";
import { configure, GlobalHotKeys, KeyMap } from "react-hotkeys";
import { useSelector } from "react-redux";
import { assoc, reduce } from "ramda";
import { IHotKeysCallbacks } from "./types";
import { keyboardCallbacks } from "./index";
import { RootState } from "@root/store";

configure({
    // logLevel: "verbose",
    defaultKeyEvent: "keydown",
    stopEventPropagationAfterHandling: true,
    stopEventPropagationAfterIgnoring: true,
    allowCombinationSubmatches: false,
    ignoreEventsCondition: () => {
        return false;
    },
    ignoreTags: []
});

// type HotKeyHandler = (keyEvent?: KeyboardEvent) => void;

type CommandKey = keyof IHotKeysCallbacks;

const HotKeys = ({
    children
}: {
    children: React.ReactElement | React.ReactElement[];
}): React.ReactElement => {
    // prevent leak into the manual iframe
    const insideIframe = !!window.frameElement;
    const bindings: KeyMap = useSelector(
        (store: RootState) => store.HotKeysReducer.bindings
    ) as KeyMap;
    const updateCounter: number = useSelector(
        (store: RootState) => store.HotKeysReducer.updateCounter
    );

    // all callbacks that aren't bound must be noop callbacks
    const safeCallbacks = useMemo(
        () =>
            reduce(
                (accumulator, k: CommandKey) =>
                    assoc(k, keyboardCallbacks.get(k), accumulator),
                {},
                [...keyboardCallbacks.keys()]
            ),
        [updateCounter]
    );
    return (
        <>
            {insideIframe ? (
                <>{children}</>
            ) : (
                <GlobalHotKeys
                    keyMap={bindings}
                    handlers={safeCallbacks}
                    allowChanges
                >
                    {children}
                </GlobalHotKeys>
            )}
        </>
    );
};

export default HotKeys;
