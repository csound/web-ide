import type { Theme } from "@emotion/react";
import {
    BANDS,
    HISTORY_COLUMNS,
    HISTORY_SECONDS,
    SpectralHistory,
    frequencyTicks,
    frequencyPosition,
    frequencyLabel,
    maximumFrequency
} from "./analysis";

export type ViewMode = "spectrogram" | "spectrum";
type Color = [number, number, number];
const rgb = (hex: string): Color =>
    [1, 3, 5].map((offset) =>
        Number.parseInt(hex.slice(offset, offset + 2), 16)
    ) as Color;
const mix = (a: Color, b: Color, amount: number): Color =>
    a.map((value, index) =>
        Math.round(value + (b[index] - value) * amount)
    ) as Color;

export function spectralPalette(theme: Theme) {
    // Color encodes level, with increasing contrast in either editor theme.
    const stops = [
        theme.background,
        ...(theme.mode === "light"
            ? ["#bdced1", "#6a9eaa", "#345c78", "#182633"]
            : ["#233c5a", "#427c88", "#cfb867", "#fff4cc"])
    ];
    const colors = stops.map(rgb);
    const bytes = new Uint8Array(256 * 4);
    for (let index = 0; index < 256; index++) {
        const position = (index / 255) * (colors.length - 1);
        const low = Math.min(colors.length - 2, Math.floor(position));
        bytes.set(
            [...mix(colors[low], colors[low + 1], position - low), 255],
            index * 4
        );
    }
    return { bytes, css: `linear-gradient(to right, ${stops.join(", ")})` };
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader unavailable");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error("Shader compilation failed");
    }
    return shader;
}

function webglRenderer(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false
    });
    if (!gl) return;
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const historyTexture = gl.createTexture();
    const paletteTexture = gl.createTexture();
    const shaders: WebGLShader[] = [];
    const dispose = () => {
        gl.deleteTexture(historyTexture);
        gl.deleteTexture(paletteTexture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        shaders.forEach((shader) => gl.deleteShader(shader));
    };
    try {
        if (!program || !buffer || !historyTexture || !paletteTexture)
            throw new Error("WebGL unavailable");
        shaders.push(
            createShader(
                gl,
                gl.VERTEX_SHADER,
                `
            attribute vec2 position;
            varying vec2 uv;
            void main() { uv = (position + 1.0) * 0.5; gl_Position = vec4(position, 0.0, 1.0); }
        `
            )
        );
        shaders.push(
            createShader(
                gl,
                gl.FRAGMENT_SHADER,
                `
            #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
            #else
            precision mediump float;
            #endif
            uniform sampler2D history;
            uniform sampler2D palette;
            uniform float head;
            varying vec2 uv;
            void main() {
                float position = clamp(uv.x * ${HISTORY_COLUMNS}.0 - 0.5, 0.0, ${HISTORY_COLUMNS - 1}.0);
                float column = floor(position);
                float row = mod(head + column, ${HISTORY_COLUMNS}.0);
                float nextRow = mod(head + min(column + 1.0, ${HISTORY_COLUMNS - 1}.0), ${HISTORY_COLUMNS}.0);
                float first = texture2D(history, vec2(uv.y, (row + 0.5) / ${HISTORY_COLUMNS}.0)).r;
                float second = texture2D(history, vec2(uv.y, (nextRow + 0.5) / ${HISTORY_COLUMNS}.0)).r;
                float level = mix(first, second, fract(position));
                gl_FragColor = texture2D(palette, vec2((level * 255.0 + 0.5) / 256.0, 0.5));
            }
        `
            )
        );
        shaders.forEach((shader) => gl.attachShader(program, shader));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error("Shader linking failed");
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        );
        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        const texture = (
            unit: number,
            handle: WebGLTexture,
            width: number,
            height: number,
            format: number
        ) => {
            gl.activeTexture(unit);
            gl.bindTexture(gl.TEXTURE_2D, handle);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                format,
                width,
                height,
                0,
                format,
                gl.UNSIGNED_BYTE,
                null
            );
        };
        texture(
            gl.TEXTURE0,
            historyTexture,
            BANDS,
            HISTORY_COLUMNS,
            gl.LUMINANCE
        );
        texture(gl.TEXTURE1, paletteTexture, 256, 1, gl.RGBA);
        gl.uniform1i(gl.getUniformLocation(program, "history"), 0);
        gl.uniform1i(gl.getUniformLocation(program, "palette"), 1);
        const head = gl.getUniformLocation(program, "head");
        return {
            draw(history: SpectralHistory, palette: Uint8Array) {
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, historyTexture);
                gl.texSubImage2D(
                    gl.TEXTURE_2D,
                    0,
                    0,
                    0,
                    BANDS,
                    HISTORY_COLUMNS,
                    gl.LUMINANCE,
                    gl.UNSIGNED_BYTE,
                    history.data
                );
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
                gl.texSubImage2D(
                    gl.TEXTURE_2D,
                    0,
                    0,
                    0,
                    256,
                    1,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    palette
                );
                gl.uniform1f(head, history.head);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            },
            dispose
        };
    } catch {
        dispose();
        return;
    }
}

