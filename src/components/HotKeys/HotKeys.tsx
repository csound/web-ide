import React from "react";
import { GlobalHotKeys, configure } from "react-hotkeys";
import { selectKeyHandlers, selectKeyMaps } from "./selectors";
import { useSelector } from "react-redux";

configure({
    ignoreEventsCondition: event => {
        return false;
    },
    ignoreTags: []
});

const HotKeys = props => {
    const keyHandlers = useSelector(selectKeyHandlers);
    const keyMaps = useSelector(selectKeyMaps);

    return (
        <GlobalHotKeys allowChanges keyMap={keyMaps} handlers={keyHandlers}>
            {props.children}
        </GlobalHotKeys>
    );
};

export default HotKeys;
