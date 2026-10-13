# FTGEN plotting

See the function table behind an ftgen statement or a score f event.

## Open a graph

Hover a table variable such as `giWave` in its definition, then click the underlined name. Later references to a uniquely defined global `gi` table also link to its plot. For a score statement, click the `f` and table-number area. With the cursor on a supported definition, **Alt+Enter** opens its plot too.

```csound
giWave ftgen 0, 0, 1024, 7, 1, 256, -1, 256, 1, 512, 0
```

```csound
f 1 0 8192 10 1
```

The second graph is titled with the table number and GEN routine, such as **f1 GEN10**.

## Read and arrange the plot

The graph shows the generated samples and minimum, maximum, mean, and guard-point values. Guides depend on the GEN routine: segment boundaries help with envelopes, and harmonic amplitudes help with additive waveforms.

Drag the title bar to move a plot. Resize it from the corner, expand it to fill the window, or minimize it while you edit. Escape closes the focused plot, then returns focus through the other plots you used.

## Edit the definition

The plot updates after a short pause in typing. Changing the variable name or table number closes the old plot because its identity changed. Open the new definition to continue.

## What can be previewed

The preview builds static tables without running your orchestra. It supports the expressions and GEN routines its small table engine can evaluate. It cannot evaluate arbitrary instrument code, load samples for file-based GEN routines, or follow score preprocessors.

If a definition cannot be previewed, read the plot's message. If the optional table engine is unavailable, plotting stays disabled and ordinary editing still works.