export function createSpectralRenderer(
    host: HTMLElement,
    overlay: HTMLCanvasElement,
    initialTheme: Theme
) {
    const history = new SpectralHistory();
    let theme = initialTheme;
    let palette = spectralPalette(theme).bytes;
    let mode: ViewMode = "spectrogram";
    let maximum = 20000;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let canvas = document.createElement("canvas");
    let gpu = webglRenderer(canvas);
    const bitmap = document.createElement("canvas");
    bitmap.width = HISTORY_COLUMNS;
    bitmap.height = BANDS;
    const bitmapContext = bitmap.getContext("2d")!;
    const pixels = bitmapContext.createImageData(HISTORY_COLUMNS, BANDS);
    const axes = overlay.getContext("2d")!;
    let fallback: CanvasRenderingContext2D | null = null;
    const useFallback = () => {
        gpu?.dispose();
        gpu = undefined;
        canvas.removeEventListener("webglcontextlost", contextLost);
        canvas.remove();
        canvas = document.createElement("canvas");
        fallback = canvas.getContext("2d");
        mount();
        resize();
    };
    const contextLost = (event: Event) => {
        event.preventDefault();
        useFallback();
    };
    function mount() {
        canvas.style.cssText = "width:100%;height:100%;display:block";
        canvas.setAttribute("aria-hidden", "true");
        host.replaceChildren(canvas);
        host.dataset.renderer = gpu ? "webgl" : "canvas";
    }
    function drawHeatmap() {
        if (gpu) gpu.draw(history, palette);
        else if (fallback) {
            for (let x = 0; x < HISTORY_COLUMNS; x++) {
                const column = (history.head + x) % HISTORY_COLUMNS;
                for (let band = 0; band < BANDS; band++) {
                    const color = history.data[column * BANDS + band] * 4;
                    const target =
                        ((BANDS - 1 - band) * HISTORY_COLUMNS + x) * 4;
                    pixels.data[target] = palette[color];
                    pixels.data[target + 1] = palette[color + 1];
                    pixels.data[target + 2] = palette[color + 2];
                    pixels.data[target + 3] = 255;
                }
            }
            bitmapContext.putImageData(pixels, 0, 0);
            fallback.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        }
    }
    function draw() {
        if (width < 1 || height < 1) return;
        const left = 48,
            top = 12,
            plotWidth = width - 60,
            plotHeight = height - 36;
        if (plotWidth <= 0 || plotHeight <= 0) return;
        host.style.visibility = mode === "spectrogram" ? "visible" : "hidden";
        axes.setTransform(ratio, 0, 0, ratio, 0, 0);
        axes.clearRect(0, 0, width, height);
        axes.font = `10px ${theme.font.monospace}`;
        axes.lineWidth = 1;
        axes.fillStyle = theme.altTextColor;
        const line = (x1: number, y1: number, x2: number, y2: number) => {
            axes.beginPath();
            axes.moveTo(x1, y1);
            axes.lineTo(x2, y2);
            axes.stroke();
        };
        const ticks = frequencyTicks(
            maximum,
            mode === "spectrogram" ? plotHeight : plotWidth
        );
        if (mode === "spectrogram") {
            drawHeatmap();
            axes.textAlign = "right";
            axes.textBaseline = "middle";
            for (const hz of ticks) {
                const y =
                    top + (1 - frequencyPosition(hz, maximum)) * plotHeight;
                axes.fillText(frequencyLabel(hz), left - 8, y);
                axes.strokeStyle =
                    theme.mode === "light"
                        ? "rgba(40,60,70,0.18)"
                        : "rgba(210,225,240,0.18)";
                line(left, y, left + plotWidth, y);
            }
            axes.textAlign = "left";
            axes.fillText("Hz", 6, top);
            axes.textBaseline = "top";
            for (
                let second = 0;
                second <= HISTORY_SECONDS;
                second += plotWidth < 260 ? 5 : 2
            ) {
                const x = left + (second / HISTORY_SECONDS) * plotWidth;
                axes.textAlign =
                    second === 0
                        ? "left"
                        : second === HISTORY_SECONDS
                          ? "right"
                          : "center";
                axes.fillText(
                    second === HISTORY_SECONDS
                        ? "Now"
                        : `-${HISTORY_SECONDS - second}s`,
                    x,
                    top + plotHeight + 7
                );
            }
        } else {
            axes.strokeStyle = theme.line;
            axes.textAlign = "right";
            axes.textBaseline = "middle";
            for (let db = 0; db >= -100; db -= plotHeight < 150 ? 50 : 20) {
                const y = top - (db / 100) * plotHeight;
                axes.fillText(`${db}`, left - 8, y);
                line(left, y, left + plotWidth, y);
            }
            axes.textAlign = "left";
            axes.fillText("dB", 4, top);
            axes.textBaseline = "top";
            for (const hz of ticks) {
                const x = left + frequencyPosition(hz, maximum) * plotWidth;
                line(x, top, x, top + plotHeight);
                axes.textAlign =
                    hz === ticks[0]
                        ? "left"
                        : hz === maximum
                          ? "right"
                          : "center";
                axes.fillText(frequencyLabel(hz), x, top + plotHeight + 7);
            }
            axes.save();
            axes.beginPath();
            axes.rect(left, top, plotWidth, plotHeight);
            axes.clip();
            axes.beginPath();
            for (let band = 0; band < BANDS; band++) {
                const x = left + ((band + 0.5) / BANDS) * plotWidth;
                const y = top + (1 - history.latest[band] / 255) * plotHeight;
                if (band === 0) axes.moveTo(x, y);
                else axes.lineTo(x, y);
            }
            axes.strokeStyle = theme.caretColor;
            axes.lineWidth = 1.5;
            axes.stroke();
            axes.lineTo(left + plotWidth, top + plotHeight);
            axes.lineTo(left, top + plotHeight);
            const gradient = axes.createLinearGradient(
                0,
                top,
                0,
                top + plotHeight
            );
            gradient.addColorStop(0, theme.caretColor + "66");
            gradient.addColorStop(1, theme.caretColor + "08");
            axes.fillStyle = gradient;
            axes.fill();
            axes.restore();
        }
    }
    function resize() {
        const bounds = overlay.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        ratio = Math.min(window.devicePixelRatio || 1, 2);
        overlay.width = Math.round(width * ratio);
        overlay.height = Math.round(height * ratio);
        canvas.width = Math.max(1, Math.round((width - 60) * ratio));
        canvas.height = Math.max(1, Math.round((height - 36) * ratio));
        draw();
    }
    mount();
    if (!gpu) useFallback();
    else canvas.addEventListener("webglcontextlost", contextLost);
    return {
        resize,
        draw,
        history,
        configure(nextMode: ViewMode, nextTheme: Theme) {
            mode = nextMode;
            theme = nextTheme;
            palette = spectralPalette(theme).bytes;
            draw();
        },
        start(sampleRate: number) {
            maximum = maximumFrequency(sampleRate);
            history.clear();
            draw();
        },
        dispose() {
            canvas.removeEventListener("webglcontextlost", contextLost);
            gpu?.dispose();
            canvas.remove();
        }
    };
}
