# README and project notes

Give visitors the instructions, artwork, and context they need before they press Play.

## What opens first

A file named exactly **README.md** opens first for visitors to your project, including signed-in users who are not its owner. The editor does this once per visit and keeps their other tabs. For you, as the owner, it keeps your chosen workspace.

Put README.md at the top of the file tree. The editor prefers that file over a README.md inside a folder. Without a README, the editor keeps its usual tab selection.

## Write and preview

Create README.md as a text file. Use the tab's **Edit Markdown** control to write it, then **Preview Markdown** to check the result. Save the file when you want visitors to see the update.

Headings, lists, links, fenced code blocks, and tables work in preview. Images need a reachable URL, such as an HTTPS image you host. A relative image path does not look up a file in the project's virtual filesystem.

## A starting point

Copy this and replace the details with your own. Keep the playback instructions near the top.

```markdown
# Window study

A short piece for a soft synth and live keyboard.

## Before you play

Turn the volume down, select main.csd as the run target,
and press Play. Use a MIDI keyboard or the virtual keyboard.

## Controls

| Control   | What it changes   |
| --------- | ----------------- |
| Mod wheel | Filter brightness |
| Low notes | Bass voice        |

## About the piece

Describe the idea, credit samples, and link to related work.

[Csound project notes](https://csound.com/)
```

To add cover art, use `![Describe the cover](https://example.org/cover.jpg)` with your own image URL. The description also helps people who cannot see the image.

## What to include

Name the file to run, the expected length, and how to stop a piece that runs indefinitely. Say if it needs live input. Mention loud starts or feedback before the listener begins, and give credits and license terms for any shared samples.

The README is a normal tab, not a confirmation dialog. A visitor can move straight to the code. See [Files and saving](filesystem.md) for the difference between saved source and local output files.
