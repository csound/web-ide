import { File, OpenFile } from "@bjorn3/browser_wasi_shim";

export const MAX_TOOL_OUTPUT_BYTES = 128 * 1024 * 1024;

/** Grow output capacity geometrically, rather than copying the whole file on each WASI write. */
export class OutputFile extends File {
    private storage = new Uint8Array(0);

    constructor(private limit = MAX_TOOL_OUTPUT_BYTES) {
        super([]);
    }

    /** Preserve truncation and append semantics from the WASI filesystem. */
    path_open(oflags: number, rights: bigint, flags: number) {
        const opened = super.path_open(oflags, rights, flags);
        const fd = new OutputDescriptor(this);
        fd.file_pos = opened.fd_obj.file_pos;
        return { ret: opened.ret, fd_obj: fd };
    }

    /** Reject excessive output before allocating and zero any newly exposed gap. */
    resize(length: number) {
        if (!Number.isSafeInteger(length) || length < 0 || length > this.limit)
            throw new Error(
                "The tool output is too large. Trim a shorter sample or reduce analysis detail."
            );
        if (length > this.storage.length) {
            const next = new Uint8Array(
                Math.min(
                    this.limit,
                    Math.max(length, this.storage.length * 2, 65536)
                )
            );
            next.set(this.data);
            this.storage = next;
        }
        if (length > this.data.length)
            this.storage.fill(0, this.data.length, length);
        this.data = this.storage.subarray(0, length);
    }
}

/** Keep seeking and reads from the shim while using bounded, reusable output storage. */
class OutputDescriptor extends OpenFile {
    constructor(private output: OutputFile) {
        super(output);
    }

    /** Write at the cursor, then advance it by the bytes written. */
    fd_write(data: Uint8Array) {
        const result = this.fd_pwrite(data, this.file_pos);
        this.file_pos += BigInt(result.nwritten);
        return result;
    }

    /** Write at an explicit offset without changing the cursor. */
    fd_pwrite(data: Uint8Array, offset: bigint) {
        if (!data.length) return { ret: 0, nwritten: 0 };
        const position = Number(offset);
        if (!Number.isSafeInteger(position) || position < 0)
            throw new Error("Invalid tool output offset.");
        this.output.resize(
            Math.max(this.output.data.length, position + data.length)
        );
        this.output.data.set(data, position);
        return { ret: 0, nwritten: data.length };
    }

    /** Grow or truncate the file while retaining its backing capacity. */
    fd_filestat_set_size(size: bigint) {
        this.output.resize(Number(size));
        return 0;
    }

    /** Reserve a file extent without shrinking existing output. */
    fd_allocate(offset: bigint, length: bigint) {
        if (offset < BigInt(0) || length < BigInt(0))
            throw new Error("Invalid tool output extent.");
        this.output.resize(
            Math.max(this.output.data.length, Number(offset + length))
        );
        return 0;
    }
}
