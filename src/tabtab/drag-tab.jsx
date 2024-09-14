import React from "react";
import { SortableElement } from "react-sortable-hoc";
import { Tab } from "./tab.jsx";

const DragTabElementWithRef = React.forwardRef(
    ({ children, ...props }, ref) => {
        return (
            <Tab index={props.tabIndex} {...props} ref={ref}>
                {children}
            </Tab>
        );
    }
);
DragTabElementWithRef.displayName = "DragTabElementWithRef";

const DragTabElement = SortableElement(DragTabElementWithRef, {
    withRef: true
});

DragTabElement.displayName = "DragTabElement";

export function DragTab({ children, closeCallback, ...props }) {
    const dragTabRef = React.useRef();
    return (
        <DragTabElement
            ref={dragTabRef}
            closeCallback={closeCallback}
            {...props}
        >
            {children}
        </DragTabElement>
    );
}

DragTab.displayName = "DragTab";
