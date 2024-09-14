import React from "react";
import { useSort } from "./sort-method.js";
import { SortableContainer } from "react-sortable-hoc";
import TabList from "./tab-list.jsx";

const DragTabContainer = SortableContainer(({ children, ...props }) => {
    return <TabList {...props}>{children}</TabList>;
});

export default function DragTabList({ children, ...props }) {
    const { onSortEnd } = useSort({
        activeIndex: props.activeIndex,
        handleTabChange: props.handleTabChange,
        handleTabSequence: props.handleTabSequence
    });

    return (
        <DragTabContainer
            onSortEnd={onSortEnd}
            axis="x"
            lockAxis="x"
            pressDelay={10}
            shouldCancelStart={(e) => {
                // console.log({ e });
                return ["svg", "path"].includes(e.target.nodeName);
            }}
            {...props}
        >
            {children}
        </DragTabContainer>
    );
}

DragTabList.displayName = "DragTabList";
