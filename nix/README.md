# Optional Csound tools

```sh
npm run checker:build
npm run test:ci -- src/components/editor/validation
npm start
```

The build pins Csound and nixpkgs. It needs Nix; without Nix the build command
prints a skip message. Add `-- --required` to fail instead, as CI does. A build
failure with Nix installed always fails. Tests that need the binary skip when
`.wasm-build/csound-check.wasm` is absent. The editor then uses its usual syntax
highlighting and completion without background compiler checks.

Restart Vite after building. Vite includes the file under a content-hashed URL
only when it exists. The worker loads it on demand after a 2.5-second pause.

`csound-check/` supplies a custom entry point and CMake target. The build extracts
opcode signatures from the same Csound source, then links the parser with a
small host. This checker never compiles or performs an orchestra, loads executable
plugins, or runs score preprocessors. All Csound changes stay in this build directory;
the upstream checkout remains untouched. Csound source retains its LGPL license.

The first version checks orchestra sections in `.csd` and `.orc` files, with
project text files available for includes. It does not validate scores or run
CsOptions. It accepts signature metadata for custom opcode plugins. Checks time
out after five seconds and have a 64 MiB WASM memory limit; a failed optional
checker cannot stop editing.

Playback shares compiler errors for both CSD and ORC targets. Errors in included
files remain available when their editor opens later, but only when its text
still matches the checked source. This cache holds at most 128 documents and
4 MiB of source text (counting UTF-16 storage), and clears when the project closes.
A missing `</CsInstruments>` gets a debounced error without running the checker
or replacing the last known symbols.

The local `csound-check/editor-parser.patch` captures UDO headers during the
same parse used for diagnostics. It recovers at statement and definition
boundaries, so a bad body or missing `endop` need not hide the next declaration.
Recovery stops after 20 syntax errors. Invalid code still fails validation;
recovered trees never reach semantic checks or compilation.

The worker returns UDO names, parameter types and names, return types, and source
locations, including active nested includes and macro expansions. CodeMirror
shares this result between completion, highlighting and synopsis. Each successful
check replaces the confirmed declarations, including removals and renames.
Failed checks can update reachable headers, but preserve all confirmed names
until the next successful check. Partial headers never become confirmed merely
because a later failed check could not reach them. Old responses cannot
overwrite newer edits. There is no second source scan for these features once
the WASM result is available.

Incomplete headers are omitted. An unfinished string, comment or preprocessor
directive can still prevent recovery of later declarations. The worker returns
only the headers it reached; the editor keeps the last confirmed set separately.
Recovered UDO signatures do not prove that their bodies passed type checking.
The metadata stream is capped at 1 MiB and 2,048 declarations. A capped list
cannot replace the confirmed set, even when validation succeeds.

The same lexer pass also collects explicit function calls, such as
`osciliii(0.1, )`. A name check can mark the unknown opcode alongside the missing
argument without running semantic checks on a recovered tree. It uses the
build's opcode table, current declarations and the editor's confirmed UDO names.
Bare identifiers count as possible variables, opcode references or constructors;
this check makes no claims about their scope or types. Comments, strings and
inactive preprocessor branches do not contribute calls.

The extra check keeps at most 256 call candidates and 8,192 distinct identifiers.
It skips name errors if lexing stops early or the identifier set reaches its cap.
Calls need a matching source token; uncertain macro locations and member calls
are omitted. The combined diagnostic list remains capped at 20. All this work
runs in the existing worker after the same typing pause.

For CSD files with `--opcode-lib` in CsOptions, a separate worker loads the
requested project binaries with the installed `@csound/browser` runtime. It
reads the opcode registrations and type registry, then exits. Plugin setup code
runs during this step; user orchestra code and audio never run. The reader uses
the filesystem plugin loader after Csound creates its type pool. A fixed empty
parse triggers registration without compiling an orchestra.

The build also supplies `plugin-types.wasm`, a small helper loaded only by this
worker. It reads type names, argument directions, struct members and array
dimensions. Only these descriptors and opcode signatures reach the checker.
The checker supplies its own placeholder variable constructor; it never copies
plugin pointers, constructors, copy functions or destructors. This supports
opaque object types, struct fields, nested types and array members in type
checks. It does not reproduce runtime object behavior or import plugin globals.

The editor uses the signatures for completion, highlighting and synopsis,
including overloads. Named types appear in synopsis and in completion after a
type annotation's colon. Replacing plugin metadata also replaces these type
names. Without the optional helper, opcode signature inspection still works.

Inspection is lazy and runs once per plugin set. The cache uses project file
revisions to avoid repeat downloads, then content hashes and the Csound version
to avoid repeat inspection. It retains metadata for up to eight sets, with one
inspection at a time. Replacing a binary or changing CsOptions replaces the
plugin entries, independent of the last confirmed UDOs. A missing or failed
plugin marks its CsOptions line instead of reporting false unknown opcodes.

Each set may contain up to 16 files totaling 16 MiB and register up to 2,048
signatures. Type inspection allows 256 types and 2,048 members; the combined
metadata is capped at 1 MiB. Inspection times out after eight seconds; file reads
and inspection together have a 20-second limit. Failed revisions wait 30 seconds before retry;
a changed file can retry at once. Neither the binaries nor their runtimes stay
in the cache. Local plugin tests use the C and C++ examples from `@csound/wasm-bin`.
