import React, { useMemo, useState } from "react";
import { useDispatch } from "@root/store";
import Tooltip from "@mui/material/Tooltip";
import SVGPaths from "@elem/svg-icons";
import ProjectAvatar from "@elem/project-avatar";
import { SliderPicker } from "react-color";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { TextField, Button, Popover, Grid } from "@mui/material";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import IconButton from "@mui/material/IconButton";
import ReactAutosuggestExample from "./tag-auto-suggest";
import { isEmpty } from "ramda";
import {
    addUserProject,
    editUserProject,
    PROJECT_STARTER_TEMPLATE_OPTIONS,
    ProjectStarterTemplate
} from "./actions";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";
import { closeModal } from "../modal/actions";

const avatarContainer = css`
    width: 88px;
    height: 88px;
    padding: 16px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgb(0 0 0 / 10%);
    border: 1px solid rgb(255 255 255 / 10%);

    .project-avatar {
        position: relative;
        border-radius: 50%;
        transform: scale(1.15);
    }
`;

const ModalContainer = styled.div`
    width: min(520px, calc(100vw - 24px));
    display: flex;
    flex-direction: column;
    gap: 16px;

    @media (max-width: 760px) {
        width: calc(100vw - 24px);
        gap: 14px;
    }
`;

const HeaderBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const HeaderEyebrow = styled.span`
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.68;
`;

const HeaderTitle = styled.h2`
    margin: 0;
    line-height: 1.15;
    font-size: 28px;

    @media (max-width: 760px) {
        font-size: 24px;
    }
`;

const HeaderBody = styled.p`
    margin: 0;
    line-height: 1.5;
    opacity: 0.82;
    font-size: 14px;
`;

const StepRail = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
`;

const StepCard = styled.button<{ active: boolean; complete: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid
        ${(properties) =>
            properties.active
                ? "rgb(255 255 255 / 24%)"
                : properties.complete
                  ? "rgb(255 255 255 / 12%)"
                  : "rgb(255 255 255 / 8%)"};
    background: ${(properties) =>
        properties.active ? "rgb(255 255 255 / 8%)" : "rgb(0 0 0 / 7%)"};
    color: inherit;
    text-align: left;
    cursor: pointer;

    &:disabled {
        cursor: default;
        opacity: 1;
    }
`;

const StepIndex = styled.span`
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.66;
`;

const StepLabel = styled.span`
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
`;

const Section = styled.section`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: 14px;
    background: rgb(0 0 0 / 7%);
    border: 1px solid rgb(255 255 255 / 8%);
`;

const SectionTitle = styled.h3`
    margin: 0;
    font-size: 15px;
`;

const SectionCaption = styled.p`
    margin: 0;
    line-height: 1.45;
    font-size: 13px;
    opacity: 0.76;
`;

const FieldStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const fieldSx = {
    "& .MuiFormHelperText-root": {
        color: "rgb(224 230 247 / 78%)",
        marginLeft: 0,
        marginRight: 0
    },
    "& .MuiInputLabel-root": {
        color: "rgb(224 230 247 / 84%)"
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "rgb(248 250 255 / 92%)"
    }
};

const StarterTemplateContainer = styled.div`
    display: grid;
    gap: 8px;

    .MuiFormControlLabel-root {
        align-items: flex-start;
        margin: 0;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgb(0 0 0 / 7%);
        border: 1px solid transparent;
        transition:
            border-color 120ms ease,
            background-color 120ms ease;
    }

    .MuiFormControlLabel-root.selected {
        border-color: rgb(255 255 255 / 24%);
        background: rgb(255 255 255 / 6%);
    }

    .MuiFormControlLabel-label {
        display: grid;
        gap: 3px;
    }
`;

const TemplateDescription = styled.span`
    opacity: 0.76;
    font-size: 12px;
    line-height: 1.4;
`;

const TemplateGuide = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: 12px;
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 6%);
`;

const TemplateGuideTitle = styled.span`
    font-size: 13px;
    font-weight: 700;
`;

const TemplateGuideLine = styled.span`
    font-size: 12px;
    line-height: 1.45;
    opacity: 0.76;
