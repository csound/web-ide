import React from "react";

export default function Tabs({
    defaultIndex,
    activeIndex: nextActiveIndex,
    onTabChange,
    onTabSequenceChange,
    children,
    ...extraProps
}) {
    const getActiveIndex = React.useCallback(() => {
        if (nextActiveIndex != null) {
            return nextActiveIndex;
        }
        if (defaultIndex != null) {
            return defaultIndex;
        }
        return 0;
    }, [nextActiveIndex, defaultIndex]);

    const [activeIndex, setActiveIndex] = React.useState(getActiveIndex());

    const handleTabChange = React.useCallback(
        (index) => {
            setActiveIndex(index);
            if (onTabChange) {
                onTabChange(index);
            }
        },
        [onTabChange, setActiveIndex]
    );

    const handleTabSequence = React.useCallback(
        ({ oldIndex, newIndex }) => {
            if (onTabSequenceChange) {
                onTabSequenceChange({ oldIndex, newIndex });
            }
        },
        [onTabSequenceChange]
    );

    // const handleEdit = React.useCallback(
    //     ({ type, index }) => {
    //         if (onTabEdit) {
    //             onTabEdit({ type, index });
    //         }
    //     },
    //     [onTabEdit]
    // );

    React.useEffect(() => {
        if (nextActiveIndex !== activeIndex) {
            setActiveIndex(nextActiveIndex);
        }
    }, [nextActiveIndex, activeIndex]);

    const nextProps = {
        handleTabChange,
        handleTabSequence,
        activeIndex,
        ...extraProps
    };

    return (
        <div>
            {React.Children.map(children, (child) => {
                return React.cloneElement(child, nextProps);
            })}
        </div>
    );
}
