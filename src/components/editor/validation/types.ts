export interface SourceFile {
    name: string;
    text: string;
}
export interface CheckRequest {
    filename: string;
    files: SourceFile[];
    /** CSD structure errors that must be fixed before checking the orchestra. */
    sourceDiagnostics?: SourceDiagnostic[];
    knownOpcodes?: string[];
    pluginRequests?: PluginRequest[];
    plugins?: OpcodeSignature[];
    pluginTypes?: PluginType[];
}
export interface SourceDiagnostic {
    filename: string;
    line: number;
    column?: number;
    endColumn?: number;
    message: string;
}
export interface CheckResult {
    diagnostics: SourceDiagnostic[];
    available: boolean;
    /** This snapshot was rejected; the worker can still check the next edit. */
    rejected?: boolean;
    valid?: boolean;
    udos?: UdoDeclaration[];
    udosComplete?: boolean;
    plugins?: OpcodeSignature[];
    pluginTypes?: PluginType[];
}
export interface UdoDeclaration {
    name: string;
    filename: string;
    line: number;
    inputs: { name: string; type: string }[];
    outputs: string[];
}
import type { OpcodeSignature } from "./plugins/signatures";
import type { PluginRequest } from "./plugins/options";

import type { PluginType } from "./plugins/types";
