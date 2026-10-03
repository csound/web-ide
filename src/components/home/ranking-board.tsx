import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import * as SS from "./styles";

export const RankingBoard = ({
    id,
    title,
    description,
    loading,
    error,
    empty,
    onRetry,
    children
}: {
    id: string;
    title: string;
    description: string;
    loading: boolean;
    error: string | null;
    empty: string | false;
    onRetry: () => void;
    children: ReactNode;
}) => (
    <section css={SS.rankingSection} aria-labelledby={id}>
        <div css={SS.rankingHeading}>
            <h2 id={id} css={SS.homePageHeading}>
                {title}
            </h2>
            <p css={SS.artistBoardSubheading}>{description}</p>
        </div>
        {loading ? (
            <ol
                css={SS.artistBoard}
                aria-label={"Loading " + title.toLowerCase()}
                aria-busy="true"
            >
                {Array.from({ length: 8 }, (_, index) => (
                    <li
                        key={index}
                        css={SS.artistBoardRowSkeleton}
                        aria-hidden="true"
                    >
                        <span />
                        <span />
                        <span />
                    </li>
                ))}
            </ol>
        ) : error ? (
            <div css={SS.artistBoardEmptyState}>
                <p role="alert">{error}</p>
                <Button color="inherit" onClick={onRetry}>
                    Try again
                </Button>
            </div>
        ) : empty ? (
            <p css={SS.artistBoardEmptyState}>{empty}</p>
        ) : (
            <ol css={SS.artistBoard}>{children}</ol>
        )}
    </section>
);
