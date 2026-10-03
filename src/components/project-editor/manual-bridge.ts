type SendMessage = (message: Record<string, unknown>) => void;

/** Keep the latest lookup until the current iframe document accepts it. */
export class ManualBridge {
    private documentId?: string;
    private sequence = 0;
    private pending?: { requestId: number; token: string };

    /** Send only through the owner's origin-checked iframe window. */
    constructor(private send: SendMessage) {}

    /** Report whether a document has completed the ready handshake. */
    get isReady() {
        return this.documentId !== undefined;
    }

    /** Reconnect after a load, including pages restored from browser history. */
    connect() {
        this.documentId = undefined;
        this.send({ type: "csound-manual:connect" });
    }

    /** Replace older requests without dropping an unacknowledged lookup. */
    lookup(token?: string) {
        this.pending = token
            ? { requestId: ++this.sequence, token }
            : undefined;
        this.flush();
    }

    /** Handle trusted-window messages; return true when a theme can be sent. */
    receive(message: unknown) {
        if (!message || typeof message !== "object") return false;
        const data = message as Record<string, unknown>;
        if (typeof data.documentId !== "string" || !data.documentId)
            return false;
        if (data.type === "csound-manual:ready") {
            this.documentId = data.documentId;
            this.flush();
            return true;
        }
        if (data.documentId !== this.documentId) return false;
        if (data.type === "csound-manual:accepted") {
            if (data.requestId === this.pending?.requestId)
                this.pending = undefined;
            if (data.navigating === true) this.documentId = undefined;
        } else if (data.type === "csound-manual:navigating") {
            this.documentId = undefined;
        }
        return false;
    }

    /** A send is provisional: only a matching acceptance clears the queue. */
    private flush() {
        if (this.documentId && this.pending)
            this.send({
                type: "csound-manual:lookup",
                documentId: this.documentId,
                ...this.pending
            });
    }
}
