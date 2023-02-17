import React from "react";
import { configure, GlobalHotKeys, KeyMap } from "react-hotkeys";
import { selectKeyCallbacks, selectKeyBindings } from "./selectors";
import { useSelector } from "react-redux";
import { assoc, isNil, keys, prop, reduce } from "ramda";
import { IHotKeysCallbacks } from "./types";

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

type HotKeyHandler = (keyEvent?: KeyboardEvent) => void;

type CommandKey = keyof IHotKeysCallbacks;

const HotKeys = ({
    children
}: {
    children: React.ReactElement;
}): React.ReactElement => {
    // prevent leak into the manual iframe
    const insideIframe = !!window.frameElement;
    const callbacks = useSelector(selectKeyCallbacks);
    const bindings: KeyMap = useSelector(selectKeyBindings) as KeyMap;
    // all callbacks that aren't bound must be noop callbacks
    const safeCallbacks = reduce(
        (accumulator, k: CommandKey) =>
            assoc(
                k,
                isNil(callbacks && prop(k, callbacks))
                    ? (((event: any) => {
                          event && event.preventDefault();
                      }) as HotKeyHandler)
                    : callbacks && prop(k, callbacks),
                accumulator
            ),
        {},
        keys(callbacks || {})
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
