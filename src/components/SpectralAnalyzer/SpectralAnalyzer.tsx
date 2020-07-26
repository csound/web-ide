import React, { useEffect, useRef } from "react";
import withStyles from "./styles";
import { useSelector } from "react-redux";
import { pathOr } from "ramda";
import { ICsoundObj } from "../Csound/types";

type SpectralAnalyzerProps = {
    classes: any;
};

// resize code used from https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

type CanvasRef = {
    current: HTMLCanvasElement | null;
};

const connectVisualizer = (csound: ICsoundObj, canvasRef: CanvasRef) => {
    if (!canvasRef || !canvasRef.current) {
        return null;
    } else {
        const canvas: HTMLCanvasElement = canvasRef.current;

        const ctx = canvas.getContext("2d");

        if (ctx == null) {
            return null;
        }

        console.log("Connect Visualizer!");

        const node = csound.getNode();
        const context = node.context;
        const scopeNode = context.createAnalyser();
        scopeNode.fftSize = 2048;
        node.connect(scopeNode);

        const mags = function() {
            resize(canvas);
            const width = canvas.width;
            const height = canvas.height;
            let freqData = new Uint8Array(scopeNode.frequencyBinCount);
            let scaling = height / 256;

            scopeNode.getByteFrequencyData(freqData);

            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = "rgba(0, 20, 0, 0.1)";
            ctx.fillRect(0, 0, width, height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0,255,0,1)";
            ctx.beginPath();

            for (var x = 0; x < width; x++) {
                let indx = Math.floor(
                    (x / width) * scopeNode.frequencyBinCount
                );
                ctx.lineTo(x, height - freqData[indx] * scaling);
            }

            ctx.stroke();
            requestAnimationFrame(mags);
        };
        mags();

        return scopeNode;
    }
};

const disconnectVisualizer = (csound: ICsoundObj, scopeNode: AnalyserNode) => {
    const node = csound.getNode();
    node.disconnect(scopeNode);

    console.log("Disconnect Visualizer!");
};

export const SpectralAnalyzer = ({ classes }: SpectralAnalyzerProps) => {
    const canvasRef = useRef() as CanvasRef;

    const csound: ICsoundObj | null = useSelector(
        pathOr(null, ["csound", "csound"])
    ) as ICsoundObj | null;

    useEffect(() => {
        let scopeNode: AnalyserNode | null = null;
        if (csound && canvasRef.current) {
            scopeNode = connectVisualizer(csound, canvasRef);
        }

        return () => {
            if (csound && scopeNode) {
                disconnectVisualizer(csound, scopeNode);
            }
        };
    }, [canvasRef, csound]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
        ></canvas>
    );
};

export default withStyles(SpectralAnalyzer);
