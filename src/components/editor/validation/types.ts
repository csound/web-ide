export interface SourceFile {
    name: string;
    text: string;
}
export interface CheckRequest {
    filename: string;
    files: SourceFile[];
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
