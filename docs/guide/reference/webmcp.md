# WebMCP

Let a browser agent work with the project you have open.

## Connect an agent

Use a browser and agent that support WebMCP, then open a project in the Web-IDE. The footer shows **WebMCP ready** after the page registers its tools.

Browser support is still changing. Follow the [Chrome WebMCP guide](https://developer.chrome.com/docs/ai/webmcp) for setup and its tool inspector. In builds that offer the testing flag, enable WebMCP and relaunch the browser first.

**WebMCP supported** means the feature is in the app but its tools are not ready in this tab. **WebMCP unavailable** means registration failed. Browsers without WebMCP can still use the editor normally.

## Start with a read

Ask the agent to call `csound_read_workspace` and `csound_read_guide`. These describe the open files, their IDs, the run targets, and the current tool schemas. For example:

> Read project.csd, lower its oscillator frequency by an octave, and play it. Leave the edit unsaved.

The tools work on the open project. They can read and edit source, change selections and tabs, evaluate a region, choose playback targets, play, stop, render, and read console messages.

## Edits and saving

An edit uses the document's current revision. If you change the same source while the agent is working, `stale_revision` tells it to read again. Open editors keep their undo history.

WebMCP playback uses the current source without saving edits. Opening a tab does not select a run target: the agent should pass a document ID or choose a target. Only the signed-in owner can save to the project, and saving a public project's source makes the edit public. Tell the agent when you want a cloud save, then wait for its result.

## Visible typing and evaluation

The selection, scrolling, and typing tools can show the agent's changes in the editor. Positions use zero-based UTF-16 offsets, with range ends excluded. A typing operation stops if its source or selection changes, leaving any partial text unsaved.

Region evaluation needs realtime playback in this project. Select orchestra statements or score events inside their CSD section, without wrapper tags. Evaluation can make sound and cannot undo code already sent to Csound.

## Scope and permissions

The Web-IDE does not choose or contact an AI model. Your browser agent controls what it reads. Source and console text can come from other people, so an agent should treat them as project data rather than instructions.

Audio startup and microphone access may still need a click or a browser permission prompt. Leaving the project removes its registered tools and cancels agent audio work. A cloud save that has already started may still finish.

For exact fields and limits, use the live tool schemas and `csound_read_guide`. The [WebMCP specification](https://webmachinelearning.github.io/webmcp/) describes the browser API.
