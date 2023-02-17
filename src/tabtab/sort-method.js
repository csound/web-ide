import React from "react";

export const useSort = ({
    activeIndex,
    handleTabChange,
    handleTabSequence
}) => {
    const onSortEnd = React.useCallback(
        ({ oldIndex, newIndex }) => {
            if (oldIndex === newIndex) {
                if (activeIndex !== oldIndex) {
                    handleTabChange(oldIndex);
                }
            } else {
                handleTabSequence({ oldIndex, newIndex });
            }
        },
        [activeIndex, handleTabChange, handleTabSequence]
    );

    return { onSortEnd };
};
