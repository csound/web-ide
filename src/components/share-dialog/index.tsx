import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { doc, getDoc } from "firebase/firestore";
import Button from "@mui/material/Button";
import ContentCopy from "@mui/icons-material/ContentCopy";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { selectActiveProject } from "../projects/selectors";
import { profiles } from "@root/config/firestore";
import {
    FacebookShareButton,
    FacebookIcon,
    TwitterIcon,
    TwitterShareButton,
    EmailIcon,
    EmailShareButton
} from "react-share";
import { projectShareLinks } from "./embed-code";
import * as styles from "./styles";

const ShareDialog = () => {
    const project = useSelector(selectActiveProject);
    const [author, setAuthor] = useState("");
    const [copyStatus, setCopyStatus] = useState("");

    useEffect(() => {
        let cancelled = false;
        setAuthor("");
        if (project?.userUid) {
            void getDoc(doc(profiles, project.userUid))
                .then((profile) => {
                    if (!cancelled)
                        setAuthor(profile.data()?.displayName || "");
                })
                .catch(() => {});
        }
        return () => {
            cancelled = true;
        };
    }, [project?.userUid]);

    if (!project) return <p>Open a project to share it.</p>;

    const { editorUrl, embedUrl, embedCode } = projectShareLinks(
        window.location.origin,
        project
    );
    const projectInfo = `"${project.name}"${author ? ` by ${author}` : ""}`;
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus("Copied to clipboard.");
        } catch {
            setCopyStatus(
                "Select the text above and copy it with your browser."
            );
        }
    };

    return (
        <div css={styles.dialog}>
            <h3>Share project</h3>
            <label htmlFor="share-project-link">Project link</label>
            <input
                id="share-project-link"
                value={editorUrl}
                readOnly
                onFocus={(event) => event.target.select()}
            />
            <div className="actions">
                <Button
                    startIcon={<ContentCopy />}
                    onClick={() => void copy(editorUrl)}
                >
                    Copy link
                </Button>
            </div>
            <h4>Embed player</h4>
            {project.isPublic ? (
                <>
                    <p>
                        Add this player to a website or blog. It plays the
                        latest saved version of your project.
                    </p>
                    <label htmlFor="share-embed-code">HTML embed code</label>
                    <textarea
                        id="share-embed-code"
                        rows={4}
                        value={embedCode}
                        readOnly
                        onFocus={(event) => event.target.select()}
                    />
                    <div className="actions">
                        <Button
                            startIcon={<ContentCopy />}
                            onClick={() => void copy(embedCode)}
                        >
                            Copy embed code
                        </Button>
                        <Button
                            component="a"
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNew />}
                        >
                            Preview player
                        </Button>
                    </div>
                </>
            ) : (
                <p>
                    Make this project public to embed it. Private projects are
                    only visible to their owner.
                </p>
            )}
            <p className="copy-status" role="status">
                {copyStatus}
            </p>
            <div className="social">
                <FacebookShareButton
                    url={editorUrl}
                    aria-label="Share on Facebook"
                >
                    <FacebookIcon size={32} round />
                </FacebookShareButton>
                <TwitterShareButton
                    url={editorUrl}
                    title={projectInfo}
                    hashtags={["csound"]}
                    aria-label="Share on X"
                >
                    <TwitterIcon size={32} round />
                </TwitterShareButton>
                <EmailShareButton
                    url={editorUrl}
                    subject={"Csound: " + projectInfo}
                    body={projectInfo}
                    separator=" "
                    aria-label="Share by email"
                >
                    <EmailIcon size={32} round />
                </EmailShareButton>
            </div>
        </div>
    );
};

export default ShareDialog;
