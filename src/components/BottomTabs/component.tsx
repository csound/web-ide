import React, { useState } from "react";
import { useSelector } from "react-redux";
import { reduce } from "ramda";
import { Tabs, DragTabList, DragTab, PanelList, Panel } from "react-tabtab";
import { simpleSwitch } from "react-tabtab/lib/helpers/move";
import { IStore } from "@store/types";
import tabStyles from "@comp/ProjectEditor/tabStyles";
import Console from "@comp/Console/Console";
import SpectralAnalyzer from "@comp/SpectralAnalyzer/SpectralAnalyzer";

const TabStyles = tabStyles(true);

const BottomTabs = () => {
    const [bottomTabIndex, setBottomTabIndex] = useState(0);

    const isConsoleVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.consoleVisible
    );

    const isSpectralAnalyzerVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.spectralAnalyzerVisible
    );

    const bottomTabCount: number = reduce(
        (a: number, b: boolean) => (b ? a + 1 : a),
        0,
        [isConsoleVisible, isSpectralAnalyzerVisible]
    );

    const showTabs: boolean = bottomTabCount > 0;

    const bottomTabList: Array<JSX.Element> = [];

    if (isConsoleVisible) {
        bottomTabList.push(
            <DragTab closable={true} key={0}>
                Console
            </DragTab>
        );
    }

    if (isSpectralAnalyzerVisible) {
        bottomTabList.push(
            <DragTab closable={true} key={1}>
                Spectral Analyzer
            </DragTab>
        );
    }

    const bottomTabPanels: Array<JSX.Element> = [];

    if (isConsoleVisible) {
        bottomTabPanels.push(
            <Panel key={0} isBottom>
                <Console />
            </Panel>
        );
    }

    if (isSpectralAnalyzerVisible) {
        bottomTabPanels.push(
            <Panel key={1} isBottom>
                <SpectralAnalyzer />
            </Panel>
        );
    }

    return (
        <>
            {showTabs && (
                <Tabs
                    activeIndex={Math.min(bottomTabIndex, bottomTabCount)}
                    onTabChange={i => setBottomTabIndex(i)}
                    customStyle={TabStyles}
                    showModalButton={false}
                    showArrowButton={"auto"}
                    onTabSequenceChange={({ oldIndex, newIndex }) => {
                        simpleSwitch(bottomTabPanels, oldIndex, newIndex);
                    }}
                >
                    <DragTabList id="drag-tab-list">
                        {bottomTabList}
                    </DragTabList>
                    <PanelList>{bottomTabPanels}</PanelList>
                </Tabs>
            )}
        </>
    );
};

export default BottomTabs;
