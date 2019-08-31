import React from "react";
import { useSelector } from "react-redux";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { IStore } from "../../db/interfaces";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        modal: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        paper: {
            backgroundColor: theme.palette.background.paper,
            border: '2px solid #000',
            boxShadow: theme.shadows[5],
            padding: theme.spacing(2, 4, 3),
        },
    }),
);

export default function GlobalModal() {

    const classes = useStyles();

    const isOpen: boolean = useSelector((store: IStore) => store.ModalReducer.isOpen);

    const ModalComponent = useSelector((store: IStore) => store.ModalReducer.component);
    const onClose = useSelector((store: IStore) => store.ModalReducer.onClose);

    return (
        <Modal closeAfterTransition
               BackdropComponent={Backdrop}
               BackdropProps={{
                   timeout: 500,
               }}
               className={classes.modal}
               open={isOpen}
               onClose={onClose}
        >
            <Fade in={isOpen}>
                <div className={classes.paper}>
                    <ModalComponent />
                </div>
            </Fade>
        </Modal>
    );
}