`;

const IconPickerContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @media (min-width: 760px) {
        grid-template-columns: 110px minmax(0, 1fr) 130px;
        align-items: center;
    }
`;

const AvatarPreviewCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    text-align: center;
`;

const AvatarPreviewHint = styled.span`
    font-size: 12px;
    opacity: 0.76;
    line-height: 1.4;
`;

const StyledSketchPicker = styled(SliderPicker)`
    width: 100% !important;
    max-width: 100%;
`;

const RadioGroupContainer = styled.div`
    display: flex;
    align-items: center;

    .MuiRadioGroup-root {
        width: 100%;
    }

    .MuiFormControlLabel-root {
        margin-left: 0;
        margin-right: 0;
    }
`;

const PopoverContainer = styled.div`
    padding: 10px;
    width: 300px;
    height: 400px;

    @media (max-width: 760px) {
        width: min(300px, calc(100vw - 40px));
        height: min(380px, calc(100vh - 120px));
        overflow-y: auto;
    }
`;

const FooterActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (min-width: 760px) {
        flex-direction: row;
        justify-content: space-between;
    }
`;

const FooterLeadingActions = styled.div`
    display: flex;
    gap: 10px;
    flex-direction: column;

    @media (min-width: 760px) {
        flex-direction: row;
    }
`;

type WizardStep = 0 | 1 | 2;

interface IProjectModal {
    name: string;
    description: string;
    label: string;
    projectID: string;
    iconForegroundColor: string | undefined;
    iconBackgroundColor: string | undefined;
    iconName: string | undefined;
    newProject: boolean;
    starterTemplate?: ProjectStarterTemplate;
}

const templateGuides: Record<
    ProjectStarterTemplate,
    { title: string; lines: string[] }
> = {
    "single-csd": {
        title: "Best for quick starts",
        lines: [
            "One self-contained file.",
            "Good for teaching, sketching, and fast edits.",
            "Opens with a ready-to-play Csound 7 example."
        ]
    },
    "split-csd": {
        title: "Best for structured projects",
        lines: [
            "Keeps wrapper, orchestra, and score separate.",
            "Still starts from the same new default example.",
            "Useful when you want students to compare roles of each file."
        ]
    },
    empty: {
        title: "Best for blank starts",
        lines: [
            "Creates an empty project.csd.",
            "No starter notes or comments.",
            "Useful when you already know the structure you want."
        ]
    }
};

