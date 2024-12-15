import React from "react";
import Poppop from "react-poppop";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DragTab = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: "8px"
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

const ModalTabListWrapper = ({
    items,
    setItems,
    handleTabChange,
    handleTabSequence,
    children
}) => {
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            if (handleTabSequence) {
                handleTabSequence(newItems);
            }
        }

        if (handleTabChange && over) {
            handleTabChange(over.id);
        }
    };

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
            >
                <div style={{ marginTop: "50px" }}>{children}</div>
            </SortableContext>
        </DndContext>
    );
};

export default function TabModal({
    closeModal,
    items,
    setItems,
    handleTabSequence,
    handleTabChange
}) {
    return (
        <Poppop
            open={true}
            onClose={closeModal}
            closeOnEsc={true}
            closeBtn={true}
        >
            <ModalTabListWrapper
                items={items}
                setItems={setItems}
                handleTabSequence={handleTabSequence}
                handleTabChange={handleTabChange}
            >
                {items.map((item) => (
                    <DragTab key={item.id} id={item.id}>
                        {item.content}
                    </DragTab>
                ))}
            </ModalTabListWrapper>
        </Poppop>
    );
}
