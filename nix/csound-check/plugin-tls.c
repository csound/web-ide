/* Browser beta41 rejects a zero TLS alignment, even when TLS size is zero.
 * Retain one byte so LLVM emits valid alignment for these otherwise TLS-free
 * metadata plugins. Each engine thread gets its own slot. */
static _Thread_local unsigned char ide_tls_anchor __attribute__((used, retain));
