import React, { RefObject, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import * as SS from "./styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { IStore } from "@store/types";
import ResizeObserver from "resize-observer-polyfill";

function getModalStyle(width, height) {
    if (!width || !height) {
        return {};
    }
    const topOffset = window.innerHeight / 2 - height / 2;
    const leftOffset = window.innerWidth / 2 - width / 2;

    return {
        top: `${topOffset}px`,
        left: `${leftOffset}px`
    };
}

export default function GlobalModal() {
    const modalReference = useRef() as RefObject<HTMLDivElement>;
    const [[width, height], setDimensions] = useState([0, 0]);
    const isOpen: boolean = useSelector(
        (store: IStore) => store.ModalReducer.isOpen
    );

    const ModalComponent = useSelector(
        (store: IStore) => store.ModalReducer.component
    );
    const onClose = useSelector((store: IStore) => store.ModalReducer.onClose);

    const updateDimensions = (focus: boolean) => {
        const element = document.querySelector("#modal-window");
        if (element) {
            setDimensions([element.clientWidth, element.clientHeight]);
            if (focus) {
                const maybeInput = element.querySelectorAll("input");
                if (maybeInput && maybeInput.length > 0) {
                    setTimeout(() => maybeInput[0] && maybeInput[0].focus(), 1);
                }
            }
        }
    };

    useEffect(() => {
        isOpen && setTimeout(() => updateDimensions(true), 0);
        function handleResize() {
            if (isOpen) {
                updateDimensions(false);
            }
        }
        const resizeObserver = new ResizeObserver(handleResize);
        let copiedReference;
        setTimeout(() => {
            if (modalReference.current) {
                resizeObserver.observe(
                    (modalReference.current as unknown) as Element
                );
                copiedReference = modalReference.current;
            }
        }, 100);
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            copiedReference && resizeObserver.unobserve(copiedReference);
        };
    }, [modalReference, isOpen]);

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
                    ref={modalReference}
                    style={getModalStyle(width, height)}
                >
                    {ModalComponent && <ModalComponent />}
                </div>
            </Fade>
        </Modal>
    );
}
