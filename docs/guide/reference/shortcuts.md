# Keyboard shortcuts

Keep common editing and playback commands close at hand.

## Files and playback

On macOS, Command is the main shortcut modifier. Windows and Linux use Ctrl.

| Action          | macOS                               | Windows / Linux |
| --------------- | ----------------------------------- | --------------- |
| New file        | Ctrl+Command+N                      | Ctrl+Alt+N      |
| Add files       | Ctrl+Command+U                      | Ctrl+Alt+U      |
| Save document   | Command+S                           | Ctrl+S          |
| Save all        | Command+Shift+S or Option+Command+S | Ctrl+Shift+S    |
| Run or resume   | Command+R                           | Ctrl+R          |
| Pause or resume | Command+P                           | Ctrl+P          |

## In the source editor

| Action                    | macOS                         | Windows / Linux        |
| ------------------------- | ----------------------------- | ---------------------- |
| Evaluate current line     | Command+E                     | Ctrl+E                 |
| Evaluate current block    | Command+Enter                 | Ctrl+Enter             |
| Open opcode documentation | Ctrl+.                        | Alt+.                  |
| Toggle comment            | Command+; or Option+Command+; | Ctrl+; or Ctrl+Shift+; |
| Plot table at cursor      | Option+Enter                  | Alt+Enter              |

Evaluation needs a running Csound performance. A table plot needs a supported definition. When a browser or operating system takes a shortcut, use the corresponding page control instead.

## Find and edit

Click in an editor, then press Command+F on macOS or Ctrl+F on Windows and Linux. Find searches that file, even when several editors are open. The panel includes replace, regular expressions, case matching, and whole-word search. Read-only tool output supports Find without replace.

Press Enter in the Find field for the next match, or Shift+Enter for the previous match. Escape closes the panel and returns focus to the editor. Replace all is one undo step. With focus outside an editor, the browser keeps its own Find shortcut.

| Action                                  | macOS                       | Windows / Linux          |
| --------------------------------------- | --------------------------- | ------------------------ |
| Find and replace                        | Command+F                   | Ctrl+F                   |
| Next match                              | Command+G or F3             | Ctrl+G or F3             |
| Previous match                          | Command+Shift+G or Shift+F3 | Ctrl+Shift+G or Shift+F3 |
| Select next occurrence                  | Command+D                   | Ctrl+D                   |
| Select all occurrences of selected text | Command+Shift+L             | Ctrl+Shift+L             |
| Go to line                              | Command+Option+G            | Ctrl+Alt+G               |

The source editor also supports these commands:

| Action                                | macOS                          | Windows / Linux                |
| ------------------------------------- | ------------------------------ | ------------------------------ |
| Fold / unfold code at cursor          | Command+Option+[ / ]           | Ctrl+Shift+[ / ]               |
| Fold / unfold all code                | Ctrl+Alt+[ / ]                 | Ctrl+Alt+[ / ]                 |
| Open error list                       | Command+Shift+M                | Ctrl+Shift+M                   |
| Next error or warning                 | F8                             | F8                             |
| Delete both brackets of an empty pair | Backspace between the brackets | Backspace between the brackets |

Folding follows the file's language. Error shortcuts use messages already reported by Csound or the background checker.

## Plot windows and piano

Escape closes the focused table plot. With several plots, focus returns through the windows you used.

In the [Virtual MIDI Keyboard](../tools/midi-keyboard.md), Z lowers the octave and X raises it. Piano shortcuts stay out of source editors and text inputs.
