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
    ignoreEventsCondition: event => {
        return false;
    },
    ignoreTags: []
});

type HotKeyHandler = (keyEvent?: KeyboardEvent) => void;

type ReadyCallbacks = {
    [key in keyof IHotKeysCallbacks]?: (...args: any[]) => any;
};

type CommandKey = keyof IHotKeysCallbacks;

const HotKeys = props => {
    // prevent leak into the manual iframe
    const insideIframe = !!window.frameElement;
    const callbacks = useSelector(selectKeyCallbacks);
    const bindings: KeyMap = useSelector(selectKeyBindings) as KeyMap;
    // all callbacks that aren't bound must be noop callbacks
    const safeCallbacks = reduce(
        (acc, k: CommandKey) =>
            assoc(
                k,
                isNil(callbacks ? prop(k, callbacks) : null)
                    ? (((e: any) => {
                          e && e.preventDefault();
                      }) as HotKeyHandler)
                    : callbacks && prop(k, callbacks),
                acc
            ),
        {},
        keys(callbacks || {})
    );
    if (insideIframe) {
        return <>{props.children}</>;
    } else {
        return (
            <GlobalHotKeys
                keyMap={bindings}
                handlers={safeCallbacks}
                allowChanges
            >
                {props.children}
            </GlobalHotKeys>
        );
    }
};

export default HotKeys;
