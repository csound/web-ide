import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { assoc, path } from "ramda";
import { CsoundObj } from "@csound/browser";
import { ICsoundStatus } from "@comp/csound/types";
import { csoundInstance } from "../csound";
import { scaleLinear } from "d3-scale";

// resize code used from https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

type CanvasReference = {
    current: HTMLCanvasElement | null;
};

const connectVisualizer = async (
    csound: CsoundObj,
    canvasReference: CanvasReference
) => {
    if (!canvasReference || !canvasReference.current) {
        return;
    } else {
        const canvas: HTMLCanvasElement = canvasReference.current;

        const context_ = canvas.getContext("2d");

        if (!context_) {
            return;
        }

        //console.log("Connect Visualizer!");
        const node = await csound.getNode();
        if (node === undefined) {
            return;
        }

        const context = node.context;
        const scopeNode = context.createAnalyser();

        scopeNode.fftSize = 2048;
        node.connect(scopeNode);

        let isConnected = true;

        const mags = () => {
            resize(canvas);

            const width = canvas.width;
            const height = canvas.height;

            if (!isConnected) {
                context_.clearRect(0, 0, width, height);
                return;
            }

            const freqData = new Uint8Array(scopeNode.frequencyBinCount);

            const scaleY = scaleLinear().domain([0, 256]).range([height, 0]);

            scopeNode.getByteFrequencyData(freqData);

            context_.clearRect(0, 0, width, height);

            context_.fillStyle = "rgba(0, 20, 0, 0.1)";
            context_.fillRect(0, 0, width, height);
            context_.lineWidth = 2;
            context_.strokeStyle = "rgba(0,255,0,1)";
            context_.beginPath();

            for (let x = 0; x < width; x++) {
                const indx = Math.floor(
                    (x / width) * scopeNode.frequencyBinCount
                );
                context_.lineTo(x, scaleY(freqData[indx]));
            }

            context_.stroke();
            requestAnimationFrame(mags);
        };

        mags();

        const disconnectionCallback = () => {
            if (isConnected) {
                isConnected = false;
                node.disconnect(scopeNode);
            }
        };

        return disconnectionCallback;
    }
};

const SpectralAnalyzer = (): React.ReactElement => {
    const [scopeNodeState, setScopeNodeState]: [
        {
            status: "init" | "running";
            scopeNodeDisconnector: (() => void) | undefined;
        },
        any
    ] = useState({
        status: "init",
        scopeNodeDisconnector: undefined
    });

    const canvasReference = useRef(null) as CanvasReference;

    const csoundStatus: ICsoundStatus =
        useSelector(path(["csound", "status"])) || "initialized";

    useEffect(() => {
        if (
            ["stopped", "error"].includes(csoundStatus) &&
            scopeNodeState.status === "running"
        ) {
            if (csoundInstance && scopeNodeState.scopeNodeDisconnector) {
                scopeNodeState.scopeNodeDisconnector();
            }
            setScopeNodeState({
                status: "init",
                scopeNodeDisconnector: undefined
            });
        }
        if (
            csoundInstance &&
            csoundStatus === "playing" &&
            scopeNodeState.status !== "running"
        ) {
            setScopeNodeState(assoc("status", "running", scopeNodeState));
            connectVisualizer(csoundInstance, canvasReference).then(
                (scopeNodeDisconnector) =>
                    setScopeNodeState({
                        status: "running",
                        scopeNodeDisconnector
                    })
            );
        }
    }, [csoundStatus, scopeNodeState]);

    useEffect(() => {
        return () => {
            scopeNodeState.scopeNodeDisconnector &&
                scopeNodeState.scopeNodeDisconnector();
        };
    }, [canvasReference, scopeNodeState]);

    return (
        <canvas
            ref={canvasReference}
            style={{ width: "100%", height: "100%", display: "block" }}
        ></canvas>
    );
};

export default SpectralAnalyzer;
