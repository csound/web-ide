import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectActiveProject } from "../projects/selectors";
import { IProfile } from "@comp/profile/types";
import { profiles } from "@root/config/firestore";
import {
    FacebookShareButton,
    FacebookIcon,
    TwitterIcon,
    TwitterShareButton,
    EmailIcon,
    EmailShareButton
} from "react-share";

const ShareDialog = (): React.ReactElement => {
    const project = useSelector(selectActiveProject);
    const [profile, setProfile]: [
        IProfile | undefined,
        (profile: IProfile) => void
    ] = useState();
    const [error, setError] = useState(false);

    useEffect(() => {
        (async () => {
            if (!error && !profile && project) {
                const p = await profiles.doc(project.userUid).get();
                if (p.exists) {
                    setProfile(p.data() as IProfile);
                } else {
                    setError(true);
                }
            }
        })();
    }, [profile, project, error]);

    if (error || !project) {
        return <div>Error: Please contact the site maintainers.</div>;
    }

    if (!project || !profile) {
        return <div>Error: Please contact the site maintainers.</div>;
    }

    const projectInfo = `"${project.name}" by ${profile.displayName}`;

    return (
        <div>
            <h3>Share</h3>
            <div>
                <FacebookShareButton
                    url={window.location.href}
                    quote={projectInfo}
                >
                    <FacebookIcon />
                </FacebookShareButton>
                <TwitterShareButton
                    url={window.location.href}
                    title={projectInfo}
                    hashtags={["csound"]}
                >
                    <TwitterIcon />
                </TwitterShareButton>
                <EmailShareButton
                    url={window.location.href}
                    subject={"Csound: " + projectInfo}
                    body={projectInfo}
                    separator=" "
                    onClick={(_, link: string) => {
                        window.open(link, "_blank");
                    }}
                >
                    <EmailIcon />
                </EmailShareButton>
            </div>
        </div>
    );
};

export default ShareDialog;
