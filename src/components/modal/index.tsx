import React, { RefObject, useEffect, useState, useRef } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { TargetControlsConfigDialog } from "@comp/target-controls/config-dialog";
import ShareDialog from "@comp/share-dialog";
import { KeyboardShortcuts } from "@comp/site-documents/keyboard-shortcuts";
import {
    AddDocumentPrompt,
    DeleteDocumentPrompt,
    NewDocumentPrompt,
    NewFolderPrompt
} from "@comp/projects/modals";
import { CloseUnsavedFilePrompt } from "@comp/project-editor/modals";
import { ProjectModal } from "@comp/profile/project-modal";
import { ProfileModal } from "@comp/profile/profile-modal";
import { DeleteProjectModal } from "@comp/profile/delete-project-modal";
import { ProfileFinalize } from "@comp/login/actions";
import { always } from "ramda";
import * as SS from "./styles";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import { closeModal } from "./actions";

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

export default function GlobalModal(): React.ReactElement {
    const modalReference: RefObject<HTMLDivElement | null> = useRef(null);
    const [[width, height], setDimensions] = useState([0, 0]);
    const dispatch = useDispatch();
    const isOpen: boolean = useSelector(
        (store: RootState) => store.ModalReducer.isOpen
    );

    const modalComponentName = useSelector(
        (store: RootState) => store.ModalReducer.modalComponentName
    );

    const modalProperties =
        useSelector((store: RootState) => store.ModalReducer.properties) || {};

    const onClose = () => dispatch(closeModal());

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
                    modalReference.current as unknown as Element
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
            open={isOpen}
            onClose={
                [
                    "profile-edit-dialog",
                    "add-document-prompt",
                    "new-folder-prompt"
                ].includes(modalComponentName)
                    ? onClose
                    : modalProperties.disableOnClose
                      ? always
                      : modalProperties.onClose || onClose
            }
            style={{ zIndex: 3 }}
        >
            <Fade in={isOpen}>
                <div
                    id="modal-window"
                    css={SS.content}
                    ref={modalReference}
                    style={getModalStyle(width, height)}
                >
                    {modalComponentName === "target-controls" && (
                        <TargetControlsConfigDialog {...modalProperties} />
                    )}
                    {modalComponentName === "share-dialog" && (
                        <ShareDialog {...modalProperties} />
                    )}
                    {modalComponentName === "keyboard-shortcuts" && (
                        <KeyboardShortcuts {...modalProperties} />
                    )}
                    {modalComponentName === "new-document-prompt" && (
                        <NewDocumentPrompt {...modalProperties} />
                    )}
                    {modalComponentName === "delete-document-prompt" && (
                        <DeleteDocumentPrompt {...modalProperties} />
                    )}
                    {modalComponentName === "add-document-prompt" && (
                        <AddDocumentPrompt {...modalProperties} />
                    )}
                    {modalComponentName === "new-folder-prompt" && (
                        <NewFolderPrompt {...modalProperties} />
                    )}
                    {modalComponentName === "close-unsaved-prompt" && (
                        <CloseUnsavedFilePrompt {...modalProperties} />
                    )}
                    {modalComponentName === "new-project-prompt" && (
                        <ProjectModal {...modalProperties} />
                    )}
                    {modalComponentName === "profile-edit-dialog" && (
                        <ProfileModal {...modalProperties} />
                    )}
                    {modalComponentName === "delete-project-prompt" && (
                        <DeleteProjectModal {...modalProperties} />
                    )}
                    {modalComponentName === "project-finalize" && (
                        <ProfileFinalize {...modalProperties} />
                    )}
                </div>
            </Fade>
        </Modal>
    );
}
