import React, { useState, useRef, useEffect, useCallback } from "react";
import Input from "@mui/material/Input";
import FilledInput from "@mui/material/FilledInput/FilledInput";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import blue from "@mui/material/colors/blue";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import { css } from "@emotion/react";

const variantComponent = {
    standard: Input,
    filled: FilledInput,
    outlined: OutlinedInput
};

const inputRootStyle = css({
    display: "inline-flex !important",
    flexWrap: "wrap",
    flex: 1,
    marginTop: 0,
    minWidth: 70,
    "&$outlined,&$filled": {
        boxSizing: "border-box"
    },
    "&$outlined": {
        paddingTop: 14
    },
    "&$filled": {
        paddingTop: 28
    }
});

const inputStyle = css({
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    appearance: "none",
    WebkitTapHighlightColor: "rgba(0,0,0,0)",
    float: "left",
    flex: 1,
    display: "inline-flex",
    "& input": {
        minHeight: 60
    }
});

const labelStyle = css({
    top: 4,
    "&$outlined&:not($labelShrink)": {
        top: 2,
        "$marginDense &": {
            top: 5
        }
    },
    "&$filled&:not($labelShrink)": {
        top: 15,
        "$marginDense &": {
            top: 20
        }
    }
});

const bottomLineColor = "rgba(255, 255, 255, 0.7)";

const underlineStyle = css({
    display: "flex",
    "&:after": {
        borderBottom: `2px solid white`,
        left: 0,
        bottom: 0,
        content: '""',
        position: "absolute",
        right: 0,
        transform: "scaleX(0)",
        pointerEvents: "none"
    },
    "&$focused:after": {
        transform: "scaleX(1)"
    },
    "&$error:after": {
        borderBottomColor: "red",
        transform: "scaleX(1)"
    },
    "&:before": {
        borderBottom: `1px solid ${bottomLineColor}`,
        left: 0,
        bottom: 0,
        content: '"\\00a0"',
        position: "absolute",
        right: 0,
        pointerEvents: "none"
    },
    "&:hover:not($disabled):not($focused):not($error):before": {
        borderBottom: `2px solid gray`,
        "@media (hover: none)": {
            borderBottom: `1px solid ${bottomLineColor}`
        }
    },
    "&$disabled:before": {
        borderBottomStyle: "dotted"
    }
});

const keyCodes = {
    BACKSPACE: 8,
    DELETE: 46,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39
};

interface DataSourceConfig {
    text: string;
    value: string;
}

interface ChipInputProps {
    allowDuplicates?: boolean;
    alwaysShowPlaceholder?: boolean;
    blurBehavior?: "clear" | "add" | "add-or-clear" | "ignore";
    children?: React.ReactNode;
    chipRenderer?: (
        props: ChipRendererProps,
        key: React.Key
    ) => React.ReactNode;
    className?: string;
    clearInputValueOnChange?: boolean;
    dataSource?: any[];
    dataSourceConfig?: DataSourceConfig;
    defaultValue?: any[];
    delayBeforeAdd?: boolean;
    disabled?: boolean;
    disableUnderline?: boolean;
    error?: boolean;
    filter?: (searchText: string, key: string) => boolean;
    FormHelperTextProps?: any;
    fullWidth?: boolean;
    fullWidthInput?: boolean;
    helperText?: React.ReactNode;
    id?: string;
    InputProps?: any;
    inputRef?: (ref: HTMLInputElement | null) => void;
    InputLabelProps?: any;
    inputValue?: string;
    label?: React.ReactNode;
    newChipKeyCodes?: number[];
    newChipKeys?: string[];
    onBeforeAdd?: (chip: any) => boolean;
    onAdd?: (chip: any) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onDelete?: (chip: any, index: number) => void;
    onChange?: (chips: any[]) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onUpdateInput?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    rootRef?: (ref: HTMLDivElement | null) => void;
    value?: any[];
    variant?: "standard" | "outlined" | "filled";
    [key: string]: any;
}

interface ChipRendererProps {
    value: any;
    text: string;
    chip: any;
    isFocused: boolean;
    isDisabled: boolean;
    isReadOnly: boolean;
    handleClick: () => void;
    handleDelete: () => void;
    className?: string;
}

