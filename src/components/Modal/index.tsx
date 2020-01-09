import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import * as SS from "./styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { IStore } from "@store/types";

function getModalStyle(width, height) {
    if (!width || !height) return {};
    const topOffset = window.innerHeight / 2 - height / 2;
    const leftOffset = window.innerWidth / 2 - width / 2;

    return {
        top: `${topOffset}px`,
        left: `${leftOffset}px`
    };
}

export default function GlobalModal() {
    const modalRef = useRef(null);
    const [[width, height], setDimensions] = useState([0, 0]);
    const isOpen: boolean = useSelector(
        (store: IStore) => store.ModalReducer.isOpen
    );

    const ModalComponent = useSelector(
        (store: IStore) => store.ModalReducer.component
    );
    const onClose = useSelector((store: IStore) => store.ModalReducer.onClose);

    const updateDimensions = (focus: boolean) => {
        const elem = document.getElementById("modal-window");
        if (elem) {
            setDimensions([elem.clientWidth, elem.clientHeight]);
            if (focus) {
                const maybeInput = elem.getElementsByTagName("input");
                if (maybeInput && maybeInput.length > 0) {
                    setTimeout(() => maybeInput[0].focus(), 1);
                }
            }
        }
    };

    useEffect(() => {
        isOpen && setTimeout(() => updateDimensions(true), 0);
        const timer = setInterval(() => {
            if (isOpen) {
                updateDimensions(false);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    return (
        <Modal
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500
            }}
            open={isOpen}
            onClose={onClose}
        >
            <Fade in={isOpen}>
                <div
                    id="modal-window"
                    css={SS.content}
                    ref={modalRef}
                    style={getModalStyle(width, height)}
                >
                    {ModalComponent && <ModalComponent />}
                </div>
            </Fade>
        </Modal>
    );
}
