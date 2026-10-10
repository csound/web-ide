import { afterEach, expect, it, vi } from "vitest";
import {
    clearCompilerDiagnostics,
    compilerDiagnostics,
    replaceCompilerDiagnostics,
    watchCompiler
} from "./messages";

const text = "opcode Voice():a\nxout broken()\nendop";
const diagnostics = [
    { filename: "voice.udo", line: 2, message: "Unknown opcode" }
];
afterEach(() => {
    clearCompilerDiagnostics("project");
    clearCompilerDiagnostics("other");
});

it("retains errors across tab closes but never replays another project's snapshot", () => {
    compilerDiagnostics("project", "include", text, diagnostics);
    const first = vi.fn();
    watchCompiler("project", "include", first)();
    expect(first).toHaveBeenCalledWith({ text, diagnostics });
    const reopened = vi.fn();
    watchCompiler("project", "include", reopened)();
    expect(reopened).toHaveBeenCalledWith({ text, diagnostics });
    const other = vi.fn();
    watchCompiler("other", "include", other)();
    expect(other).not.toHaveBeenCalled();
    clearCompilerDiagnostics("project");
    const later = vi.fn();
    watchCompiler("project", "include", later)();
    expect(later).not.toHaveBeenCalled();
});

it("clears unopened compiler errors after a later compilation", () => {
    replaceCompilerDiagnostics("project", [
        { documentUid: "include", text, diagnostics }
    ]);
    replaceCompilerDiagnostics("project", [
        { documentUid: "include", text, diagnostics: [] }
    ]);
    const receive = vi.fn();
    watchCompiler("project", "include", receive)();
    expect(receive).not.toHaveBeenCalled();
});

it("drops a cached background error when a later check clears it", () => {
    compilerDiagnostics("project", "include", text, diagnostics);
    compilerDiagnostics("project", "include", text, []);
    const receive = vi.fn();
    watchCompiler("project", "include", receive)();
    expect(receive).not.toHaveBeenCalled();
});

it("forgets a superseded Play snapshot without discarding included-file errors", () => {
    compilerDiagnostics("project", "main", text, diagnostics);
    compilerDiagnostics("project", "include", text, diagnostics);
    clearCompilerDiagnostics("project", "main");
    const main = vi.fn();
    watchCompiler("project", "main", main)();
    expect(main).not.toHaveBeenCalled();
    const include = vi.fn();
    watchCompiler("project", "include", include)();
    expect(include).toHaveBeenCalledWith({ text, diagnostics });
});

it("bounds the number of cached documents and evicts the oldest", () => {
    for (let index = 0; index < 129; index++)
        compilerDiagnostics("project", String(index), text, diagnostics);
    const oldest = vi.fn();
    watchCompiler("project", "0", oldest)();
    expect(oldest).not.toHaveBeenCalled();
    const newest = vi.fn();
    watchCompiler("project", "128", newest)();
    expect(newest).toHaveBeenCalledWith({ text, diagnostics });
});

it("bounds total source text while still publishing large files to open editors", () => {
    const large = "x".repeat(2 * 1024 * 1024);
    compilerDiagnostics("project", "large", large, diagnostics);
    compilerDiagnostics("project", "small", text, diagnostics);
    const evicted = vi.fn();
    watchCompiler("project", "large", evicted)();
    expect(evicted).not.toHaveBeenCalled();
    const receive = vi.fn();
    const unsubscribe = watchCompiler("project", "large", receive);
    compilerDiagnostics("project", "large", large + "x", diagnostics);
    unsubscribe();
    expect(receive).toHaveBeenCalledOnce();
    const reopened = vi.fn();
    watchCompiler("project", "large", reopened)();
    expect(reopened).not.toHaveBeenCalled();
});
