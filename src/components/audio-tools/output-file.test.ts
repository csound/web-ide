// @vitest-environment node
import { expect, it } from "vitest";
import { wasi } from "@bjorn3/browser_wasi_shim";
import { OutputFile } from "./output-file";

it("reuses storage across sequential writes instead of copying every block", () => {
    const file = new OutputFile();
    const fd = file.path_open(0, BigInt(0), 0).fd_obj;
    const block = new Uint8Array(1024).fill(7);
    const buffers = new Set<ArrayBufferLike>();
    for (let index = 0; index < 128; index++) {
        fd.fd_write(block);
        buffers.add(file.data.buffer);
    }
    expect(buffers.size).toBe(2);
    expect(file.data).toEqual(new Uint8Array(128 * 1024).fill(7));
});

it("preserves seeks, header rewrites, truncation, zero filling, and append", () => {
    const file = new OutputFile(32);
    const fd = file.path_open(0, BigInt(0), 0).fd_obj;
    fd.fd_write(new Uint8Array([1, 2, 3, 4]));
    fd.fd_pwrite(new Uint8Array([9]), BigInt(1));
    expect(fd.file_pos).toBe(BigInt(4));
    fd.fd_seek(BigInt(0), wasi.WHENCE_SET);
    fd.fd_write(new Uint8Array([8]));
    expect([...file.data]).toEqual([8, 9, 3, 4]);
    fd.fd_filestat_set_size(BigInt(2));
    fd.fd_allocate(BigInt(0), BigInt(4));
    expect([...file.data]).toEqual([8, 9, 0, 0]);
    const append = file.path_open(0, BigInt(0), wasi.FDFLAGS_APPEND).fd_obj;
    append.fd_write(new Uint8Array([5]));
    expect([...file.data]).toEqual([8, 9, 0, 0, 5]);
    const truncate = file.path_open(wasi.OFLAGS_TRUNC, BigInt(0), 0).fd_obj;
    truncate.fd_seek(BigInt(2), wasi.WHENCE_SET);
    truncate.fd_write(new Uint8Array([6]));
    expect([...file.data]).toEqual([0, 0, 6]);
});

it("rejects oversized writes and reservations before allocating more output", () => {
    const file = new OutputFile(16);
    const fd = file.path_open(0, BigInt(0), 0).fd_obj;
    fd.fd_write(new Uint8Array([1]));
    const buffer = file.data.buffer;
    expect(() => fd.fd_pwrite(new Uint8Array(16), BigInt(1))).toThrow(
        "output is too large"
    );
    expect(() => fd.fd_allocate(BigInt(0), BigInt(17))).toThrow(
        "output is too large"
    );
    expect(() => fd.fd_filestat_set_size(BigInt(17))).toThrow(
        "output is too large"
    );
    expect(file.data.buffer).toBe(buffer);
    expect([...file.data]).toEqual([1]);
});
