/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import { amber, green } from "@mui/material/colors";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import WarningIcon from "@mui/icons-material/Warning";
import { Theme, useTheme } from "@emotion/react";
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

// const styles = (theme: Theme) => ({
//     success: {
//         backgroundColor: green[600],
//         color: theme.palette.common.white
//     },
//     error: {
//         backgroundColor: theme.palette.error.dark,
//         color: theme.palette.common.white
//     },
//     info: {
//         backgroundColor: theme.palette.primary.main,
//         color: theme.palette.common.white
//     },
//     warning: {
//         backgroundColor: amber[700],
//         color: theme.palette.common.white
//     },
//     icon: {
//         fontSize: 20
//     },
//     iconVariant: {
//         opacity: 0.9,
//         marginRight: theme.spacing(1)
//     },
//     message: {
//         display: "flex",
//         alignItems: "center",
//         color: theme.palette.common.black
//     }
// });

export interface IProperties {
    className?: string;
    message?: string;
    onClose?: () => void;
    variant: SnackbarType;
}

const SnackbarContentWrapper = (properties: IProperties) => {
    const theme = useTheme();
    const { className, message, onClose, variant, ...rest } = properties;

    let Icon;
    let cssClass;

    // switch (variant) {
    //     case SnackbarType.Info: {
    //         Icon = variantIcon["info"];
    //         cssClass = classes["info"];
    //         break;
    //     }
    //     case SnackbarType.Warning: {
    //         Icon = variantIcon["warning"];
    //         cssClass = classes["warning"];
    //         break;
    //     }
    //     case SnackbarType.Success: {
    //         Icon = variantIcon["success"];
    //         cssClass = classes["success"];
    //         break;
    //     }
    //     case SnackbarType.Error: {
    //         Icon = variantIcon["error"];
    //         cssClass = classes["error"];
    //         break;
    //     }
    //     default: {
    //         Icon = variantIcon["error"];
    //         cssClass = classes["error"];

    //         break;
    //     }
    // }

    return (
        <SnackbarContent
            aria-describedby="client-snackbar"
            message={
                <span id="client-snackbar">
                    <Icon />
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
                    <CloseIcon />
                </IconButton>
            ]}
            {...rest}
        />
    );
};

const CustomSnackbar = (): React.ReactElement => {
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
            message={text}
            onClose={handleClose}
        />
    );
};

export default CustomSnackbar;
