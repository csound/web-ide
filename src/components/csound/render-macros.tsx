import { TextField } from "@mui/material";
import { FieldLabel } from "./render-field";
import type { RenderSettings } from "./render-settings";

export function RenderMacros({
    settings,
    onSettings
}: {
    settings: RenderSettings;
    onSettings: React.Dispatch<React.SetStateAction<RenderSettings>>;
}) {
    return (
        <details>
            <summary>Macros</summary>
            <div className="advanced-body">
                <p>
                    One <code>NAME: value</code> per line, without spaces in the
                    value. Applies to all selected tracks.
                </p>
                <div className="fields">
                    <div>
                        <FieldLabel
                            id="render-omacros"
                            label="Orchestra macros"
                            help="Defines $NAME in the orchestra before compilation, like --omacro:NAME=value. The program must use the macro for it to affect the sound."
                        />
                        <TextField
                            id="render-omacros"
                            multiline
                            minRows={3}
                            maxRows={8}
                            fullWidth
                            size="small"
                            placeholder="FREQ: 440"
                            value={settings.orchestraMacros ?? ""}
                            onChange={(event) =>
                                onSettings((previous) => ({
                                    ...previous,
                                    orchestraMacros: event.target.value
                                }))
                            }
                        />
                    </div>
                    <div>
                        <FieldLabel
                            id="render-smacros"
                            label="Score macros"
                            help="Defines $NAME in the score before sorting, like --smacro:NAME=value. Useful for tempo, duration, and other values referenced by score macros."
                        />
                        <TextField
                            id="render-smacros"
                            multiline
                            minRows={3}
                            maxRows={8}
                            fullWidth
                            size="small"
                            placeholder="TEMPO: 120"
                            value={settings.scoreMacros ?? ""}
                            onChange={(event) =>
                                onSettings((previous) => ({
                                    ...previous,
                                    scoreMacros: event.target.value
                                }))
                            }
                        />
                    </div>
                </div>
            </div>
        </details>
    );
}
