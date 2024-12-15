import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tab } from "./tab.jsx";

export function DragTab({ children, closeCallback, id, ...props }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...props.style // Allow custom styles to be passed
    };

    return (
        <Tab
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            closeCallback={closeCallback}
            {...props}
        >
            {children}
        </Tab>
    );
}
