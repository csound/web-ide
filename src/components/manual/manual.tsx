import React from "react";
import { Theme, useTheme } from "@emotion/react";
import { Link, useParams } from "react-router";
import { DebounceInput } from "react-debounce-input";
import { doc, getDoc } from "firebase/firestore";
import Fuse from "fuse.js";
import { manual as manualRef } from "@config/firestore";
import * as SS from "./styles";

export interface StaticManualEntry {
    id: string;
    opname: string;
    type: string;
    short_desc: string;
    synopsis: string[];
}

function CsoundManualIndex() {
    const theme = useTheme();
    const [isMounted, setIsMounted] = React.useState(false);
    const [filterString, setFilterString] = React.useState("");
    const [filteredDocuments, setFilteredDocuments]: [
        StaticManualEntry[] | undefined,
        React.Dispatch<React.SetStateAction<StaticManualEntry[] | undefined>>
    ] = React.useState();
    const [allDocuments, setAllDocuments] = React.useState(
        [] as StaticManualEntry[]
    );

    const handleSearch = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterString(event.currentTarget.value);
            if (event.currentTarget.value) {
                const fuse = new Fuse(allDocuments, {
                    shouldSort: true,
                    findAllMatches: true,
                    threshold: 0.2,
                    location: 0,
                    distance: 100,
                    minMatchCharLength: 1,
                    keys: ["opname", "short_desc"]
                });

                setFilteredDocuments(
                    fuse.search(event.currentTarget.value).map((i) => i.item)
                );
            } else {
                setFilteredDocuments(undefined);
            }
        },
        [allDocuments, setFilteredDocuments, setFilterString]
    );

    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            document.title = "Csound Manual";
            fetch("/static-manual-index.json").then(async (response) => {
                setAllDocuments((await response.json()) as StaticManualEntry[]);
            });
        }
    }, [isMounted, setIsMounted, setAllDocuments]);

    const scoregens = (
        Array.isArray(filteredDocuments) ? filteredDocuments : allDocuments
    ).filter((doc) => doc.type === "scoregen");
    const opcodes = (
        Array.isArray(filteredDocuments) ? filteredDocuments : allDocuments
    ).filter((doc) => doc.type === "opcode");

    const opcodesComp = opcodes.map((opc, index) => {
        return (
            <Link key={index} to={`/manual/${opc.id}`} css={SS.entry}>
                <div css={SS.opcodeContainer}>
                    <span>{opc.opname}</span>
                </div>
                <p>{opc.short_desc}</p>
            </Link>
        );
    });

    const scoregensComp = scoregens.map((opc, index) => {
        return (
            <Link key={index} to={`/manual/${opc.id}`} css={SS.entry}>
                <div css={SS.opcodeContainer}>
                    <span>{opc.opname}</span>
                </div>
                <p>{opc.short_desc}</p>
            </Link>
        );
    });

    return (
        <div css={SS.page(theme)}>
            <div>
                <DebounceInput
                    css={SS.searchInput(theme)}
                    minLength={1}
                    debounceTimeout={300}
                    value={filterString}
                    onChange={handleSearch}
                    type="text"
                    className="manual-main-form-control"
                    placeholder="Search by name or description"
                />
            </div>
            <h1 css={SS.title(theme)}>The Canonical Csound Reference Manual</h1>
            {opcodes.length > 0 && (
                <h2 css={SS.sectionTitle(theme)}>
                    Orchestra Opcodes and Operators
                </h2>
            )}
            {opcodesComp}
            {scoregens.length > 0 && (
                <h2 css={SS.sectionTitle(theme)}>
                    Score Statements and GEN Routines
                </h2>
            )}
            {scoregensComp}
        </div>
    );
}

const getStaticStyles = (theme: Theme) => `
  #root { overflow-x: hidden; padding: 12px!important; }
    body {
        background-color: ${theme.background};
    }
    div,p {
        color: ${theme.textColor};
    }
  .manual-synopsis-container {
        background-color: ${theme.highlightBackgroundAlt};
  }
  .manual-synopsis {
    font-weight: 100;
    font-size: 14px;
        color: ${theme.textColor};
        background-color: ${theme.highlightBackgroundAlt};
    padding: 0;
    margin: 0;
  }

  code {
    white-space: pre;
  }

  .manual-refsect1 h1 {
    font-weight: 100;
        color: ${theme.textColor};
  }
  #title h1 {
         color: ${theme.textColor};
  }

  h2 {
        color: ${theme.textColor};
  }
`;

function CsoundManualEntry({ id }: { id: string }) {
    const theme = useTheme();
    const [isMounted, setIsMounted] = React.useState(false);
    const [htmlEntry, setHtmlEntry] = React.useState("");

    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            getDoc(doc(manualRef, id))
                .then(async (snapshot) => {
                    const data = await snapshot.data();
                    if (
                        typeof data === "object" &&
                        typeof data.html === "string"
                    ) {
                        setHtmlEntry(data.html.replace(/&#xD;/g, "\n"));
                    }
                })
                .catch(() => setIsMounted(false));
        }
    }, [isMounted, setIsMounted, id, setHtmlEntry]);

    return (
        <div>
            <style>{getStaticStyles(theme)}</style>
            <div dangerouslySetInnerHTML={{ __html: htmlEntry }} />
        </div>
    );
}

export default function CsoundManual() {
    const routerParams = useParams();

    return routerParams && routerParams.id ? (
        <CsoundManualEntry id={routerParams.id} />
    ) : (
        <CsoundManualIndex />
    );
}
