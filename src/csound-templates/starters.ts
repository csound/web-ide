import {
    defaultCsd,
    defaultSplitCsd,
    defaultOrc,
    defaultSco,
    emptyCsd
} from "./index";
import midi from "./midi.csd?raw";
import audioInput from "./audio-input.csd?raw";

export type ProjectStarterTemplate =
    "single-csd" | "split-csd" | "midi" | "audio-input" | "empty";

type StarterFile = { name: string; value: string; type: string };
type StarterTemplate = {
    value: ProjectStarterTemplate;
    label: string;
    description: string;
    guide: string;
    files: StarterFile[];
};

export const PROJECT_STARTER_TEMPLATE_OPTIONS: StarterTemplate[] = [
    {
        value: "single-csd",
        label: "Single CSD",
        description: "Instruments and score in one file.",
        guide: "Press Play to hear a short synth phrase. Edit the instrument or its score to make it your own.",
        files: [defaultCsd]
    },
    {
        value: "split-csd",
        label: "CSD + ORC + SCO",
        description: "Separate instrument and score files.",
        guide: "Run project.csd. It includes project.orc for instruments and project.sco for notes.",
        files: [defaultSplitCsd, defaultOrc, defaultSco]
    },
    {
        value: "midi",
        label: "MIDI instrument",
        description: "A synth played from a keyboard.",
        guide: "Press Play, then use the Virtual MIDI Keyboard or a MIDI controller. Allow MIDI access if asked. Press Stop when finished.",
        files: [{ name: "project.csd", value: midi, type: "txt" }]
    },
    {
        value: "audio-input",
        label: "Live audio processing",
        description: "Filter a microphone or audio input.",
        guide: "Use headphones and a low volume. Press Play and allow microphone access. Adjust the filter in the code, then press Stop when finished.",
        files: [{ name: "project.csd", value: audioInput, type: "txt" }]
    },
    {
        value: "empty",
        label: "Empty",
        description: "A blank file for your own Csound code.",
        guide: "Add your own CSD before pressing Play. No instruments or score are included.",
        files: [emptyCsd]
    }
];

export function getStarterTemplate(
    value: ProjectStarterTemplate
): StarterTemplate {
    return (
        PROJECT_STARTER_TEMPLATE_OPTIONS.find(
            (option) => option.value === value
        ) ?? PROJECT_STARTER_TEMPLATE_OPTIONS[0]
    );
}

export function getStarterFiles(
    value: ProjectStarterTemplate,
    userUid: string
) {
    return getStarterTemplate(value).files.map((file) => ({
        ...file,
        userUid,
        path: []
    }));
}