export const ProjectModal = (properties: IProjectModal) => {
    const dispatch = useDispatch();
    const [name, setName] = useState(properties.name);
    const [description, setDescription] = useState(properties.description);
    const [iconName, setIconName] = useState(properties.iconName);
    const [foregroundColor, setIsForegroundColor] = useState(false);
    const [iconForegroundColor, setIconForegroundColor] = useState(
        properties.iconForegroundColor || "#fff"
    );
    const [iconBackgroundColor, setIconBackgroundColor] = useState(
        properties.iconBackgroundColor || "#000"
    );
    const [starterTemplate, setStarterTemplate] =
        useState<ProjectStarterTemplate>(
            properties.starterTemplate || "single-csd"
        );
    const [popupState, setPopupState] = useState(false);
    const [anchorElement, setAnchorElement] = useState(
        null as HTMLSpanElement | null
    );
    const [modifiedTags, setModifiedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<WizardStep>(0);

    const shouldDisable = isEmpty(name.trim()) || isSubmitting;
    const isWizard = properties.newProject;

    const activeTemplateGuide = useMemo(
        () => templateGuides[starterTemplate],
        [starterTemplate]
    );

    const handleOnSubmit = async () => {
        if (shouldDisable) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (properties.newProject) {
                await dispatch(
                    addUserProject(
                        name.trim(),
                        description,
                        modifiedTags,
                        properties.projectID,
                        iconName || "default",
                        iconForegroundColor || "#000000",
                        iconBackgroundColor || "#FFF",
                        starterTemplate
                    ) as any
                );
            } else {
                await dispatch(
                    editUserProject(
                        name.trim(),
                        description,
                        modifiedTags,
                        properties.projectID,
                        iconName || "default",
                        iconForegroundColor || "#000000",
                        iconBackgroundColor || "#FFF"
                    ) as any
                );
                dispatch(closeModal());
            }
        } catch (error) {
            dispatch(
                openSnackbar(
                    "Could not create project: " + error,
                    SnackbarType.Error
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfileDropDown = (
        event: React.MouseEvent<HTMLSpanElement>
    ) => {
        event.preventDefault();
        setPopupState(!popupState);
        setAnchorElement(event.currentTarget as HTMLSpanElement);
    };

    const handlePopoverClose = () => {
        setPopupState(false);
    };

    const stepMeta = [
        { label: "Project details" },
        { label: "Starter template" },
        { label: "Visual identity" }
    ] as const;

    const goToStep = (nextStep: WizardStep) => {
        if (!isWizard) {
            return;
        }
        setStep(nextStep);
    };

    return (
        <ModalContainer>
            <HeaderBlock>
                <HeaderEyebrow>
                    {properties.newProject ? "New Project" : "Project Settings"}
                </HeaderEyebrow>
                <HeaderTitle>
                    {properties.newProject
                        ? "Create a project"
                        : `Edit ${name || "project"}`}
                </HeaderTitle>
                <HeaderBody>
                    {properties.newProject
                        ? "Set up the project in three short steps, then jump into the editor."
                        : "Update the name, description, tags, and icon for this project."}
                </HeaderBody>
            </HeaderBlock>

            {isWizard && (
                <StepRail>
                    {stepMeta.map((item, index) => (
                        <StepCard
                            key={item.label}
                            type="button"
                            active={step === index}
                            complete={step > index}
                            onClick={() => goToStep(index as WizardStep)}
                        >
                            <StepIndex>{`Step ${index + 1}`}</StepIndex>
                            <StepLabel>{item.label}</StepLabel>
                        </StepCard>
                    ))}
                </StepRail>
            )}

            {(!isWizard || step === 0) && (
                <Section>
                    <SectionTitle>Project details</SectionTitle>
                    <SectionCaption>Start with the basics.</SectionCaption>
                    <FieldStack>
                        <TextField
                            label="Project name"
                            error={isEmpty(name.trim())}
                            helperText={
                                isEmpty(name.trim())
                                    ? "Project name is required."
                                    : undefined
                            }
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                            fullWidth
                            sx={fieldSx}
                        />
                        <TextField
                            label="Description"
                            value={description}
                            multiline
                            minRows={3}
                            onChange={(event) => {
                                setDescription(event.target.value);
                            }}
                            fullWidth
                            sx={fieldSx}
                        />
                        <ReactAutosuggestExample
                            projectUid={properties.projectID}
                            modifiedTags={modifiedTags}
                            setModifiedTags={setModifiedTags}
                            fullWidth
                            label="Tags"
                        />
                    </FieldStack>
                </Section>
            )}

            {properties.newProject && step === 1 && (
                <Section>
                    <SectionTitle>Starter template</SectionTitle>
                    <SectionCaption>
                        Choose the file structure before opening the editor.
                    </SectionCaption>
                    <StarterTemplateContainer>
                        <RadioGroup
                            name="project-starter-template"
                            value={starterTemplate}
                            onChange={(event) => {
                                setStarterTemplate(
                                    event.target.value as ProjectStarterTemplate
                                );
                            }}
                        >
                            {PROJECT_STARTER_TEMPLATE_OPTIONS.map((option) => (
                                <FormControlLabel
                                    key={option.value}
                                    className={
                                        starterTemplate === option.value
                                            ? "selected"
                                            : ""
                                    }
                                    value={option.value}
                                    control={<Radio />}
                                    label={
                                        <>
                                            <span>{option.label}</span>
                                            <TemplateDescription>
                                                {option.description}
                                            </TemplateDescription>
                                        </>
                                    }
                                />
                            ))}
                        </RadioGroup>
                    </StarterTemplateContainer>
                    <TemplateGuide>
                        <TemplateGuideTitle>
                            {activeTemplateGuide.title}
                        </TemplateGuideTitle>
                        {activeTemplateGuide.lines.map((line) => (
                            <TemplateGuideLine key={line}>
                                {line}
                            </TemplateGuideLine>
                        ))}
                    </TemplateGuide>
                </Section>
            )}

            {(!isWizard || step === 2) && (
                <Section>
                    <SectionTitle>Visual identity</SectionTitle>
                    <SectionCaption>
                        Choose an icon and colors that are easy to recognize.
                    </SectionCaption>
                    <IconPickerContainer>
                        <AvatarPreviewCard>
                            <Tooltip title="Choose an icon for your project">
                                <span
                                    css={avatarContainer}
                                    onClick={handleProfileDropDown}
                                >
                                    <ProjectAvatar
                                        iconName={iconName}
                                        iconBackgroundColor={
                                            iconBackgroundColor
                                        }
                                        iconForegroundColor={
                                            iconForegroundColor
                                        }
                                    />
                                </span>
                            </Tooltip>
                            <AvatarPreviewHint>
                                Tap the avatar to browse icons.
                            </AvatarPreviewHint>
                        </AvatarPreviewCard>

                        <Popover
                            open={popupState}
                            anchorEl={anchorElement}
                            className="popover_class"
                            anchorOrigin={{
                                horizontal: "center",
                                vertical: "top"
                            }}
                            transformOrigin={{
                                vertical: "bottom",
                                horizontal: "center"
                            }}
                            onClose={handlePopoverClose}
                        >
                            <PopoverContainer>
                                <Grid container spacing={1}>
                                    {Array.isArray(Object.entries(SVGPaths)) &&
                                        Object.entries(SVGPaths).map(
                                            (entry, index) => {
                                                const SvgElem: any =
                                                    entry[1] as any;

                                                return (
                                                    <Grid
                                                        item
                                                        xs={6}
                                                        sm={3}
                                                        key={index}
                                                    >
                                                        <IconButton
                                                            aria-label="select icon"
                                                            onClick={() => {
                                                                setIconName(
                                                                    entry[0]
                                                                );
                                                                handlePopoverClose();
                                                            }}
                                                        >
                                                            <SvgElem
                                                                alt={entry[0]}
                                                                width={40}
                                                                height={40}
                                                            />
                                                        </IconButton>
                                                    </Grid>
                                                );
                                            }
                                        )}
                                </Grid>
                            </PopoverContainer>
                        </Popover>

                        <StyledSketchPicker
                            color={
                                foregroundColor
                                    ? iconForegroundColor
                                    : iconBackgroundColor
                            }
                            onChangeComplete={(event: { hex: string }) => {
                                if (foregroundColor) {
                                    setIconForegroundColor(event.hex);
                                } else {
                                    setIconBackgroundColor(event.hex);
                                }
                            }}
                        />

                        <RadioGroupContainer>
                            <RadioGroup
                                name="project-icon-color-channel"
                                value={
                                    foregroundColor
                                        ? "foreground"
                                        : "background"
                                }
                                onChange={(event) => {
                                    setIsForegroundColor(
                                        event.target.value === "foreground"
                                    );
                                }}
                            >
                                <FormControlLabel
                                    value="foreground"
                                    control={<Radio />}
                                    label="Edit foreground"
                                />
                                <FormControlLabel
                                    value="background"
                                    control={<Radio />}
                                    label="Edit background"
                                />
                            </RadioGroup>
                        </RadioGroupContainer>
                    </IconPickerContainer>
                </Section>
            )}

            <FooterActions>
                <FooterLeadingActions>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={() => dispatch(closeModal())}
                        fullWidth
                    >
                        Cancel
                    </Button>
                    {isWizard && step > 0 && (
                        <Button
                            variant="text"
                            color="inherit"
                            onClick={() => setStep((step - 1) as WizardStep)}
                            fullWidth
                        >
                            Back
                        </Button>
                    )}
                </FooterLeadingActions>
                {isWizard && step < 2 ? (
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={step === 0 && isEmpty(name.trim())}
                        onClick={() => setStep((step + 1) as WizardStep)}
                        fullWidth
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={shouldDisable}
                        onClick={handleOnSubmit}
                        fullWidth
                    >
                        {isSubmitting
                            ? properties.newProject
                                ? "Creating..."
                                : "Saving..."
                            : properties.label}
                    </Button>
                )}
            </FooterActions>
        </ModalContainer>
    );
};
