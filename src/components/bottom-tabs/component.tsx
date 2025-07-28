import React, { useCallback } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { isEmpty } from "ramda";
import {
    Tabs,
    DragTabList,
    DragTab,
    PanelList,
    Panel
} from "@root/tabtab/index.js";
import { arrayMoveImmutable as simpleSwitch } from "array-move";
import tabStyles, { tabListStyle } from "@comp/project-editor/tab-styles";
import Console from "@comp/console/console";
import { selectOpenBottomTabs, selectBottomTabIndex } from "./selectors";
import {
    closeBottomTab,
    reorderBottomTabs,
    setBottomTabIndex
} from "./actions";
import { BottomTab } from "./types";
import * as SS from "./styles";

const TabStyles = tabStyles(true);

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

const BottomTabs = (): React.ReactElement => {
    const dispatch = useDispatch();

    const openTabs: BottomTab[] | undefined = useSelector((store: RootState) =>
        selectOpenBottomTabs(store)
    );

    const bottomTabIndex = useSelector((store: RootState) =>
        selectBottomTabIndex(store)
    );

    const handleTabSequenceChange = useCallback(
        ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
            if (openTabs) {
                const newOrder = simpleSwitch(openTabs, oldIndex, newIndex);
                dispatch(reorderBottomTabs(newOrder, newIndex));
            }
        },
        [dispatch, openTabs]
    );

    const switchTab = useCallback(
        (newIndex: number) => dispatch(setBottomTabIndex(newIndex)),
        [dispatch]
    );

    return (
        <div css={[SS.heightFix, tabListStyle]}>
            {!isEmpty(openTabs) && bottomTabIndex > -1 && (
                <Tabs
                    defaultIndex={bottomTabIndex}
                    activeIndex={bottomTabIndex}
                    onTabChange={(newIndex: number) =>
                        dispatch(setBottomTabIndex(newIndex))
                    }
                    customStyle={TabStyles}
                    showModalButton={false}
                    showArrowButton={"auto"}
                    onTabSequenceChange={handleTabSequenceChange}
                >
                    <DragTabList
                        handleTabSequence={handleTabSequenceChange}
                        handleTabChange={switchTab}
                    >
                        {(openTabs || []).map((k, index) => (
                            <DragTab
                                id={"drag-tab-" + index}
                                key={index}
                                closable={true}
                                closeCallback={() =>
                                    dispatch(closeBottomTab(k))
                                }
                                currentIndex={bottomTabIndex}
                                thisIndex={index}
                                CustomTabStyle={TabStyles.Tab}
                                handleTabChange={switchTab}
                                index={index}
                                active={index === bottomTabIndex}
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
                            </DragTab>
                        ))}
                    </DragTabList>

                    <PanelList style={{ height: "100%", width: "100%" }}>
                        {(openTabs || []).map((k, index) => {
                            const C: any = tabsData[k]["component"];
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
        </div>
    );
};

export default BottomTabs;
