import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { path } from "ramda";
import { CsoundObj } from "@csound/browser";
import { scaleLinear } from "d3-scale";

type ISpectralAnalyzerProperties = {
    classes: any;
};

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

const connectVisualizer = (
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

        const node = csound.getNode();
        const context = node.context;
        const scopeNode = context.createAnalyser();
        scopeNode.fftSize = 2048;
        node.connect(scopeNode);

        const mags = () => {
            resize(canvas);
            const width = canvas.width;
            const height = canvas.height;
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

        return scopeNode;
    }
};

const disconnectVisualizer = (csound: CsoundObj, scopeNode: AnalyserNode) => {
    const node = csound.getNode();
    node.disconnect(scopeNode);
};

const SpectralAnalyzer = ({
    classes
}: ISpectralAnalyzerProperties): React.ReactElement => {
    const canvasReference = useRef() as CanvasReference;

    const csound: CsoundObj | undefined = useSelector(
        path(["csound", "csound"])
    );

    useEffect(() => {
        let scopeNode: AnalyserNode | undefined;
        if (csound && canvasReference.current) {
            scopeNode = connectVisualizer(csound, canvasReference);
        }

        return () => {
            if (csound && scopeNode) {
                disconnectVisualizer(csound, scopeNode);
            }
        };
    }, [canvasReference, csound]);

    return (
        <canvas
            ref={canvasReference}
            style={{ width: "100%", height: "100%", display: "block" }}
        ></canvas>
    );
};

export default SpectralAnalyzer;
