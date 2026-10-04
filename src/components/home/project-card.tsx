import React from "react";
import { Link } from "react-router";
import { Bars as BarsSpinner } from "react-loader-spinner";
import { Theme } from "@emotion/react";
import ProjectAvatar from "@elem/project-avatar";
import { ListPlayButton } from "@comp/profile/list-play-button";
import { ForkAttribution } from "@comp/projects/fork-attribution";
import { ProjectDates } from "@comp/projects/project-dates";
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
    ProfilePhotoFallback,
    ProjectCardContentBottomID
} from "./home-ui";
import { RandomProjectResponse, PopularProjectResponse } from "./types";
import * as SS from "./styles";
import { ProjectCardTags } from "./project-card-tags";
import { projectTags } from "@comp/projects/tags";

export const ProjectCardSkeleton = ({ theme }: { theme: Theme }) => (
    <div css={SS.cardLoderSkeleton}>
        <span className="skeleton-photo" />
        <span className="skeleton-name" />
        <span className="skeleton-description" />
        <BarsSpinner color={theme.altTextColor} height={100} width={100} />
    </div>
);

export const ProjectCard = ({
    projectIndex,
    profile,
    project
}: {
    projectIndex: number;
    profile: IProfile;
    project: IProject | RandomProjectResponse | PopularProjectResponse;
}) => {
    const hasTags = projectTags(project).length > 0;
    const displayName = profile.displayName || profile.username;
    const fallbackInitial = displayName?.trim().charAt(0).toUpperCase() || "?";

    return (
        <ProjectCardContainer duration={200} projectIndex={projectIndex}>
            <div css={SS.cardBackground}>
                <ProjectAvatar
                    iconName={project.iconName}
                    iconBackgroundColor={project.iconBackgroundColor}
                    iconForegroundColor={project.iconForegroundColor}
                />
            </div>
            <ProjectCardContentContainer duration={200}>
                <ProjectCardContentTop hasTags={hasTags}>
                    <ProjectCardContentTopHeader
                        to={`editor/${project.projectUid}`}
                    >
                        {project.name}
                    </ProjectCardContentTopHeader>
                    <ProjectDates
                        project={project}
                        onCard
                        css={{
                            gridRow: 1,
                            gridColumn: 2,
                            justifySelf: "end",
                            alignSelf: "start"
                        }}
                    />
                    {project.description && (
                        <ProjectCardContentTopDescription
                            css={{ gridColumn: hasTags ? "1" : "1 / -1" }}
                            to={`editor/${project.projectUid}`}
                        >
                            {project.description}
                        </ProjectCardContentTopDescription>
                    )}
                    <ProjectCardTags tags={project.tags} />
                    <ForkAttribution
                        forkedFrom={project.forkedFrom}
                        forkedAt={project.forkedAt}
                        css={{
                            gridRow: 3,
                            gridColumn: "1 / -1",
                            justifySelf: "start",
                            color: "#f3f4f6",
                            backgroundColor: "rgba(12,16,20,0.65)",
                            padding: "2px 6px",
                            borderRadius: 4
                        }}
                    />
                </ProjectCardContentTop>
                <ProjectCardContentMiddle>
                    <ListPlayButton
                        projectUid={project.projectUid}
                        projectName={project.name}
                        iconName={project.iconName}
                        iconBackgroundColor={project.iconBackgroundColor}
                        iconForegroundColor={project.iconForegroundColor}
                    />
                </ProjectCardContentMiddle>
                <ProjectCardContentBottom
                    {...(profile.username
                        ? { as: Link, to: `profile/${profile.username}` }
                        : {})}
                >
                    <ProjectCardContentBottomPhoto>
                        <ProfilePhotoFallback>
                            {fallbackInitial}
                        </ProfilePhotoFallback>
                        {profile.photoUrl && (
                            <Photo
                                src={profile.photoUrl}
                                alt={displayName}
                                showLoadingPlaceholder={false}
                            />
                        )}
                    </ProjectCardContentBottomPhoto>
                    <ProjectCardContentBottomID>
                        <ProjectCardContentBottomHeader>
                            {displayName}
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
