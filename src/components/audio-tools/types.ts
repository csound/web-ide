import type { ScoreProgram } from "../score-tools/programs";

export type ToolName =
    | ScoreProgram
    | "pv_export"
    | "pv_import"
    | "mkir"
    | "cvanal"
    | "scale"
    | "src_conv"
    | "dnoise"
    | "pvanal"
    | "pvlook"
    | "atsa"
    | "hetro"
    | "lpanal"
    | "envext";

export type ToolFile = { name: string; data: Uint8Array };
export type ToolRequest = {
    tool: ToolName;
    args: string[];
    files: ToolFile[];
    output: string;
    stdin?: string;
};
export type ToolResult = { data: Uint8Array; log: string };
export type ToolMessage =
    | { type: "status"; text: string }
    | { type: "result"; result: ToolResult }
    | { type: "error"; message: string };

export type AudioData = {
    sampleRate: number;
    channels: Float32Array[];
};
export type Plot =
    | {
          kind: "lines";
          label: string;
          unit: string;
          duration: number;
          xUnit?: string;
          max: number;
          series: [number, number][][];
      }
    | {
          kind: "heatmap";
          label: string;
          unit: string;
          duration: number;
          max: number;
          width: number;
          height: number;
          values: Float32Array;
      };
