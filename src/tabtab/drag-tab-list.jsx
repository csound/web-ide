import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    horizontalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TabList from "./tab-list.jsx";

const DragTab = ({ id, children, ...props }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...props.style // Allow custom styles to be passed
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            {...props}
        >
            {children}
        </div>
    );
};

const DragTabList = ({ children, items, ...props }) => {
    const [orderedItems, setOrderedItems] = React.useState(items);
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));

            if (props.handleTabSequence) {
                props.handleTabSequence(arrayMove(items, oldIndex, newIndex));
            }
        }

        if (props.handleTabChange) {
            props.handleTabChange(over.id);
        }
    };

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={horizontalListSortingStrategy}
            >
                <TabList {...props}>
                    {items.map((item, index) => (
                        <DragTab key={index} id={item.id}>
                            {item.content}
                        </DragTab>
                    ))}
                </TabList>
            </SortableContext>
        </DndContext>
    );
};

export default DragTabList;
DragTabList.displayName = "DragTabList";
