import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove
} from "@dnd-kit/sortable";

const DragTabList = ({
    children,
    handleTabSequence,
    handleTabChange,
    activeIndex = 0, // Extract to prevent passing to DOM
    showModalButton = false, // Extract to prevent passing to DOM
    showArrowButton = false, // Extract to prevent passing to DOM
    customStyle = {}, // Extract to prevent passing to DOM
    ...props
}) => {
    const childrenArray = React.Children.toArray(children);
    const initialItems = childrenArray.map((child, index) => ({
        id: child.props.id || `tab-${index}`,
        child
    }));

    const [items, setItems] = React.useState(initialItems);

    // Update items when children change
    React.useEffect(() => {
        const newItems = childrenArray.map((child, index) => ({
            id: child.props.id || `tab-${index}`,
            child
        }));
        setItems(newItems);
    }, [children]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            // Update local state for immediate visual feedback
            setItems((items) => arrayMove(items, oldIndex, newIndex));

            if (handleTabSequence) {
                handleTabSequence({ oldIndex, newIndex });
            }
        }

        if (handleTabChange && over) {
            const newIndex = items.findIndex((item) => item.id === over.id);
            handleTabChange(newIndex);
        }
    };

    return (
        <div role="tablist" {...props}>
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    {children}
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default DragTabList;
DragTabList.displayName = "DragTabList";
