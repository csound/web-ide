import React from "react";
import clsx from "clsx";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import CloseIcon from "@material-ui/icons/Close";
import { amber, green } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import WarningIcon from "@material-ui/icons/Warning";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { closeSnackbar } from "./actions";
import { useSelector, useDispatch } from "react-redux";
import {
    selectSnackbarType,
    selectSnackbarOpen,
    selectSnackbarText,
    selectSnackbarTimeout
} from "./selectors";
import { SnackbarType } from "./types";

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon
};

const styles = makeStyles((theme: Theme) => ({
    success: {
        backgroundColor: green[600]
    },
    error: {
        backgroundColor: theme.palette.error.dark
    },
    info: {
        backgroundColor: theme.palette.primary.main
    },
    warning: {
        backgroundColor: amber[700]
    },
    icon: {
        fontSize: 20
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing(1)
    },
    message: {
        display: "flex",
        alignItems: "center"
    }
}));

export interface Props {
    className?: string;
    message?: string;
    onClose?: () => void;
    variant: SnackbarType;
}

const SnackbarContentWrapper = (properties: Props) => {
    const classes = styles();
    const { className, message, onClose, variant, ...rest } = properties;

    let Icon;
    let cssClass;

    switch (variant) {
        case SnackbarType.Info:
            Icon = variantIcon["info"];
            cssClass = classes["info"];
            break;
        case SnackbarType.Warning:
            Icon = variantIcon["warning"];
            cssClass = classes["warning"];
            break;
        case SnackbarType.Success:
            Icon = variantIcon["success"];
            cssClass = classes["success"];
            break;
        case SnackbarType.Error:
            Icon = variantIcon["error"];
            cssClass = classes["error"];
            break;
        default:
            Icon = variantIcon["error"];
            cssClass = classes["error"];

            break;
    }

    return (
        <SnackbarContent
            className={clsx(cssClass, className)}
            aria-describedby="client-snackbar"
            message={
                <span id="client-snackbar" className={classes.message}>
                    <Icon className={clsx(classes.icon, classes.iconVariant)} />
                    {message}
                </span>
            }
            action={[
                <IconButton
                    key="close"
                    aria-label="close"
                    color="inherit"
                    onClick={onClose}
                >
                    <CloseIcon className={classes.icon} />
                </IconButton>
            ]}
            {...rest}
        />
    );
};

const CustomSnackbar = (properties) => {
    const type = useSelector(selectSnackbarType);
    const text = useSelector(selectSnackbarText);
    const open = useSelector(selectSnackbarOpen);
    const timeout = useSelector(selectSnackbarTimeout);
    const dispatch = useDispatch();

    const handleClose = () => {
        dispatch(closeSnackbar());
    };

    return (
        <Snackbar
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left"
            }}
            open={open}
            autoHideDuration={timeout}
            onClose={handleClose}
        >
            <SnackbarContentWrapper
                onClose={handleClose}
                variant={type}
                message={text}
            />
        </Snackbar>
    );
};

export default CustomSnackbar;
