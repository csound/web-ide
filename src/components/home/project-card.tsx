import React from "react";
import Loader from "react-loader-spinner";
import { Theme } from "@emotion/react";
import ProjectAvatar from "@elem/project-avatar";
import ListPlayButton from "@comp/profile/list-play-button";
import { IProject } from "@comp/projects/types";
import { IProfile } from "@comp/profile/types";
import {
    ProjectCardContainer,
    ProjectCardContentContainer,
    ProjectCardContentTop,
    ProjectCardContentBottom,
    ProjectCardContentTopHeader,
    ProjectCardContentTopDescription,
    ProjectCardContentMiddle,
    ProjectCardContentBottomPhoto,
    ProjectCardContentBottomHeader,
    ProjectCardContentBottomDescription,
    Photo,
    ProjectCardContentBottomID
} from "./home-ui";
import * as SS from "./styles";

export const ProjectCardSkeleton = ({
    theme
}: {
    theme: Theme;
}): React.ReactElement => (
    <div css={SS.cardLoderSkeleton}>
        <span className="skeleton-photo" />
        <span className="skeleton-name" />
        <span className="skeleton-description" />
        <Loader
            type="Bars"
            color={theme.altTextColor}
            height={100}
            width={100}
        />
    </div>
);

const ProjectCard = ({
    projectIndex,
    profile,
    project
}: {
    projectIndex: number;
    profile: IProfile;
    project: IProject;
}): React.ReactElement => {
    return (
        <ProjectCardContainer duration={200} projectIndex={projectIndex}>
            <div css={SS.cardBackground}>
                <ProjectAvatar project={project} />
            </div>
            <ProjectCardContentContainer duration={200}>
                <ProjectCardContentTop to={`editor/${project.projectUid}`}>
                    <ProjectCardContentTopHeader>
                        {project.name}
                    </ProjectCardContentTopHeader>
                    <ProjectCardContentTopDescription>
                        {project.description}
                    </ProjectCardContentTopDescription>
                </ProjectCardContentTop>
                <ProjectCardContentMiddle>
                    <ListPlayButton project={project} />
                </ProjectCardContentMiddle>
                <ProjectCardContentBottom to={`profile/${profile.username}`}>
                    <ProjectCardContentBottomPhoto>
                        {profile.photoUrl && <Photo src={profile.photoUrl} />}
                    </ProjectCardContentBottomPhoto>
                    <ProjectCardContentBottomID>
                        <ProjectCardContentBottomHeader>
                            {profile.displayName || profile.username}
                        </ProjectCardContentBottomHeader>
                        <ProjectCardContentBottomDescription>
                            {profile.bio}
                        </ProjectCardContentBottomDescription>
                    </ProjectCardContentBottomID>
                </ProjectCardContentBottom>
            </ProjectCardContentContainer>
        </ProjectCardContainer>
    );
};

export default ProjectCard;
