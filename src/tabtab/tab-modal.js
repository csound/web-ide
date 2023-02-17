import React from "react";
import Poppop from "react-poppop";
import { SortableContainer } from "react-sortable-hoc";
import { useSort } from "./sort-method.js";

const DragTabContainer = SortableContainer(({ children }) => {
    return <div style={{ marginTop: "50px" }}>{children}</div>;
});

const ModalTabListWrapper = (props) => {
    const { onSortEnd } = useSort({
        activeIndex: props.activeIndex,
        handleTabChange: props.handleTabChange,
        handleTabSequence: props.handleTabSequence
    });

    return (
        <DragTabContainer
            onSortEnd={onSortEnd}
            axis="y"
            lockAxis="y"
            // if no pressDelay, close button cannot be triggered,
            // because it would always treat click as dnd action
            pressDelay="100"
        >
            {props.children}
        </DragTabContainer>
    );
};

export default function TabModal(props) {
    return (
        <Poppop
            open={true}
            onClose={props.closeModal}
            closeOnEsc={true}
            closeBtn={true}
        >
            <ModalTabListWrapper
                handleTabSequence={props.handleTabSequence}
                handleTabChange={props.handleTabChange}
                activeIndex={props.activeIndex}
            >
                {this.props.children}
            </ModalTabListWrapper>
        </Poppop>
    );
}