const ChipInput: React.FC<ChipInputProps> = ({
    allowDuplicates = false,
    alwaysShowPlaceholder,
    blurBehavior = "clear",
    children,
    chipRenderer = defaultChipRenderer,
    className,
    clearInputValueOnChange = false,
    dataSource,
    dataSourceConfig,
    defaultValue,
    delayBeforeAdd = false,
    disabled,
    disableUnderline,
    error,
    filter,
    FormHelperTextProps,
    fullWidth,
    fullWidthInput,
    helperText,
    id,
    InputProps = {},
    inputRef,
    InputLabelProps = {},
    inputValue,
    label,
    newChipKeyCodes = [13],
    newChipKeys = ["Enter"],
    onBeforeAdd,
    onAdd,
    onBlur,
    onDelete,
    onChange,
    onFocus,
    onKeyDown,
    onKeyPress,
    onKeyUp,
    onUpdateInput,
    placeholder,
    readOnly,
    required,
    rootRef,
    value,
    variant = "standard",
    ...other
}) => {
    const [chips, setChips] = useState<any[]>(defaultValue || []);
    const [focusedChip, setFocusedChip] = useState<number | null>(null);
    const [inputValueState, setInputValueState] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [chipsUpdated, setChipsUpdated] = useState(false);

    const labelRef = useRef<any>(null);
    const inputRef2 = useRef<any>(null);
    const actualInputRef = useRef<HTMLInputElement | null>(null);
    const inputBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const keyPressedRef = useRef(false);
    const preventChipCreationRef = useRef(false);

    const actualInputValue = inputValue != null ? inputValue : inputValueState;

    const updateChips = useCallback(
        (newChips: any[]) => {
            setChips(newChips);
            setChipsUpdated(true);
            if (onChange) {
                onChange(newChips);
            }
        },
        [onChange]
    );

    const clearInput = useCallback(() => {
        setInputValueState("");
    }, []);

    const updateInput = useCallback((newValue: string) => {
        setInputValueState(newValue);
    }, []);

    const setActualInputRef = useCallback(
        (ref: HTMLInputElement | null) => {
            actualInputRef.current = ref;
            if (inputRef) {
                inputRef(ref);
            }
        },
        [inputRef]
    );

    const handleAddChip = useCallback(
        (chip: any, options?: { clearInputOnFail?: boolean }) => {
            if (onBeforeAdd && !onBeforeAdd(chip)) {
                preventChipCreationRef.current = true;
                if (options?.clearInputOnFail) {
                    clearInput();
                }
                return false;
            }
            clearInput();
            const currentChips = value || chips;

            if (dataSourceConfig) {
                if (typeof chip === "string") {
                    chip = {
                        [dataSourceConfig.text]: chip,
                        [dataSourceConfig.value]: chip
                    };
                }

                if (
                    allowDuplicates ||
                    !currentChips.some(
                        (c: any) =>
                            c[dataSourceConfig.value] ===
                            chip[dataSourceConfig.value]
                    )
                ) {
                    if (value && onAdd) {
                        onAdd(chip);
                    } else {
                        updateChips([...chips, chip]);
                    }
                }
                return true;
            }

            if (chip.trim().length > 0) {
                if (allowDuplicates || !currentChips.includes(chip)) {
                    if (value && onAdd) {
                        onAdd(chip);
                    } else {
                        updateChips([...chips, chip]);
                    }
                }
                return true;
            }
            return false;
        },
        [
            onBeforeAdd,
            clearInput,
            value,
            chips,
            dataSourceConfig,
            allowDuplicates,
            onAdd,
            updateChips
        ]
    );

    const handleDeleteChip = useCallback(
        (chip: any, i: number) => {
            if (!value) {
                const newChips = chips.slice();
                const changed = newChips.splice(i, 1);
                if (changed) {
                    let newFocusedChip = focusedChip;
                    if (focusedChip === i) {
                        newFocusedChip = null;
                    } else if (focusedChip !== null && focusedChip > i) {
                        newFocusedChip = focusedChip - 1;
                    }
                    setFocusedChip(newFocusedChip);
                    updateChips(newChips);
                }
            } else if (onDelete) {
                onDelete(chip, i);
            }
        },
        [value, chips, focusedChip, updateChips, onDelete]
    );

    const focus = useCallback(() => {
        if (actualInputRef.current) actualInputRef.current.focus();
        if (focusedChip != null) {
            setFocusedChip(null);
        }
    }, [focusedChip]);

    const blur = useCallback(() => {
        if (actualInputRef.current) actualInputRef.current.blur();
    }, []);

    const handleInputBlur = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            if (onBlur) {
                onBlur(event);
            }
            setIsFocused(false);
            if (focusedChip != null) {
                setFocusedChip(null);
            }
            const inputValue = event.target.value;
            if (blurBehavior === "add" || blurBehavior === "add-or-clear") {
                const addChipOptions =
                    blurBehavior === "add-or-clear"
                        ? { clearInputOnFail: true }
                        : undefined;

                if (delayBeforeAdd) {
                    const numChipsBefore = (value || chips).length;
                    inputBlurTimeoutRef.current = setTimeout(() => {
                        const numChipsAfter = (value || chips).length;
                        if (numChipsBefore === numChipsAfter) {
                            handleAddChip(inputValue, addChipOptions);
                        } else {
                            clearInput();
                        }
                    }, 150);
                } else {
                    handleAddChip(inputValue, addChipOptions);
                }
            } else if (blurBehavior === "clear") {
                clearInput();
            }
        },
        [
            onBlur,
            focusedChip,
            blurBehavior,
            delayBeforeAdd,
            value,
            chips,
            handleAddChip,
            clearInput
        ]
    );

    const handleInputFocus = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            if (onFocus) {
                onFocus(event);
            }
        },
        [onFocus]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            keyPressedRef.current = false;
            preventChipCreationRef.current = false;
            if (onKeyDown) {
                onKeyDown(event);
                if (event.isDefaultPrevented()) {
                    return;
                }
            }
            const currentChips = value || chips;
            if (
                newChipKeyCodes.includes(event.keyCode) ||
                newChipKeys.includes(event.key)
            ) {
                const result = handleAddChip(
                    (event.target as HTMLInputElement).value
                );
                if (result !== false) {
                    event.preventDefault();
                }
                return;
            }

            switch (event.keyCode) {
                case keyCodes.BACKSPACE:
                    if ((event.target as HTMLInputElement).value === "") {
                        if (focusedChip != null) {
                            handleDeleteChip(
                                currentChips[focusedChip],
                                focusedChip
                            );
                            if (focusedChip > 0) {
                                setFocusedChip(focusedChip - 1);
                            }
                        } else {
                            setFocusedChip(currentChips.length - 1);
                        }
                    }
                    break;
                case keyCodes.DELETE:
                    if (
                        (event.target as HTMLInputElement).value === "" &&
                        focusedChip != null
                    ) {
                        handleDeleteChip(
                            currentChips[focusedChip],
                            focusedChip
                        );
                        if (focusedChip <= currentChips.length - 1) {
                            setFocusedChip(focusedChip);
                        }
                    }
                    break;
                case keyCodes.LEFT_ARROW:
                    if (
                        focusedChip == null &&
                        (event.target as HTMLInputElement).value === "" &&
                        currentChips.length
                    ) {
                        setFocusedChip(currentChips.length - 1);
                    } else if (focusedChip != null && focusedChip > 0) {
                        setFocusedChip(focusedChip - 1);
                    }
                    break;
                case keyCodes.RIGHT_ARROW:
                    if (
                        focusedChip != null &&
                        focusedChip < currentChips.length - 1
                    ) {
                        setFocusedChip(focusedChip + 1);
                    } else {
                        setFocusedChip(null);
                    }
                    break;
                default:
                    setFocusedChip(null);
                    break;
            }
        },
        [
            onKeyDown,
            value,
            chips,
            newChipKeyCodes,
            newChipKeys,
            handleAddChip,
            focusedChip,
            handleDeleteChip
        ]
    );

    const handleKeyUp = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (
                !preventChipCreationRef.current &&
                (newChipKeyCodes.includes(event.keyCode) ||
                    newChipKeys.includes(event.key)) &&
                keyPressedRef.current
            ) {
                clearInput();
            } else {
                updateInput((event.target as HTMLInputElement).value);
            }
            if (onKeyUp) {
                onKeyUp(event);
            }
        },
        [newChipKeyCodes, newChipKeys, clearInput, updateInput, onKeyUp]
    );

    const handleKeyPress = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            keyPressedRef.current = true;
            if (onKeyPress) {
                onKeyPress(event);
            }
        },
        [onKeyPress]
    );

    const handleUpdateInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (inputValue == null) {
                updateInput(e.target.value);
            }

            if (onUpdateInput) {
                onUpdateInput(e);
            }
        },
        [inputValue, updateInput, onUpdateInput]
    );

    useEffect(() => {
        if (value && value.length !== chips.length && clearInputValueOnChange) {
            setInputValueState("");
        }
    }, [value, chips.length, clearInputValueOnChange]);

    useEffect(() => {
        if (disabled) {
            setFocusedChip(null);
        }
    }, [disabled]);

    useEffect(() => {
        if (!chipsUpdated && defaultValue) {
            setChips(defaultValue);
        }
    }, [defaultValue, chipsUpdated]);

    useEffect(() => {
        return () => {
            if (inputBlurTimeoutRef.current) {
                clearTimeout(inputBlurTimeoutRef.current);
            }
        };
    }, []);

    const currentChips = value || chips;
    const hasInput =
        (value || actualInputValue).length > 0 || actualInputValue.length > 0;
    const shrinkFloatingLabel =
        InputLabelProps.shrink != null
            ? InputLabelProps.shrink
            : label != null &&
              (hasInput || isFocused || currentChips.length > 0);

    const chipComponents = currentChips.map((chip: any, i: number) => {
        const chipValue = dataSourceConfig
            ? chip[dataSourceConfig.value]
            : chip;
        return chipRenderer(
            {
                value: chipValue,
                text: dataSourceConfig ? chip[dataSourceConfig.text] : chip,
                chip,
                isDisabled: !!disabled,
                isReadOnly: !!readOnly,
                isFocused: focusedChip === i,
                handleClick: () => setFocusedChip(i),
                handleDelete: () => handleDeleteChip(chip, i)
            },
            i
        );
    });

    const InputMore: any = {};
    if (variant === "outlined") {
        InputMore.notched = shrinkFloatingLabel;
    }

    if (variant !== "standard") {
        InputMore.startAdornment = (
            <React.Fragment>{chipComponents}</React.Fragment>
        );
    } else {
        InputProps.disableUnderline = true;
    }

    const InputComponent = variantComponent[variant];

    return (
        <FormControl
            style={{ height: "60px" }}
            ref={rootRef}
            fullWidth={true}
            error={error}
            required={false}
            onClick={focus}
            disabled={disabled}
            variant={variant}
            {...other}
        >
            {label && (
                <InputLabel
                    htmlFor={id}
                    css={labelStyle}
                    shrink={shrinkFloatingLabel}
                    focused={isFocused}
                    variant={variant}
                    ref={labelRef}
                    required={required}
                    {...InputLabelProps}
                >
                    {label}
                </InputLabel>
            )}
            <div css={underlineStyle}>
                {variant === "standard" && chipComponents}
                <InputComponent
                    ref={inputRef2}
                    css={[inputStyle]}
                    id={id}
                    value={actualInputValue}
                    onChange={handleUpdateInput}
                    onKeyDown={handleKeyDown}
                    onKeyPress={handleKeyPress}
                    onKeyUp={handleKeyUp}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    inputRef={setActualInputRef}
                    label={label}
                    disabled={disabled}
                    fullWidth={fullWidthInput}
                    placeholder={
                        (!hasInput && (shrinkFloatingLabel || label == null)) ||
                        alwaysShowPlaceholder
                            ? placeholder
                            : null
                    }
                    readOnly={readOnly}
                    {...InputProps}
                    {...InputMore}
                />
            </div>
            {helperText && (
                <FormHelperText {...FormHelperTextProps}>
                    {helperText}
                </FormHelperText>
            )}
        </FormControl>
    );
};

export const defaultChipRenderer = (
    {
        value,
        text,
        isFocused,
        isDisabled,
        isReadOnly,
        handleClick,
        handleDelete,
        className
    }: ChipRendererProps,
    key: React.Key
) => (
    <Chip
        key={key}
        className={className}
        style={{
            pointerEvents: isDisabled || isReadOnly ? "none" : undefined,
            backgroundColor: isFocused ? blue[300] : "rgba(20,20,50,0.2)",
            alignSelf: "center",
            fontSize: "14px",
            color: "white"
        }}
        onClick={handleClick}
        onDelete={handleDelete}
        label={text}
    />
);

export default ChipInput;
