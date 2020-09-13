import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "emotion-theming";
import { concat, propEq, reduce, reject } from "ramda";
import { Tabs, DragTabList, DragTab, PanelList, Panel } from "react-tabtab";
import { simpleSwitch } from "react-tabtab/lib/helpers/move";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { IStore } from "@store/types";
import tabStyles from "@comp/ProjectEditor/tabStyles";
import {
    setConsolePanelOpen,
    setSpectralAnalyzerOpen
} from "@comp/ProjectEditor/actions";
import Console from "@comp/Console/Console";
import SpectralAnalyzer from "@comp/SpectralAnalyzer/SpectralAnalyzer";
import { closeButton as ProjectEditorCloseButtonStyle } from "@comp/ProjectEditor/styles";

const TabStyles = tabStyles(true);

const DragTabWithCloseBtn = ({
    currentIndex,
    thisIndex,
    closeCallback,
    children
}) => {
    const theme: any = useTheme();

    return (
        <>
            {children}
            <Tooltip title={"close"} placement="right-end">
                <IconButton
                    size="small"
                    css={ProjectEditorCloseButtonStyle}
                    onClick={e => {
                        closeCallback();
                        e.stopPropagation();
                    }}
                >
                    <FontAwesomeIcon
                        icon={faTimes}
                        size="sm"
                        color={
                            currentIndex === thisIndex
                                ? theme.textColor
                                : theme.unfocusedTextColor
                        }
                    />
                </IconButton>
            </Tooltip>
        </>
    );
};

const tabsData = {
    console: {
        title: "Console",
        closeAction: setConsolePanelOpen,
        component: Console
    },
    spectralAnalyzer: {
        title: "Spectral Analyzer",
        closeAction: setSpectralAnalyzerOpen,
        component: SpectralAnalyzer
    }
};

const BottomTabs = () => {
    const [bottomTabIndex, setBottomTabIndex] = useState(0);
    const [renderedTabs, setRenderedTabs] = useState(["console"]);
    const dispatch = useDispatch();

    const isConsoleVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.consoleVisible
    );

    const isSpectralAnalyzerVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.spectralAnalyzerVisible
    );

    useEffect(() => {
        if (isConsoleVisible && !renderedTabs.includes("console")) {
            setRenderedTabs(concat(renderedTabs, ["console"]));
        }
        if (!isConsoleVisible && renderedTabs.includes("console")) {
            setRenderedTabs(reject(propEq("console"), renderedTabs));
        }

        if (
            isSpectralAnalyzerVisible &&
            !renderedTabs.includes("spectralAnalyzer")
        ) {
            const updatedRenderedTabs = concat(renderedTabs, [
                "spectralAnalyzer"
            ]);
            setRenderedTabs(updatedRenderedTabs);
            setBottomTabIndex(updatedRenderedTabs.length - 1);
        }

        if (
            !isSpectralAnalyzerVisible &&
            renderedTabs.includes("spectralAnalyzer")
        ) {
            setRenderedTabs(reject(propEq("spectralAnalyzer"), renderedTabs));
        }
    }, [isConsoleVisible, isSpectralAnalyzerVisible, renderedTabs]);

    const bottomTabCount: number = reduce(
        (a: number, b: boolean) => (b ? a + 1 : a),
        0,
        [isConsoleVisible, isSpectralAnalyzerVisible]
    );

    const showTabs: boolean = bottomTabCount > 0;

    return (
        <>
            {showTabs && (
                <Tabs
                    activeIndex={Math.min(bottomTabIndex, bottomTabCount)}
                    onTabChange={setBottomTabIndex}
                    customStyle={TabStyles}
                    showModalButton={false}
                    showArrowButton={"auto"}
                    onTabSequenceChange={({ oldIndex, newIndex }) => {
                        setRenderedTabs(
                            simpleSwitch(renderedTabs, oldIndex, newIndex)
                        );
                    }}
                >
                    <DragTabList id="drag-tab-list">
                        {renderedTabs.map((k, i) => (
                            <DragTab key={i} closable={true}>
                                <DragTabWithCloseBtn
                                    closeCallback={() =>
                                        dispatch(
                                            tabsData[k]["closeAction"](false)
                                        )
                                    }
                                    currentIndex={bottomTabIndex}
                                    thisIndex={i}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            overflow: "hidden",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {tabsData[k]["title"]}
                                    </p>
                                </DragTabWithCloseBtn>
                            </DragTab>
                        ))}
                    </DragTabList>

                    <PanelList>
                        {renderedTabs.map((k, i) => {
                            const C = tabsData[k]["component"];
                            return (
                                <Panel key={1} isBottom>
                                    <C />
                                </Panel>
                            );
                        })}
                    </PanelList>
                </Tabs>
            )}
        </>
    );
};

export default BottomTabs;
