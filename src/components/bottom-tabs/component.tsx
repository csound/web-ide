import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { isEmpty } from "ramda";
import {
    Tabs,
    DragTabList,
    DragTab,
    PanelList,
    Panel
} from "@hlolli/react-tabtab";
import simpleSwitch from "array-move";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { IStore } from "@store/types";
import tabStyles from "@comp/project-editor/tab-styles";
import Console from "@comp/console/console";
import { closeButton as ProjectEditorCloseButtonStyle } from "@comp/project-editor/styles";
import { selectOpenBottomTabs, selectBottomTabIndex } from "./selectors";
import {
    closeBottomTab,
    reorderBottomTabs,
    setBottomTabIndex
} from "./actions";
import { BottomTab } from "./types";

const TabStyles = tabStyles(true);

const DragTabWithCloseButton = ({
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
                    onClick={(event) => {
                        closeCallback();
                        event.stopPropagation();
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
        component: Console
    },
    spectralAnalyzer: {
        title: "Spectral Analyzer",
        component: React.lazy(
            () => import("@comp/spectral-analyzer/spectral-analyzer")
        )
    },
    piano: {
        title: "Virtual Midi Keyboard",
        component: React.lazy(() => import("@elem/midi-piano"))
    }
};

const BottomTabs = () => {
    const dispatch = useDispatch();

    const openTabs: BottomTab[] | undefined = useSelector((store: IStore) =>
        selectOpenBottomTabs(store)
    );

    const bottomTabIndex = useSelector((store: IStore) =>
        selectBottomTabIndex(store)
    );

    const handleTabSequenceChange = useCallback(
        (oldIndex: number, newIndex: number) => {
            if (openTabs) {
                const newOrder = simpleSwitch(openTabs, oldIndex, newIndex);
                dispatch(reorderBottomTabs(newOrder, newIndex));
            }
        },
        [dispatch, openTabs]
    );

    return (
        <>
            {!isEmpty(openTabs) && bottomTabIndex > -1 && (
                <Tabs
                    activeIndex={bottomTabIndex}
                    onTabChange={(newIndex: number) =>
                        dispatch(setBottomTabIndex(newIndex))
                    }
                    customStyle={TabStyles}
                    showModalButton={false}
                    showArrowButton={"auto"}
                    onTabSequenceChange={handleTabSequenceChange}
                >
                    <DragTabList id="drag-tab-list">
                        {(openTabs || []).map((k, index) => (
                            <DragTab key={index} closable={true}>
                                <DragTabWithCloseButton
                                    closeCallback={() =>
                                        dispatch(closeBottomTab(k))
                                    }
                                    currentIndex={bottomTabIndex}
                                    thisIndex={index}
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
                                </DragTabWithCloseButton>
                            </DragTab>
                        ))}
                    </DragTabList>

                    <PanelList>
                        {(openTabs || []).map((k, index) => {
                            const C = tabsData[k]["component"];
                            return (
                                <Panel key={index} isBottom>
                                    <React.Suspense fallback={<></>}>
                                        <C />
                                    </React.Suspense>
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
