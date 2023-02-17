/* eslint-disable */
import React, { useEffect, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import Fab from "@mui/material/Fab";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import InsightsIcon from "@mui/icons-material/Insights";
import {
    Background,
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLine
} from "victory";
import { store } from "@store";

const wrapWithCsd = (globalStatement) => `
    <CsoundSynthesizer>
    <CsOptions>
    </CsOptions>
    <CsInstruments>
    ${globalStatement}
    </CsInstruments>
    <CsScore>
    e 0 0
    </CsScore>
    </CsoundSynthesizer>
`;

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const FtgenPlotter = ({ selectedTheme, statementObject }) => {
    const csoundCode = `i_ ${
        statementObject.operator
    } 1,${statementObject.outputArgs.slice(1).join(",")}`;
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState();
    const [error, setError] = useState();

    const [minYDomain, setMinYDomain] = useState(-1);
    const [maxYDomain, setMaxYDomain] = useState(1);

    useEffect(() => {
        if (isOpen) {
            /* eslint-disable import/no-unresolved */
            import(
                /*webpackIgnore: true*/ `${window.location.origin}/csound-no-audio.js`
            ).then(async (module) => {
                const logBuffer = [];
                const Csound = module.Csound;
                const csoundObj = await Csound({
                    logCallback: (l) => logBuffer.push(l)
                });
                const compileResult = await csoundObj.compileCsdText(
                    wrapWithCsd(csoundCode)
                );
                const startResult =
                    compileResult === 0 ? await csoundObj.start() : -1;

                const tableBuffer =
                    startResult === 0 && (await csoundObj.tableCopyOut(1));
                if (tableBuffer) {
                    const dataArray = Array.from(tableBuffer);
                    setMinYDomain(Math.min.apply(undefined, dataArray));
                    setMaxYDomain(Math.max.apply(undefined, dataArray));
                    setData(
                        dataArray.map((v, i) => ({
                            x: i,
                            y: v
                        }))
                    );
                } else {
                    // handle fail case
                    setError(logBuffer.join("\n"));
                }
            });
        }
    }, [isOpen, setData, setError, csoundCode, setMinYDomain, setMaxYDomain]);

    return (
        <div
            style={{
                position: "relative",
                backgroundColor: selectedTheme.background
            }}
        >
            <IconButton
                data-tip="inspect ftgen"
                style={{
                    position: "absolute",
                    right: 12,
                    bottom: 8,
                    background: "rebeccapurple"
                }}
                onClick={() => setIsOpen(true)}
            >
                <InsightsIcon style={{ fill: "white" }} />
            </IconButton>

            <Dialog
                onClose={() => setIsOpen(false)}
                open={isOpen}
                TransitionComponent={Transition}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        textAlign: "center",
                        backgroundColor: selectedTheme.background,
                        fontFamily: "'Fira Mono', monospace",
                        fontSize: 15,
                        paddingTop: "32px",
                        paddingBottom: 0,
                        color: selectedTheme.textColor
                    }}
                >
                    {csoundCode || "loading..."}
                    <div style={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseIcon
                            sx={{ cursor: "pointer" }}
                            onClick={() => {
                                setIsOpen(false);
                            }}
                            data-tip={"Close dialog"}
                        />
                    </div>
                </DialogTitle>
                <div
                    style={{
                        width: "100%",
                        overflow: "hidden"
                    }}
                >
                    {!error && Array.isArray(data) && data.length > 0 && (
                        <VictoryChart
                            backgroundComponent={
                                <Background
                                    width={450}
                                    height={300}
                                    x={0}
                                    y={0}
                                />
                            }
                            style={{
                                background: {
                                    fill: selectedTheme.background
                                }
                            }}
                        >
                            <VictoryLine
                                interpolation="natural"
                                style={{
                                    data: {
                                        fill: "none",
                                        stroke: selectedTheme.textColor
                                    }
                                }}
                                data={data}
                            />
                            <VictoryAxis
                                dependentAxis
                                crossAxis={false}
                                tickCount={10}
                                style={{
                                    axis: { stroke: "none" },
                                    ticks: { stroke: "grey", size: 5 },
                                    grid: {
                                        stroke: selectedTheme.altTextColor
                                    },
                                    tickLabels: {
                                        fill: selectedTheme.textColor,
                                        fontFamily: "'Fira Mono', monospace",
                                        fontSize: 6
                                    }
                                }}
                            />
                            <VictoryAxis
                                tickCount={6}
                                tickLabelComponent={<VictoryLabel dy={95} />}
                                style={{
                                    axis: { stroke: "none" },
                                    grid: {
                                        stroke: selectedTheme.altTextColor
                                    },
                                    tickLabels: {
                                        fill: selectedTheme.textColor,
                                        fontFamily: "'Fira Mono', monospace",
                                        fontSize: 5
                                    }
                                }}
                            />
                        </VictoryChart>
                    )}
                    {error && (
                        <div>
                            <h4
                                style={{
                                    color: selectedTheme.errorText,
                                    textAlign: "center",
                                    margin: 0,
                                    padding: "24px 0",
                                    backgroundColor: selectedTheme.background
                                }}
                            >
                                Csound failed to produce a table buffer
                            </h4>
                            <pre
                                style={{
                                    margin: 0,
                                    paddin: "6px 24px",
                                    backgroundColor: selectedTheme.background,
                                    color: selectedTheme.textColor
                                }}
                            >
                                {error}
                            </pre>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export const isFtgenPlottable = (token) =>
    ["ftgen", "ftgenonce", "ftgentmp"].includes(token);

export const renderFtgenPlotterElement = ({
    root,
    statement,
    synopsis,
    statementObject
}) => {
    // const csoundCode =
    //     (statementObject.statementType === "CallbackExpression" ? "i_ =" : "") +
    //     statement.text.join("\n");
    const storeState = store.getState();
    const selectedTheme = storeState.ThemeReducer.selectedTheme;

    const children = (
        <div>
            <p
                style={{
                    padding: 0,
                    margin: 0
                }}
            >
                {synopsis}
            </p>
            <FtgenPlotter
                selectedTheme={selectedTheme}
                statementObject={statementObject}
            />
        </div>
    );
    root.render(children);

    return root;
};
